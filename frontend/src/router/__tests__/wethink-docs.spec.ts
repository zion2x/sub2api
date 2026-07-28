import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import en from '../../i18n/locales/en'
import zh from '../../i18n/locales/zh'

const testDir = dirname(fileURLToPath(import.meta.url))
const routerSource = readFileSync(resolve(testDir, '../index.ts'), 'utf8')
const sidebarSource = readFileSync(
  resolve(testDir, '../../components/layout/AppSidebar.vue'),
  'utf8'
)
const docsSource = readFileSync(resolve(testDir, '../../views/WeThinkDocsView.vue'), 'utf8')
const legacyBrand = ['open', 'starry'].join('')
const legacyPath = `/docs/${legacyBrand}`

describe('WeThink usage documentation integration', () => {
  it('registers the documentation page as a public lazy-loaded route', () => {
    const routeStart = routerSource.indexOf("path: '/docs/wethink'")
    const userRoutesStart = routerSource.indexOf('// ==================== User Routes')
    const routeSource = routerSource.slice(routeStart, userRoutesStart)

    expect(routeStart).toBeGreaterThan(-1)
    expect(routeSource).toContain("name: 'WeThinkDocs'")
    expect(routeSource).toContain("import('@/views/WeThinkDocsView.vue')")
    expect(routeSource).toContain('requiresAuth: false')
    expect(routeSource).toContain("titleKey: 'nav.usageDocs'")
    expect(routerSource).not.toContain(legacyPath)
    expect(sidebarSource).not.toContain(legacyPath)
    expect(routerSource).toMatch(
      /const BACKEND_MODE_ALLOWED_PATHS = \[[\s\S]*?'\/docs\/wethink'[\s\S]*?\]/
    )
  })

  it('places one fixed internal entry immediately above admin announcements', () => {
    const adminItemsStart = sidebarSource.indexOf('const baseItems: NavItem[] = [')
    const adminItemsEnd = sidebarSource.indexOf('const visible = applyFeatureFlags(baseItems)')
    const adminItems = sidebarSource.slice(adminItemsStart, adminItemsEnd)
    const docsEntry = "{ path: '/docs/wethink', label: t('nav.usageDocs'), icon: BookOpenIcon }"
    const announcementsEntry = "{ path: '/admin/announcements', label: t('nav.announcements'), icon: BellIcon }"

    expect(adminItems).toContain(`${docsEntry},\n    ${announcementsEntry}`)
  })

  it('shows the entry to regular users without duplicating it in the admin personal menu', () => {
    const selfItemsStart = sidebarSource.indexOf('function buildSelfNavItems')
    const selfItemsEnd = sidebarSource.indexOf('// finalizeNav')
    const selfItems = sidebarSource.slice(selfItemsStart, selfItemsEnd)

    expect(selfItems).toMatch(
      /if \(withDashboard\) \{\s+items\.push\(\{ path: '\/docs\/wethink', label: t\('nav\.usageDocs'\), icon: BookOpenIcon \}\)\s+\}/
    )
  })

  it('provides matching Chinese and English labels', () => {
    expect(zh.nav.usageDocs).toBe('使用文档')
    expect(en.nav.usageDocs).toBe('Usage Docs')
  })

  it('uses WeThink branding and resolves every console link through the local Keys route', () => {
    expect(docsSource.toLowerCase()).not.toContain(legacyBrand)
    expect(docsSource).toContain("const API_BASE_URL = 'https://api.wethink.cloud'")
    expect(docsSource).not.toContain('https://api.wethink.cloud/keys')
    expect(docsSource).not.toContain('CONSOLE_URL')
    expect(docsSource.match(/:to="\{ name: 'Keys' \}"/g)).toHaveLength(2)
  })
})
