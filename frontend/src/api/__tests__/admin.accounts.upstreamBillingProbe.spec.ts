import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get, post, put } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn()
}))

vi.mock('@/api/client', () => ({
  apiClient: { get, post, put }
}))

import {
  getUpstreamBillingProbeSettings,
  listUpstreams,
  probeUpstreamBilling,
  probeUpstreamBillingBatch,
  setUpstreamBillingProbeEnabled,
  updateUpstreamBillingProbeSettings
} from '@/api/admin/accounts'

describe('admin account upstream billing probe API', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    put.mockReset()
  })

  it('reads and updates global settings', async () => {
    const settings = { enabled: true, interval_minutes: 1 }
    get.mockResolvedValueOnce({ data: settings })
    put.mockResolvedValueOnce({ data: settings })

    await expect(getUpstreamBillingProbeSettings()).resolves.toEqual(settings)
    await expect(updateUpstreamBillingProbeSettings(settings)).resolves.toEqual(settings)
    expect(get).toHaveBeenCalledWith('/admin/accounts/upstream-billing-probe/settings')
    expect(put).toHaveBeenCalledWith('/admin/accounts/upstream-billing-probe/settings', settings)
  })

  it('lists accounts with the non-OAuth virtual filter', async () => {
    const response = { items: [], total: 0, page: 2, page_size: 50, pages: 0 }
    get.mockResolvedValueOnce({ data: response })

    await expect(listUpstreams(2, 50, { search: 'newapi', status: 'active' })).resolves.toEqual(response)
    expect(get).toHaveBeenCalledWith('/admin/accounts', {
      params: {
        page: 2,
        page_size: 50,
        search: 'newapi',
        status: 'active',
        type: 'non_oauth'
      },
      signal: undefined
    })
  })

  it('uses dedicated account and batch endpoints', async () => {
    const result = { account_id: 7, snapshot: { status: 'unsupported' } }
    put.mockResolvedValueOnce({ data: {} })
    post.mockResolvedValueOnce({ data: result })
    post.mockResolvedValueOnce({ data: { results: [result] } })

    await setUpstreamBillingProbeEnabled(7, true)
    await expect(probeUpstreamBilling(7)).resolves.toEqual(result)
    await expect(probeUpstreamBillingBatch([7])).resolves.toEqual([result])

    expect(put).toHaveBeenCalledWith('/admin/accounts/7/upstream-billing-probe', { enabled: true })
    expect(post).toHaveBeenNthCalledWith(1, '/admin/accounts/7/upstream-billing-probe')
    expect(post).toHaveBeenNthCalledWith(2, '/admin/accounts/upstream-billing-probe/batch', { account_ids: [7] })
  })
})
