package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/pkg/pagination"
)

const (
	UsageCleanupStatusPending   = "pending"
	UsageCleanupStatusRunning   = "running"
	UsageCleanupStatusSucceeded = "succeeded"
	UsageCleanupStatusFailed    = "failed"
	UsageCleanupStatusCanceled  = "canceled"

	UsageRetentionUnitDay   = "day"
	UsageRetentionUnitWeek  = "week"
	UsageRetentionUnitMonth = "month"
)

// UsageCleanupFilters 定义清理任务过滤条件
// 时间范围为必填，其他字段可选
// JSON 序列化用于存储任务参数
//
// start_time/end_time 使用 RFC3339 时间格式
// 以 UTC 或用户时区解析后的时间为准
//
// 说明：
// - nil 表示未设置该过滤条件
// - 过滤条件均为精确匹配
type UsageCleanupFilters struct {
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	UserID      *int64    `json:"user_id,omitempty"`
	APIKeyID    *int64    `json:"api_key_id,omitempty"`
	AccountID   *int64    `json:"account_id,omitempty"`
	GroupID     *int64    `json:"group_id,omitempty"`
	Model       *string   `json:"model,omitempty"`
	RequestType *int16    `json:"request_type,omitempty"`
	Stream      *bool     `json:"stream,omitempty"`
	BillingType *int8     `json:"billing_type,omitempty"`
	// RetentionValue/RetentionUnit identify a relative-retention cleanup.
	// The absolute cutoff is persisted in EndTime so retries always delete the
	// same immutable range instead of moving with the current time.
	RetentionValue int    `json:"retention_value,omitempty"`
	RetentionUnit  string `json:"retention_unit,omitempty"`
}

func (f UsageCleanupFilters) IsRetentionCleanup() bool {
	return f.RetentionValue > 0 || strings.TrimSpace(f.RetentionUnit) != ""
}

// UsageRetentionCutoff converts a relative retention window to an immutable
// cutoff. Days and weeks use calendar-day arithmetic so DST transitions do not
// move the user's wall-clock cutoff. Months clamp to the target month's last day.
func UsageRetentionCutoff(now time.Time, value int, unit string) (time.Time, error) {
	unit = strings.ToLower(strings.TrimSpace(unit))
	if value <= 0 {
		return time.Time{}, fmt.Errorf("retention_value must be positive")
	}

	switch unit {
	case UsageRetentionUnitDay:
		if value > 3650 {
			return time.Time{}, fmt.Errorf("retention_value exceeds 3650 days")
		}
		return now.AddDate(0, 0, -value), nil
	case UsageRetentionUnitWeek:
		if value > 520 {
			return time.Time{}, fmt.Errorf("retention_value exceeds 520 weeks")
		}
		return now.AddDate(0, 0, -7*value), nil
	case UsageRetentionUnitMonth:
		if value > 120 {
			return time.Time{}, fmt.Errorf("retention_value exceeds 120 months")
		}
		return subtractUsageRetentionMonths(now, value), nil
	default:
		return time.Time{}, fmt.Errorf("retention_unit must be day, week, or month")
	}
}

func subtractUsageRetentionMonths(now time.Time, months int) time.Time {
	targetMonthStart := time.Date(now.Year(), now.Month()-time.Month(months), 1, now.Hour(), now.Minute(), now.Second(), now.Nanosecond(), now.Location())
	lastDay := time.Date(targetMonthStart.Year(), targetMonthStart.Month()+1, 0, now.Hour(), now.Minute(), now.Second(), now.Nanosecond(), now.Location()).Day()
	day := now.Day()
	if day > lastDay {
		day = lastDay
	}
	return time.Date(targetMonthStart.Year(), targetMonthStart.Month(), day, now.Hour(), now.Minute(), now.Second(), now.Nanosecond(), now.Location())
}

// UsageCleanupTask 表示使用记录清理任务
// 状态包含 pending/running/succeeded/failed/canceled
type UsageCleanupTask struct {
	ID          int64
	Status      string
	Filters     UsageCleanupFilters
	CreatedBy   int64
	DeletedRows int64
	ErrorMsg    *string
	CanceledBy  *int64
	CanceledAt  *time.Time
	StartedAt   *time.Time
	FinishedAt  *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// UsageCleanupRepository 定义清理任务持久层接口
type UsageCleanupRepository interface {
	CreateTask(ctx context.Context, task *UsageCleanupTask) error
	ListTasks(ctx context.Context, params pagination.PaginationParams) ([]UsageCleanupTask, *pagination.PaginationResult, error)
	// ClaimNextPendingTask 抢占下一条可执行任务：
	// - 优先 pending
	// - 若 running 超过 staleRunningAfterSeconds（可能由于进程退出/崩溃/超时），允许重新抢占继续执行
	ClaimNextPendingTask(ctx context.Context, staleRunningAfterSeconds int64) (*UsageCleanupTask, error)
	// GetTaskStatus 查询任务状态；若不存在返回 sql.ErrNoRows
	GetTaskStatus(ctx context.Context, taskID int64) (string, error)
	// UpdateTaskProgress 更新任务进度（deleted_rows）用于断点续跑/展示
	UpdateTaskProgress(ctx context.Context, taskID int64, deletedRows int64) error
	// CancelTask 将任务标记为 canceled（仅允许 pending/running）
	CancelTask(ctx context.Context, taskID int64, canceledBy int64) (bool, error)
	MarkTaskSucceeded(ctx context.Context, taskID int64, deletedRows int64) error
	MarkTaskFailed(ctx context.Context, taskID int64, deletedRows int64, errorMsg string) error
	DeleteUsageLogsBatch(ctx context.Context, filters UsageCleanupFilters, limit int) (int64, error)
}
