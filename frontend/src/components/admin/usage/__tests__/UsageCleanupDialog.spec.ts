import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import UsageCleanupDialog from '../UsageCleanupDialog.vue'

const mockCreateCleanupTask = vi.fn()
const mockListCleanupTasks = vi.fn()
const mockCancelCleanupTask = vi.fn()
const mockShowError = vi.fn()
const mockShowSuccess = vi.fn()

vi.mock('@/api/admin/usage', () => {
  const api = {
    createCleanupTask: (...args: unknown[]) => mockCreateCleanupTask(...args),
    listCleanupTasks: (...args: unknown[]) => mockListCleanupTasks(...args),
    cancelCleanupTask: (...args: unknown[]) => mockCancelCleanupTask(...args)
  }
  return { adminUsageAPI: api, default: api }
})

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    showError: mockShowError,
    showSuccess: mockShowSuccess
  })
}))

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key
    })
  }
})

const BaseDialogStub = defineComponent({
  props: { show: Boolean },
  template: '<div v-if="show"><slot /><slot name="footer" /></div>'
})

const ConfirmDialogStub = defineComponent({
  props: { show: Boolean },
  emits: ['confirm', 'cancel'],
  template: '<button v-if="show" data-testid="confirm-cleanup" @click="$emit(\'confirm\')">confirm</button>'
})

function mountDialog() {
  return mount(UsageCleanupDialog, {
    props: {
      show: true,
      filters: {},
      startDate: '2026-07-01',
      endDate: '2026-07-30'
    },
    global: {
      stubs: {
        BaseDialog: BaseDialogStub,
        ConfirmDialog: ConfirmDialogStub,
        UsageFilters: true,
        Pagination: true
      }
    }
  })
}

describe('UsageCleanupDialog retention cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListCleanupTasks.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 5 })
    mockCreateCleanupTask.mockResolvedValue({ id: 1 })
  })

  it('submits a server-side day/week/month retention window', async () => {
    const wrapper = mountDialog()

    expect(wrapper.get('[data-testid="cleanup-mode-retention"]').attributes('aria-checked')).toBe('true')
    await wrapper.get('[data-testid="retention-value"]').setValue('2')
    await wrapper.get('[data-testid="retention-unit"]').setValue('month')
    await wrapper.get('.btn-danger').trigger('click')
    await wrapper.get('[data-testid="confirm-cleanup"]').trigger('click')
    await flushPromises()

    expect(mockCreateCleanupTask).toHaveBeenCalledTimes(1)
    expect(mockCreateCleanupTask).toHaveBeenCalledWith(expect.objectContaining({
      retention_value: 2,
      retention_unit: 'month',
      timezone: expect.any(String)
    }))
    expect(mockCreateCleanupTask.mock.calls[0][0]).not.toHaveProperty('start_date')
    expect(mockCreateCleanupTask.mock.calls[0][0]).not.toHaveProperty('end_date')
  })

  it('keeps the existing explicit date-range mode available', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="cleanup-mode-range"]').trigger('click')

    expect(wrapper.get('[data-testid="cleanup-mode-range"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.find('usage-filters-stub').exists()).toBe(true)
  })
})
