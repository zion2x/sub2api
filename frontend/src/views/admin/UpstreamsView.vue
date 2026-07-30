<template>
  <AppLayout>
    <TablePageLayout>
      <template #actions>
        <section
          class="grid grid-cols-2 gap-2 lg:grid-cols-4"
          :aria-label="t('admin.upstreams.overview.title')"
        >
          <div class="overview-metric" data-testid="upstream-overview-total">
            <span class="overview-label">{{ t('admin.upstreams.overview.totalAccounts') }}</span>
            <strong class="overview-value">{{ pagination.total }}</strong>
          </div>
          <div class="overview-metric" data-testid="upstream-overview-balance">
            <span class="overview-label">{{ t('admin.upstreams.overview.pageBalance') }}</span>
            <strong class="overview-value font-mono">{{ formatCurrency(overview.pageBalance) }}</strong>
            <span class="overview-hint">
              {{ t('admin.upstreams.overview.balanceCoverage', { known: overview.knownBalances, total: accounts.length }) }}
            </span>
          </div>
          <div class="overview-metric" data-testid="upstream-overview-account-charge">
            <span class="overview-label">{{ t('admin.upstreams.overview.todayAccountCharge') }}</span>
            <strong class="overview-value font-mono">
              {{ todayStatsLoading ? '...' : todayStatsFailed ? '-' : formatCurrency(overview.todayAccountCharge) }}
            </strong>
          </div>
          <div class="overview-metric" data-testid="upstream-overview-actual-cost">
            <span class="overview-label">{{ t('admin.upstreams.overview.todayActualCost') }}</span>
            <strong class="overview-value font-mono">
              {{ todayStatsLoading ? '...' : todayStatsFailed ? '-' : formatCurrency(overview.todayActualCost) }}
            </strong>
          </div>
        </section>
      </template>

      <template #filters>
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative w-full sm:w-80">
            <Icon
              name="search"
              size="md"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="searchQuery"
              type="search"
              :placeholder="t('admin.upstreams.searchPlaceholder')"
              class="input pl-10"
              @input="scheduleSearch"
            />
          </div>
          <div class="flex flex-1 justify-end">
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="loading"
              :title="t('admin.upstreams.refreshList')"
              @click="loadUpstreams"
            >
              <Icon name="refresh" size="md" :class="{ 'animate-spin': loading }" />
            </button>
          </div>
        </div>
      </template>

      <template #table>
        <div class="upstreams-table flex min-h-0 flex-1 flex-col overflow-hidden">
          <DataTable :columns="columns" :data="accounts" :loading="loading" :sticky-first-column="true">
            <template #cell-account="{ row }">
              <div class="min-w-44 space-y-1.5">
                <div class="flex items-center gap-2">
                  <span class="max-w-48 truncate font-medium text-gray-900 dark:text-white" :title="row.name">
                    {{ row.name }}
                  </span>
                  <span :class="['badge', statusClass(row.status)]">
                    {{ t(`admin.accounts.status.${row.status}`) }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <PlatformTypeBadge :platform="row.platform" :type="row.type" />
                  <span class="text-[11px] text-gray-400">{{ t('admin.upstreams.accountId', { id: row.id }) }}</span>
                </div>
              </div>
            </template>

            <template #cell-base_url="{ row }">
              <code
                v-if="getUpstreamBaseUrl(row)"
                class="block max-w-64 break-all rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-dark-700 dark:text-gray-200"
                :title="getUpstreamBaseUrl(row)"
              >
                {{ getUpstreamBaseUrl(row) }}
              </code>
              <span v-else class="text-gray-400">-</span>
            </template>

            <template #cell-provider_balance="{ row }">
              <div class="min-w-28 space-y-1.5" :data-testid="`upstream-balance-${row.id}`">
                <span v-if="probeData(row)?.provider" class="badge badge-primary uppercase">
                  {{ probeData(row)?.provider }}
                </span>
                <span v-else class="badge badge-gray">{{ t('admin.upstreams.unknownProvider') }}</span>
                <div v-if="probeData(row)?.unlimited_quota" class="font-medium text-emerald-700 dark:text-emerald-300">
                  {{ t('admin.upstreams.unlimitedQuota') }}
                </div>
                <div v-else-if="typeof probeData(row)?.balance === 'number'" class="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  {{ formatBalance(probeData(row)?.balance, probeData(row)?.currency) }}
                </div>
                <div v-else class="text-xs text-gray-400">{{ t('admin.upstreams.balanceUnavailable') }}</div>
              </div>
            </template>

            <template #cell-remote_group="{ row }">
              <div class="min-w-36 space-y-1">
                <div class="font-medium" :class="remoteGroupTextClass(row)">
                  {{ remoteGroupName(row) }}
                </div>
                <span
                  v-if="probeData(row)?.remote_group_exists === false"
                  class="badge badge-danger inline-flex items-center gap-1"
                >
                  <Icon name="exclamationTriangle" size="xs" />
                  {{ t('admin.upstreams.groupMissing') }}
                </span>
                <span
                  v-else-if="remoteGroupUnavailable(row)"
                  class="badge badge-danger inline-flex items-center gap-1"
                >
                  <Icon name="exclamationTriangle" size="xs" />
                  {{ t('admin.upstreams.groupUnavailable') }}
                </span>
                <span
                  v-else-if="probeData(row)?.group_routing_healthy === false"
                  class="badge badge-danger inline-flex items-center gap-1"
                >
                  <Icon name="exclamationTriangle" size="xs" />
                  {{ t('admin.upstreams.groupRoutingUnavailable') }}
                </span>
                <span v-else-if="probeData(row)?.remote_group_exists === true" class="badge badge-success">
                  {{ t('admin.upstreams.groupExists') }}
                </span>
                <span v-else-if="probeData(row)?.group_routing_healthy === true" class="badge badge-success">
                  {{ t('admin.upstreams.groupRoutingHealthy') }}
                </span>
                <span v-else class="text-xs text-gray-400">{{ t('admin.upstreams.groupUnknown') }}</span>
                <div v-if="hasRemoteGroupId(row)" class="text-[11px] text-gray-400">
                  {{ t('admin.upstreams.groupId', { id: probeData(row)?.remote_group_id }) }}
                </div>
              </div>
            </template>

            <template #cell-rates="{ row }">
              <div class="min-w-44 space-y-1.5">
                <div
                  class="flex items-baseline gap-2 font-mono text-sm font-semibold text-gray-900 dark:text-white"
                  :data-testid="`upstream-rates-${row.id}`"
                >
                  <span :class="typeof upstreamRate(row) === 'number' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-400'">
                    {{ typeof upstreamRate(row) === 'number' ? `${formatRate(upstreamRate(row))}x` : '-' }}
                  </span>
                  <span class="text-gray-300 dark:text-dark-500">/</span>
                  <span>{{ formatRate(row.rate_multiplier ?? 1) }}x</span>
                </div>
                <div class="text-[11px] text-gray-400">
                  {{ t('admin.upstreams.ratePairHint') }}
                </div>
                <div v-if="row.groups?.length" class="flex max-h-24 flex-col gap-1 overflow-y-auto pr-1">
                  <span
                    v-for="group in row.groups"
                    :key="group.id"
                    class="inline-flex w-fit max-w-52 items-center rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700 dark:bg-dark-700 dark:text-gray-200"
                    :title="t('admin.upstreams.localGroupRate', { name: group.name, value: formatRate(group.rate_multiplier) })"
                  >
                    <span class="max-w-36 truncate">{{ group.name }}</span>&nbsp;{{ formatRate(group.rate_multiplier) }}x
                  </span>
                </div>
              </div>
            </template>

            <template #cell-today="{ row }">
              <div class="min-w-28 space-y-1 text-xs">
                <span v-if="todayStatsLoading && !todayStats[String(row.id)]" class="text-gray-400">...</span>
                <div v-else-if="todayStatsFailed" class="text-gray-400">
                  {{ t('admin.upstreams.statsUnavailable') }}
                </div>
                <template v-else>
                  <div class="font-medium text-gray-800 dark:text-gray-100">
                    {{ t('admin.upstreams.todayRequests', { count: todayStats[String(row.id)]?.requests ?? 0 }) }}
                  </div>
                  <div class="text-gray-500 dark:text-gray-400">
                    {{ t('admin.upstreams.todayTokens', { count: formatCount(todayStats[String(row.id)]?.tokens ?? 0) }) }}
                  </div>
                  <div
                    class="font-mono font-semibold text-gray-800 dark:text-gray-100"
                    :data-testid="`upstream-cost-${row.id}`"
                  >
                    {{ formatCurrency(todayStats[String(row.id)]?.cost ?? 0) }}
                    <span class="px-0.5 text-gray-300 dark:text-dark-500">/</span>
                    {{ formatCurrency(todayStats[String(row.id)]?.user_cost ?? 0) }}
                  </div>
                  <div class="text-[11px] text-gray-400">
                    {{ t('admin.upstreams.costPairHint') }}
                  </div>
                </template>
              </div>
            </template>

            <template #cell-sync="{ row }">
              <div class="max-w-56 space-y-1 text-xs">
                <div v-if="getUpstreamObservedAt(row)" class="whitespace-nowrap text-gray-700 dark:text-gray-200">
                  {{ formatDateTime(getUpstreamObservedAt(row)) }}
                </div>
                <div v-else class="text-gray-400">{{ t('admin.upstreams.neverSynced') }}</div>
                <span v-if="probeSnapshot(row)?.status === 'unsupported'" class="badge badge-warning">
                  {{ t('admin.upstreams.unsupported') }}
                </span>
                <span v-else-if="probeSnapshot(row)?.status === 'failed'" class="badge badge-danger">
                  {{ t('admin.upstreams.probeFailed') }}
                </span>
                <span v-else-if="probeSnapshot(row) && !probeFresh(row)" class="badge badge-warning">
                  {{ t('admin.upstreams.staleData') }}
                </span>
                <div
                  v-if="probeSnapshot(row)?.last_error"
                  class="line-clamp-2 text-red-600 dark:text-red-400"
                  :title="probeSnapshot(row)?.last_error"
                >
                  {{ probeSnapshot(row)?.last_error }}
                </div>
              </div>
            </template>

            <template #cell-actions="{ row }">
              <button
                type="button"
                class="rounded p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-primary-900/20 dark:hover:text-primary-400"
                :disabled="probingIds.has(row.id)"
                :title="t('admin.upstreams.syncNow')"
                @click.stop="probeAccount(row)"
              >
                <Icon name="refresh" size="sm" :class="{ 'animate-spin': probingIds.has(row.id) }" />
              </button>
            </template>

            <template #empty>
              <EmptyState
                :title="t('admin.upstreams.emptyTitle')"
                :description="t('admin.upstreams.emptyDescription')"
              />
            </template>
          </DataTable>
        </div>
      </template>

      <template #pagination>
        <Pagination
          v-if="pagination.total > 0"
          :page="pagination.page"
          :page-size="pagination.page_size"
          :total="pagination.total"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </template>
    </TablePageLayout>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminAPI } from '@/api/admin'
import type { Account, UpstreamBillingProbeSnapshot, WindowStats } from '@/types'
import type { Column } from '@/components/common/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import TablePageLayout from '@/components/layout/TablePageLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import PlatformTypeBadge from '@/components/common/PlatformTypeBadge.vue'
import Icon from '@/components/icons/Icon.vue'
import { useAppStore } from '@/stores/app'
import { getPersistedPageSize } from '@/composables/usePersistedPageSize'
import { formatCurrency, formatDateTime } from '@/utils/format'
import {
  getCurrentUpstreamProbeData,
  getUpstreamBaseUrl,
  getUpstreamObservedAt,
  getUpstreamProbeSnapshot,
  isUpstreamProbeFresh,
  type UpstreamProbeData
} from '@/utils/upstreamAccount'

const { t } = useI18n()
const appStore = useAppStore()

const accounts = ref<Account[]>([])
const loading = ref(false)
const todayStatsLoading = ref(false)
const todayStatsFailed = ref(false)
const todayStats = ref<Record<string, WindowStats>>({})
const searchQuery = ref('')
const probingIds = ref(new Set<number>())
const probeNow = ref(Date.now())
const pagination = reactive({
  page: 1,
  page_size: getPersistedPageSize(),
  total: 0,
  pages: 0
})
let searchTimer: ReturnType<typeof setTimeout> | undefined
let freshnessTimer: ReturnType<typeof setInterval> | undefined
let listRequest = 0
let statsRequest = 0

const columns = computed<Column[]>(() => [
  { key: 'account', label: t('admin.upstreams.columns.account'), sortable: false, class: 'min-w-52' },
  { key: 'base_url', label: t('admin.upstreams.columns.baseUrl'), sortable: false, class: 'min-w-56' },
  { key: 'provider_balance', label: t('admin.upstreams.columns.providerBalance'), sortable: false },
  { key: 'remote_group', label: t('admin.upstreams.columns.remoteGroup'), sortable: false },
  { key: 'rates', label: t('admin.upstreams.columns.rates'), sortable: false },
  { key: 'today', label: t('admin.upstreams.columns.today'), sortable: false },
  { key: 'sync', label: t('admin.upstreams.columns.sync'), sortable: false },
  { key: 'actions', label: t('admin.upstreams.columns.actions'), sortable: false, class: 'w-14' }
])

function probeData(account: Account): UpstreamProbeData | undefined {
  return getCurrentUpstreamProbeData(account, probeNow.value)
}

function probeSnapshot(account: Account): UpstreamBillingProbeSnapshot | undefined {
  return getUpstreamProbeSnapshot(account)
}

function statusClass(status: Account['status']): string {
  if (status === 'active') return 'badge-success'
  if (status === 'error') return 'badge-danger'
  return 'badge-gray'
}

function formatRate(value: number | undefined): string {
  return typeof value === 'number' ? value.toFixed(2) : '-'
}

function formatCount(value: number | undefined): string {
  return typeof value === 'number' ? new Intl.NumberFormat().format(value) : '-'
}

function upstreamRate(account: Account): number | undefined {
  const data = probeData(account)
  return data?.effective_rate_multiplier ?? data?.group_rate_multiplier
}

const overview = computed(() => {
  let pageBalance = 0
  let knownBalances = 0
  for (const account of accounts.value) {
    const balance = probeData(account)?.balance
    if (typeof balance === 'number') {
      pageBalance += balance
      knownBalances++
    }
  }

  return {
    pageBalance,
    knownBalances,
    todayAccountCharge: Object.values(todayStats.value).reduce((sum, stats) => sum + (stats.cost ?? 0), 0),
    todayActualCost: Object.values(todayStats.value).reduce((sum, stats) => sum + (stats.user_cost ?? 0), 0)
  }
})

function formatBalance(value: number | undefined, currency?: string): string {
  if (typeof value !== 'number') return '-'
  const normalizedCurrency = currency?.trim().toUpperCase()
  if (normalizedCurrency && /^[A-Z]{3}$/.test(normalizedCurrency)) {
    try {
      return formatCurrency(value, normalizedCurrency)
    } catch {
      // Fall through for non-standard upstream currency identifiers.
    }
  }
  return `${currency ? `${currency} ` : '$'}${value.toFixed(2)}`
}

function hasRemoteGroupId(account: Account): boolean {
  const id = probeData(account)?.remote_group_id
  return id !== undefined && id !== null && id !== ''
}

function remoteGroupName(account: Account): string {
  const data = probeData(account)
  if (data?.remote_group_name) return data.remote_group_name
  if (hasRemoteGroupId(account)) return String(data?.remote_group_id)
  return '-'
}

function remoteGroupTextClass(account: Account): string {
  const data = probeData(account)
  return data?.remote_group_exists === false || remoteGroupUnavailable(account) || data?.group_routing_healthy === false
    ? 'text-red-700 dark:text-red-300'
    : 'text-gray-900 dark:text-white'
}

function remoteGroupUnavailable(account: Account): boolean {
  const status = probeData(account)?.remote_group_status?.trim().toLowerCase()
  return Boolean(status && ['disabled', 'inactive', 'deleted', 'missing', 'unavailable', 'forbidden'].includes(status))
}

function probeFresh(account: Account): boolean {
  return isUpstreamProbeFresh(account, probeNow.value)
}

async function loadTodayStats(accountIds: number[]): Promise<void> {
  const requestId = ++statsRequest
  if (!accountIds.length) {
    todayStats.value = {}
    todayStatsFailed.value = false
    return
  }

  todayStatsLoading.value = true
  todayStatsFailed.value = false
  try {
    const result = await adminAPI.accounts.getBatchTodayStats(accountIds)
    if (requestId !== statsRequest) return
    todayStats.value = result.stats ?? {}
  } catch (error) {
    if (requestId !== statsRequest) return
    todayStats.value = {}
    todayStatsFailed.value = true
    console.error('Failed to load upstream account today stats:', error)
    appStore.showError(t('admin.upstreams.statsFailed'))
  } finally {
    if (requestId === statsRequest) todayStatsLoading.value = false
  }
}

async function loadUpstreams(): Promise<void> {
  const requestId = ++listRequest
  loading.value = true
  try {
    const response = await adminAPI.accounts.listUpstreams(pagination.page, pagination.page_size, {
      search: searchQuery.value.trim() || undefined
    })
    if (requestId !== listRequest) return
    accounts.value = response.items ?? []
    probeNow.value = Date.now()
    pagination.total = response.total
    pagination.pages = response.pages
    void loadTodayStats(accounts.value.map(account => account.id))
  } catch (error) {
    if (requestId !== listRequest) return
    accounts.value = []
    pagination.total = 0
    console.error('Failed to load upstream accounts:', error)
    appStore.showError(t('admin.upstreams.loadFailed'))
  } finally {
    if (requestId === listRequest) loading.value = false
  }
}

function scheduleSearch(): void {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pagination.page = 1
    void loadUpstreams()
  }, 300)
}

function handlePageChange(page: number): void {
  pagination.page = page
  void loadUpstreams()
}

function handlePageSizeChange(pageSize: number): void {
  pagination.page_size = pageSize
  pagination.page = 1
  void loadUpstreams()
}

async function probeAccount(account: Account): Promise<void> {
  if (probingIds.value.has(account.id)) return
  probingIds.value = new Set(probingIds.value).add(account.id)
  try {
    const result = await adminAPI.accounts.probeUpstreamBilling(account.id)
    if (result.snapshot) {
      probeNow.value = Date.now()
      accounts.value = accounts.value.map(item =>
        item.id === account.id
          ? { ...item, extra: { ...item.extra, upstream_billing_probe: result.snapshot } }
          : item
      )
    }
    if (result.error) throw new Error(result.error)
    if (result.snapshot?.status === 'ok') {
      appStore.showSuccess(t('admin.upstreams.syncSuccess'))
    } else if (result.snapshot?.status === 'unsupported') {
      appStore.showError(t('admin.upstreams.unsupported'))
    } else {
      appStore.showError(result.snapshot?.last_error || t('admin.upstreams.syncFailed'))
    }
  } catch (error) {
    console.error('Failed to probe upstream account:', error)
    appStore.showError(error instanceof Error && error.message ? error.message : t('admin.upstreams.syncFailed'))
  } finally {
    const next = new Set(probingIds.value)
    next.delete(account.id)
    probingIds.value = next
  }
}

onMounted(() => {
  void loadUpstreams()
  freshnessTimer = setInterval(() => {
    probeNow.value = Date.now()
  }, 60_000)
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  if (freshnessTimer) clearInterval(freshnessTimer)
  listRequest++
  statsRequest++
})
</script>

<style scoped>
.upstreams-table :deep(th),
.upstreams-table :deep(td) {
  @apply px-3 py-2.5;
}

.upstreams-table :deep(tbody tr) {
  @apply align-top;
}

.overview-metric {
  @apply flex min-h-20 flex-col justify-center rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-dark-700 dark:bg-dark-800;
}

.overview-label {
  @apply text-xs text-gray-500 dark:text-dark-400;
}

.overview-value {
  @apply mt-1 text-lg font-semibold text-gray-900 dark:text-white;
}

.overview-hint {
  @apply mt-0.5 text-[11px] text-gray-400 dark:text-dark-500;
}
</style>
