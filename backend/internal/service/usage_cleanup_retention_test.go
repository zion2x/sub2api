package service

import (
	"context"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/config"
	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/stretchr/testify/require"
)

func TestUsageRetentionCutoff(t *testing.T) {
	newYork, err := time.LoadLocation("America/New_York")
	require.NoError(t, err)

	tests := []struct {
		name  string
		now   time.Time
		value int
		unit  string
		want  time.Time
	}{
		{
			name:  "day keeps wall clock across DST",
			now:   time.Date(2026, 3, 9, 12, 30, 0, 0, newYork),
			value: 1,
			unit:  UsageRetentionUnitDay,
			want:  time.Date(2026, 3, 8, 12, 30, 0, 0, newYork),
		},
		{
			name:  "week uses seven calendar days",
			now:   time.Date(2026, 7, 30, 8, 15, 0, 0, time.UTC),
			value: 2,
			unit:  UsageRetentionUnitWeek,
			want:  time.Date(2026, 7, 16, 8, 15, 0, 0, time.UTC),
		},
		{
			name:  "month clamps to target month end",
			now:   time.Date(2025, 3, 31, 9, 0, 0, 0, time.UTC),
			value: 1,
			unit:  UsageRetentionUnitMonth,
			want:  time.Date(2025, 2, 28, 9, 0, 0, 0, time.UTC),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := UsageRetentionCutoff(tt.now, tt.value, tt.unit)
			require.NoError(t, err)
			require.Equal(t, tt.want, got)
		})
	}
}

func TestUsageRetentionCutoffRejectsInvalidInput(t *testing.T) {
	tests := []struct {
		value int
		unit  string
	}{
		{0, UsageRetentionUnitDay},
		{3651, UsageRetentionUnitDay},
		{521, UsageRetentionUnitWeek},
		{121, UsageRetentionUnitMonth},
		{1, "year"},
	}
	for _, tt := range tests {
		_, err := UsageRetentionCutoff(time.Now(), tt.value, tt.unit)
		require.Error(t, err)
	}
}

func TestUsageCleanupServiceRetentionBypassesManualRangeLimit(t *testing.T) {
	repo := &cleanupRepoStub{}
	svc := NewUsageCleanupService(repo, nil, nil, &config.Config{
		UsageCleanup: config.UsageCleanupConfig{Enabled: true, MaxRangeDays: 1},
	})

	filters := UsageCleanupFilters{
		StartTime:      time.Unix(0, 0).UTC(),
		EndTime:        time.Now().UTC().AddDate(0, 0, -7),
		RetentionValue: 1,
		RetentionUnit:  " WEEK ",
	}
	task, err := svc.CreateTask(context.Background(), filters, 7)
	require.NoError(t, err)
	require.Equal(t, UsageRetentionUnitWeek, task.Filters.RetentionUnit)
}

func TestUsageCleanupServiceRetentionRejectsInvalidUnit(t *testing.T) {
	repo := &cleanupRepoStub{}
	svc := NewUsageCleanupService(repo, nil, nil, &config.Config{
		UsageCleanup: config.UsageCleanupConfig{Enabled: true},
	})

	_, err := svc.CreateTask(context.Background(), UsageCleanupFilters{
		StartTime:      time.Unix(0, 0).UTC(),
		EndTime:        time.Now().UTC().AddDate(0, 0, -1),
		RetentionValue: 1,
		RetentionUnit:  "year",
	}, 7)
	require.Error(t, err)
	require.Equal(t, "USAGE_CLEANUP_INVALID_RETENTION", infraerrors.Reason(err))
}

func TestUsageCleanupServiceRetentionPreservesAggregates(t *testing.T) {
	dashboardRepo := &dashboardRepoStub{}
	repo := &cleanupRepoStub{deleteQueue: []cleanupDeleteResponse{{deleted: 0}}}
	dashboard := NewDashboardAggregationService(dashboardRepo, nil, &config.Config{
		DashboardAgg: config.DashboardAggregationConfig{Enabled: true},
	})
	svc := NewUsageCleanupService(repo, nil, dashboard, &config.Config{
		UsageCleanup: config.UsageCleanupConfig{Enabled: true, BatchSize: 2},
	})

	svc.executeTask(context.Background(), &UsageCleanupTask{
		ID: 91,
		Filters: UsageCleanupFilters{
			StartTime:      time.Unix(0, 0).UTC(),
			EndTime:        time.Now().UTC().AddDate(0, 0, -30),
			RetentionValue: 1,
			RetentionUnit:  UsageRetentionUnitMonth,
		},
	})

	require.Zero(t, dashboardRepo.recomputeCalls)
}
