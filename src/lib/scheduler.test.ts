import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getSitesNeedingSync,
  generateNotifications,
  type SiteForSync,
  type Notification,
  type NotificationType,
} from './scheduler'

describe('getSitesNeedingSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return empty array for empty input', () => {
    const result = getSitesNeedingSync([], 60)
    expect(result).toEqual([])
  })

  it('should include sites never synced', () => {
    const sites: SiteForSync[] = [
      { id: 1, name: 'Site 1', lastSynced: null },
    ]

    const result = getSitesNeedingSync(sites, 60)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('should include sites synced longer than interval ago', () => {
    const sites: SiteForSync[] = [
      {
        id: 1,
        name: 'Site 1',
        lastSynced: new Date('2024-01-15T10:00:00Z'), // 2 hours ago
      },
    ]

    const result = getSitesNeedingSync(sites, 60) // 60 min interval
    expect(result).toHaveLength(1)
  })

  it('should exclude sites synced within interval', () => {
    const sites: SiteForSync[] = [
      {
        id: 1,
        name: 'Site 1',
        lastSynced: new Date('2024-01-15T11:30:00Z'), // 30 minutes ago
      },
    ]

    const result = getSitesNeedingSync(sites, 60) // 60 min interval
    expect(result).toHaveLength(0)
  })

  it('should correctly filter mixed sites', () => {
    const sites: SiteForSync[] = [
      { id: 1, name: 'Never Synced', lastSynced: null },
      { id: 2, name: 'Recent', lastSynced: new Date('2024-01-15T11:45:00Z') }, // 15 min ago
      { id: 3, name: 'Old', lastSynced: new Date('2024-01-15T09:00:00Z') }, // 3 hours ago
      { id: 4, name: 'Borderline', lastSynced: new Date('2024-01-15T11:00:00Z') }, // exactly 60 min ago
    ]

    const result = getSitesNeedingSync(sites, 60)
    const ids = result.map((s) => s.id)

    expect(ids).toContain(1) // Never synced
    expect(ids).not.toContain(2) // Recent
    expect(ids).toContain(3) // Old
    expect(ids).toContain(4) // Borderline (equal to interval)
  })

  it('should handle different sync intervals', () => {
    const sites: SiteForSync[] = [
      {
        id: 1,
        name: 'Site 1',
        lastSynced: new Date('2024-01-15T11:30:00Z'), // 30 min ago
      },
    ]

    // 30 min interval - should include
    expect(getSitesNeedingSync(sites, 30)).toHaveLength(1)

    // 60 min interval - should exclude
    expect(getSitesNeedingSync(sites, 60)).toHaveLength(0)
  })
})

describe('generateNotifications', () => {
  it('should return empty array for healthy sites', () => {
    const sites = [
      {
        id: 1,
        name: 'Healthy Site',
        status: 'online' as const,
        pluginUpdates: 0,
        themeUpdates: 0,
        sslExpiry: new Date('2025-01-15'),
      },
    ]

    const result = generateNotifications(sites)
    expect(result).toEqual([])
  })

  it('should generate notification for offline sites', () => {
    const sites = [
      {
        id: 1,
        name: 'Offline Site',
        status: 'offline' as const,
        pluginUpdates: 0,
        themeUpdates: 0,
        sslExpiry: null,
      },
    ]

    const result = generateNotifications(sites)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('offline')
    expect(result[0].severity).toBe('critical')
  })

  it('should generate notification for sites with many updates', () => {
    const sites = [
      {
        id: 1,
        name: 'Outdated Site',
        status: 'online' as const,
        pluginUpdates: 8,
        themeUpdates: 2,
        sslExpiry: new Date('2025-01-15'),
      },
    ]

    const result = generateNotifications(sites)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('updates_available')
    expect(result[0].severity).toBe('warning')
  })

  it('should generate notification for expiring SSL', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

    const sites = [
      {
        id: 1,
        name: 'SSL Expiring',
        status: 'online' as const,
        pluginUpdates: 0,
        themeUpdates: 0,
        sslExpiry: new Date('2024-01-20'), // 5 days from now
      },
    ]

    const result = generateNotifications(sites)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('ssl_expiring')
    expect(result[0].severity).toBe('warning')

    vi.useRealTimers()
  })

  it('should generate multiple notifications for multiple issues', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

    const sites = [
      {
        id: 1,
        name: 'Problem Site',
        status: 'online' as const,
        pluginUpdates: 10,
        themeUpdates: 5,
        sslExpiry: new Date('2024-01-18'), // 3 days
      },
    ]

    const result = generateNotifications(sites)
    expect(result.length).toBeGreaterThanOrEqual(2)

    const types = result.map((n) => n.type)
    expect(types).toContain('updates_available')
    expect(types).toContain('ssl_expiring')

    vi.useRealTimers()
  })

  it('should include site info in notifications', () => {
    const sites = [
      {
        id: 42,
        name: 'My Site',
        status: 'offline' as const,
        pluginUpdates: 0,
        themeUpdates: 0,
        sslExpiry: null,
      },
    ]

    const result = generateNotifications(sites)
    expect(result[0].siteId).toBe(42)
    expect(result[0].siteName).toBe('My Site')
    expect(result[0].message).toContain('My Site')
  })

  it('should not notify for small number of updates', () => {
    const sites = [
      {
        id: 1,
        name: 'Site',
        status: 'online' as const,
        pluginUpdates: 2,
        themeUpdates: 1,
        sslExpiry: new Date('2025-01-15'),
      },
    ]

    const result = generateNotifications(sites)
    const updateNotifications = result.filter((n) => n.type === 'updates_available')
    expect(updateNotifications).toHaveLength(0)
  })
})
