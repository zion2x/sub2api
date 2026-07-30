import type { Account, UpstreamBillingData, UpstreamBillingProbeSnapshot } from '@/types'

export type UpstreamProbeData = Partial<UpstreamBillingData> & {
  provider?: 'sub2api' | 'newapi'
  balance?: number
  currency?: string
  key_quota_remaining?: number
  unlimited_quota?: boolean
  group_routing_healthy?: boolean
  remote_group_id?: string | number
  remote_group_name?: string
  remote_group_exists?: boolean
  remote_group_status?: string
  group_rate_multiplier?: number
  effective_rate_multiplier?: number
  observed_at?: string
}

export function getUpstreamProbeSnapshot(account: Account): UpstreamBillingProbeSnapshot | undefined {
  return account.extra?.upstream_billing_probe
}

export function getUpstreamProbeData(account: Account): UpstreamProbeData | undefined {
  const snapshot = getUpstreamProbeSnapshot(account)
  if (!snapshot) return undefined
  return { ...snapshot, ...snapshot.data } as UpstreamProbeData
}

export function isUpstreamProbeFresh(account: Account, now: number = Date.now()): boolean {
  const snapshot = getUpstreamProbeSnapshot(account)
  if (snapshot?.status !== 'ok' || typeof snapshot.fresh_until !== 'string') return false
  const freshUntil = Date.parse(snapshot.fresh_until)
  return Number.isFinite(freshUntil) && freshUntil > now
}

export function getCurrentUpstreamProbeData(
  account: Account,
  now: number = Date.now()
): UpstreamProbeData | undefined {
  return isUpstreamProbeFresh(account, now) ? getUpstreamProbeData(account) : undefined
}

export function isUpstreamAccountType(type: string | null | undefined): boolean {
  return Boolean(type && type !== 'oauth' && type !== 'setup-token')
}

export function getUpstreamBaseUrl(account: Account): string {
  const credentialsUrl = account.credentials?.base_url
  if (typeof credentialsUrl === 'string' && credentialsUrl.trim()) return credentialsUrl.trim()
  if (typeof account.custom_base_url === 'string' && account.custom_base_url.trim()) return account.custom_base_url.trim()
  const extraUrl = account.extra?.base_url
  return typeof extraUrl === 'string' ? extraUrl.trim() : ''
}

export function getUpstreamObservedAt(account: Account): string | undefined {
  const snapshot = getUpstreamProbeSnapshot(account)
  const data = getUpstreamProbeData(account)
  return data?.observed_at ?? snapshot?.received_at ?? snapshot?.last_attempt_at
}
