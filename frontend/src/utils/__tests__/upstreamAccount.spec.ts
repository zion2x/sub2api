import { describe, expect, it } from 'vitest'
import type { Account } from '@/types'
import {
  getCurrentUpstreamProbeData,
  getUpstreamBaseUrl,
  getUpstreamObservedAt,
  getUpstreamProbeData,
  isUpstreamAccountType,
  isUpstreamProbeFresh
} from '../upstreamAccount'

const account = (overrides: Partial<Account> = {}): Account => ({
  id: 1,
  name: 'upstream',
  platform: 'openai',
  type: 'apikey',
  proxy_id: null,
  concurrency: 1,
  priority: 1,
  status: 'active',
  error_message: null,
  last_used_at: null,
  expires_at: null,
  auto_pause_on_expired: false,
  created_at: '',
  updated_at: '',
  schedulable: true,
  rate_limited_at: null,
  rate_limit_reset_at: null,
  overload_until: null,
  temp_unschedulable_until: null,
  temp_unschedulable_reason: null,
  session_window_start: null,
  session_window_end: null,
  session_window_status: null,
  ...overrides
})

describe('upstream account helpers', () => {
  it('reads enriched fields from the existing snapshot data wrapper', () => {
    const value = account({
      extra: {
        upstream_billing_probe: {
          status: 'ok',
          last_attempt_at: '2026-07-29T01:00:00Z',
          next_probe_at: '2026-07-29T01:01:00Z',
          data: {
            object: 'sub2api.key_billing',
            schema_version: 1,
            billing_scope: 'token',
            group_rate_multiplier: 1.2,
            resolved_rate_multiplier: 1.2,
            peak_rate_enabled: false,
            effective_rate_multiplier: 1.2,
            observed_at: '2026-07-29T01:00:00Z',
            provider: 'sub2api',
            balance: 9.5,
            remote_group_exists: false
          }
        }
      }
    })

    expect(getUpstreamProbeData(value)).toMatchObject({
      provider: 'sub2api',
      balance: 9.5,
      remote_group_exists: false
    })
    expect(getUpstreamObservedAt(value)).toBe('2026-07-29T01:00:00Z')
  })

  it('supports enriched fields stored directly on the snapshot', () => {
    const value = account({
      extra: {
        upstream_billing_probe: {
          status: 'ok',
          last_attempt_at: '2026-07-29T01:00:00Z',
          next_probe_at: '2026-07-29T01:01:00Z',
          provider: 'newapi',
          balance: 15,
          remote_group_id: 'default',
          observed_at: '2026-07-29T00:59:00Z'
        }
      }
    })

    expect(getUpstreamProbeData(value)?.provider).toBe('newapi')
    expect(getUpstreamProbeData(value)?.remote_group_id).toBe('default')
    expect(getUpstreamObservedAt(value)).toBe('2026-07-29T00:59:00Z')
  })

  it('merges direct compatibility fields with legacy billing data', () => {
    const value = account({
      extra: {
        upstream_billing_probe: {
          status: 'ok',
          last_attempt_at: '2026-07-29T01:00:00Z',
          next_probe_at: '2026-07-29T01:01:00Z',
          provider: 'newapi',
          balance: 12,
          data: {
            object: 'sub2api.key_billing',
            schema_version: 1,
            billing_scope: 'token',
            group_rate_multiplier: 0.8,
            resolved_rate_multiplier: 0.8,
            peak_rate_enabled: false,
            effective_rate_multiplier: 0.8,
            observed_at: '2026-07-29T01:00:00Z'
          }
        }
      }
    })

    expect(getUpstreamProbeData(value)).toMatchObject({
      provider: 'newapi',
      balance: 12,
      effective_rate_multiplier: 0.8
    })
  })

  it('prefers the credential base URL and falls back to account fields', () => {
    expect(getUpstreamBaseUrl(account({ credentials: { base_url: ' https://upstream.example/v1 ' } })))
      .toBe('https://upstream.example/v1')
    expect(getUpstreamBaseUrl(account({ custom_base_url: 'https://fallback.example' })))
      .toBe('https://fallback.example')
  })

  it('only exposes current data from a successful, unexpired snapshot', () => {
    const value = account({
      extra: {
        upstream_billing_probe: {
          status: 'ok',
          last_attempt_at: '2026-07-29T01:00:00Z',
          next_probe_at: '2026-07-29T01:01:00Z',
          fresh_until: '2026-07-29T01:02:00Z',
          data: { provider: 'sub2api', balance: 9.5 }
        }
      }
    })

    const current = Date.parse('2026-07-29T01:01:00Z')
    expect(isUpstreamProbeFresh(value, current)).toBe(true)
    expect(getCurrentUpstreamProbeData(value, current)?.balance).toBe(9.5)
    expect(getCurrentUpstreamProbeData(value, Date.parse('2026-07-29T01:03:00Z'))).toBeUndefined()

    value.extra!.upstream_billing_probe!.status = 'failed'
    expect(getCurrentUpstreamProbeData(value, current)).toBeUndefined()
  })

  it('classifies setup-token and OAuth accounts outside the upstream account view', () => {
    expect(isUpstreamAccountType('apikey')).toBe(true)
    expect(isUpstreamAccountType('bedrock')).toBe(true)
    expect(isUpstreamAccountType('oauth')).toBe(false)
    expect(isUpstreamAccountType('setup-token')).toBe(false)
  })
})
