import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import UpstreamsView from '../UpstreamsView.vue'

const { listUpstreams, getBatchTodayStats, showError } = vi.hoisted(() => ({
  listUpstreams: vi.fn(),
  getBatchTodayStats: vi.fn(),
  showError: vi.fn()
}))

vi.mock('@/api/admin', () => ({
  adminAPI: {
    accounts: {
      listUpstreams,
      getBatchTodayStats,
      probeUpstreamBilling: vi.fn()
    }
  }
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    showError,
    showSuccess: vi.fn()
  })
}))

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key })
  }
})

const DataTableStub = {
  props: ['data'],
  template: `
    <div>
      <div v-for="row in data" :key="row.id" :data-testid="'upstream-row-' + row.id">
        <slot name="cell-provider_balance" :row="row" />
        <slot name="cell-remote_group" :row="row" />
        <slot name="cell-today" :row="row" />
        <slot name="cell-sync" :row="row" />
      </div>
    </div>
  `
}

const baseAccount = (snapshot: Record<string, unknown>) => ({
  id: 7,
  name: 'upstream-7',
  platform: 'openai',
  type: 'apikey',
  status: 'active',
  credentials: { base_url: 'https://upstream.example/v1' },
  groups: [],
  extra: { upstream_billing_probe: snapshot }
})

function mountView() {
  return mount(UpstreamsView, {
    global: {
      stubs: {
        AppLayout: { template: '<div><slot /></div>' },
        TablePageLayout: {
          template: '<div><slot name="filters" /><slot name="table" /><slot name="pagination" /></div>'
        },
        DataTable: DataTableStub,
        EmptyState: true,
        Pagination: true,
        PlatformTypeBadge: true,
        Icon: true
      }
    }
  })
}

describe('admin UpstreamsView', () => {
  beforeEach(() => {
    listUpstreams.mockReset()
    getBatchTodayStats.mockReset()
    showError.mockReset()
    getBatchTodayStats.mockResolvedValue({ stats: { '7': { requests: 2, cost: 1.25 } } })
  })

  it('does not present a disabled remote group as healthy', async () => {
    listUpstreams.mockResolvedValue({
      items: [baseAccount({
        status: 'ok',
        last_attempt_at: '2026-07-29T01:00:00Z',
        received_at: '2026-07-29T01:00:00Z',
        next_probe_at: '2099-01-01T00:01:00Z',
        fresh_until: '2099-01-01T00:02:00Z',
        data: {
          provider: 'sub2api',
          balance: 5,
          remote_group_name: 'legacy',
          remote_group_exists: true,
          remote_group_status: 'disabled'
        }
      })],
      total: 1,
      page: 1,
      page_size: 20,
      pages: 1
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('admin.upstreams.groupUnavailable')
    expect(wrapper.text()).not.toContain('admin.upstreams.groupExists')
    wrapper.unmount()
  })

  it('shows statistics as unavailable when the daily query fails', async () => {
    listUpstreams.mockResolvedValue({
      items: [baseAccount({ status: 'failed', last_attempt_at: '2026-07-29T01:00:00Z', next_probe_at: '2026-07-29T01:01:00Z' })],
      total: 1,
      page: 1,
      page_size: 20,
      pages: 1
    })
    getBatchTodayStats.mockRejectedValue(new Error('stats unavailable'))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('admin.upstreams.statsUnavailable')
    expect(wrapper.text()).not.toContain('admin.upstreams.todayRequests')
    expect(showError).toHaveBeenCalledWith('admin.upstreams.statsFailed')
    wrapper.unmount()
  })

  it('hides stale values from a failed snapshot and keeps its failure state visible', async () => {
    listUpstreams.mockResolvedValue({
      items: [baseAccount({
        status: 'failed',
        last_attempt_at: '2026-07-29T01:01:00Z',
        received_at: '2026-07-29T01:00:00Z',
        next_probe_at: '2099-01-01T00:01:00Z',
        fresh_until: '2099-01-01T00:02:00Z',
        last_error: 'request_failed',
        data: { provider: 'newapi', balance: 99 }
      })],
      total: 1,
      page: 1,
      page_size: 20,
      pages: 1
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('admin.upstreams.balanceUnavailable')
    expect(wrapper.text()).toContain('admin.upstreams.probeFailed')
    expect(wrapper.text()).toContain('request_failed')
    expect(wrapper.text()).not.toContain('$99.00')
    wrapper.unmount()
  })

  it('renders the unsupported badge even when the snapshot also has an error detail', async () => {
    listUpstreams.mockResolvedValue({
      items: [baseAccount({
        status: 'unsupported',
        last_attempt_at: '2026-07-29T01:00:00Z',
        next_probe_at: '2026-07-29T01:01:00Z',
        last_error: 'unsupported'
      })],
      total: 1,
      page: 1,
      page_size: 20,
      pages: 1
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('admin.upstreams.unsupported')
    wrapper.unmount()
  })
})
