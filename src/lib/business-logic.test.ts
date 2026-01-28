import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateHealthScore,
  prioritizeUpdates,
  type SiteHealth,
  type PendingUpdate,
  type PrioritizedUpdate,
} from './business-logic'

describe('calculateHealthScore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return 100 for a perfectly healthy site', () => {
    const site: SiteHealth = {
      status: 'online',
      sslValid: true,
      sslExpiry: new Date('2025-01-15'), // 1 year from now
      lastChecked: new Date('2024-01-15T11:00:00Z'), // 1 hour ago
      pluginUpdates: 0,
      themeUpdates: 0,
      wpVersion: '6.4.2',
      phpVersion: '8.2',
    }

    const score = calculateHealthScore(site)
    expect(score).toBe(100)
  })

  it('should return 0 for an offline site', () => {
    const site: SiteHealth = {
      status: 'offline',
      sslValid: true,
      sslExpiry: new Date('2025-01-15'),
      lastChecked: new Date('2024-01-15T11:00:00Z'),
      pluginUpdates: 0,
      themeUpdates: 0,
    }

    const score = calculateHealthScore(site)
    expect(score).toBe(0)
  })

  it('should deduct points for pending updates', () => {
    const site: SiteHealth = {
      status: 'online',
      sslValid: true,
      sslExpiry: new Date('2025-01-15'),
      lastChecked: new Date('2024-01-15T11:00:00Z'),
      pluginUpdates: 5,
      themeUpdates: 2,
    }

    const score = calculateHealthScore(site)
    expect(score).toBeLessThan(100)
    expect(score).toBeGreaterThan(50)
  })

  it('should deduct points for expiring SSL', () => {
    const site: SiteHealth = {
      status: 'online',
      sslValid: true,
      sslExpiry: new Date('2024-01-25'), // 10 days from now
      lastChecked: new Date('2024-01-15T11:00:00Z'),
      pluginUpdates: 0,
      themeUpdates: 0,
    }

    const score = calculateHealthScore(site)
    expect(score).toBeLessThan(100)
  })

  it('should deduct points for invalid SSL', () => {
    const site: SiteHealth = {
      status: 'online',
      sslValid: false,
      sslExpiry: null,
      lastChecked: new Date('2024-01-15T11:00:00Z'),
      pluginUpdates: 0,
      themeUpdates: 0,
    }

    const score = calculateHealthScore(site)
    expect(score).toBeLessThan(80)
  })

  it('should deduct points for stale last check', () => {
    const site: SiteHealth = {
      status: 'online',
      sslValid: true,
      sslExpiry: new Date('2025-01-15'),
      lastChecked: new Date('2024-01-08T12:00:00Z'), // 7 days ago
      pluginUpdates: 0,
      themeUpdates: 0,
    }

    const score = calculateHealthScore(site)
    expect(score).toBeLessThan(100)
  })

  it('should handle unknown status', () => {
    const site: SiteHealth = {
      status: 'unknown',
      sslValid: true,
      sslExpiry: new Date('2025-01-15'),
      lastChecked: null,
      pluginUpdates: 0,
      themeUpdates: 0,
    }

    const score = calculateHealthScore(site)
    expect(score).toBeLessThan(100)
    expect(score).toBeGreaterThan(0)
  })

  it('should cap score at 0 minimum', () => {
    const site: SiteHealth = {
      status: 'offline',
      sslValid: false,
      sslExpiry: null,
      lastChecked: null,
      pluginUpdates: 100,
      themeUpdates: 50,
    }

    const score = calculateHealthScore(site)
    expect(score).toBe(0)
  })
})

describe('prioritizeUpdates', () => {
  it('should return empty array for empty input', () => {
    const result = prioritizeUpdates([])
    expect(result).toEqual([])
  })

  it('should prioritize security updates first', () => {
    const updates: PendingUpdate[] = [
      { id: '1', name: 'Regular Plugin', type: 'plugin', isSecurityUpdate: false, isActive: true },
      { id: '2', name: 'Security Fix', type: 'plugin', isSecurityUpdate: true, isActive: true },
      { id: '3', name: 'Another Plugin', type: 'plugin', isSecurityUpdate: false, isActive: true },
    ]

    const result = prioritizeUpdates(updates)
    expect(result[0].id).toBe('2')
    expect(result[0].priority).toBe('critical')
  })

  it('should prioritize active plugins over inactive', () => {
    const updates: PendingUpdate[] = [
      { id: '1', name: 'Inactive Plugin', type: 'plugin', isSecurityUpdate: false, isActive: false },
      { id: '2', name: 'Active Plugin', type: 'plugin', isSecurityUpdate: false, isActive: true },
    ]

    const result = prioritizeUpdates(updates)
    expect(result[0].id).toBe('2')
    expect(result[0].priority).toBe('high')
    expect(result[1].priority).toBe('low')
  })

  it('should prioritize plugins over themes', () => {
    const updates: PendingUpdate[] = [
      { id: '1', name: 'Theme', type: 'theme', isSecurityUpdate: false, isActive: true },
      { id: '2', name: 'Plugin', type: 'plugin', isSecurityUpdate: false, isActive: true },
    ]

    const result = prioritizeUpdates(updates)
    expect(result[0].id).toBe('2')
  })

  it('should assign correct priority levels', () => {
    const updates: PendingUpdate[] = [
      { id: '1', name: 'Security', type: 'plugin', isSecurityUpdate: true, isActive: true },
      { id: '2', name: 'Active Plugin', type: 'plugin', isSecurityUpdate: false, isActive: true },
      { id: '3', name: 'Inactive Plugin', type: 'plugin', isSecurityUpdate: false, isActive: false },
      { id: '4', name: 'Active Theme', type: 'theme', isSecurityUpdate: false, isActive: true },
      { id: '5', name: 'Inactive Theme', type: 'theme', isSecurityUpdate: false, isActive: false },
    ]

    const result = prioritizeUpdates(updates)

    const security = result.find((u) => u.id === '1')
    const activePlugin = result.find((u) => u.id === '2')
    const inactivePlugin = result.find((u) => u.id === '3')
    const activeTheme = result.find((u) => u.id === '4')
    const inactiveTheme = result.find((u) => u.id === '5')

    expect(security?.priority).toBe('critical')
    expect(activePlugin?.priority).toBe('high')
    expect(inactivePlugin?.priority).toBe('low')
    expect(activeTheme?.priority).toBe('medium')
    expect(inactiveTheme?.priority).toBe('low')
  })

  it('should sort by priority order', () => {
    const updates: PendingUpdate[] = [
      { id: '1', name: 'Low', type: 'theme', isSecurityUpdate: false, isActive: false },
      { id: '2', name: 'Critical', type: 'plugin', isSecurityUpdate: true, isActive: true },
      { id: '3', name: 'Medium', type: 'theme', isSecurityUpdate: false, isActive: true },
      { id: '4', name: 'High', type: 'plugin', isSecurityUpdate: false, isActive: true },
    ]

    const result = prioritizeUpdates(updates)
    const priorities = result.map((u) => u.priority)

    expect(priorities).toEqual(['critical', 'high', 'medium', 'low'])
  })
})
