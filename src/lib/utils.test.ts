import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatRelativeTime,
  calculateUpdateCounts,
  type Site,
  type UpdateCounts,
} from './site-utils'

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "Just now" for times less than 1 minute ago', () => {
    const date = new Date('2024-01-15T11:59:30Z') // 30 seconds ago
    expect(formatRelativeTime(date)).toBe('Just now')
  })

  it('should return minutes ago for times less than 1 hour', () => {
    const date = new Date('2024-01-15T11:45:00Z') // 15 minutes ago
    expect(formatRelativeTime(date)).toBe('15m ago')
  })

  it('should return hours ago for times less than 24 hours', () => {
    const date = new Date('2024-01-15T09:00:00Z') // 3 hours ago
    expect(formatRelativeTime(date)).toBe('3h ago')
  })

  it('should return days ago for times less than 7 days', () => {
    const date = new Date('2024-01-13T12:00:00Z') // 2 days ago
    expect(formatRelativeTime(date)).toBe('2d ago')
  })

  it('should return formatted date for times more than 7 days ago', () => {
    const date = new Date('2024-01-01T12:00:00Z') // 14 days ago
    const result = formatRelativeTime(date)
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/) // MM/DD/YYYY format
  })

  it('should handle string date input', () => {
    const dateStr = '2024-01-15T11:30:00Z' // 30 minutes ago
    expect(formatRelativeTime(dateStr)).toBe('30m ago')
  })

  it('should handle null/undefined gracefully', () => {
    expect(formatRelativeTime(null)).toBe('Never')
    expect(formatRelativeTime(undefined)).toBe('Never')
  })

  it('should handle invalid date', () => {
    expect(formatRelativeTime('invalid-date')).toBe('Never')
  })
})

describe('calculateUpdateCounts', () => {
  it('should return zero counts for empty array', () => {
    const result = calculateUpdateCounts([])
    expect(result).toEqual({
      totalUpdates: 0,
      pluginUpdates: 0,
      themeUpdates: 0,
      sitesWithUpdates: 0,
      sitesOnline: 0,
      sitesOffline: 0,
    })
  })

  it('should calculate correct counts for single site', () => {
    const sites: Site[] = [
      {
        id: 1,
        name: 'Test Site',
        url: 'https://test.com',
        status: 'online',
        pluginUpdates: 3,
        themeUpdates: 1,
      },
    ]

    const result = calculateUpdateCounts(sites)

    expect(result.totalUpdates).toBe(4)
    expect(result.pluginUpdates).toBe(3)
    expect(result.themeUpdates).toBe(1)
    expect(result.sitesWithUpdates).toBe(1)
    expect(result.sitesOnline).toBe(1)
    expect(result.sitesOffline).toBe(0)
  })

  it('should calculate correct counts for multiple sites', () => {
    const sites: Site[] = [
      {
        id: 1,
        name: 'Site 1',
        url: 'https://site1.com',
        status: 'online',
        pluginUpdates: 5,
        themeUpdates: 2,
      },
      {
        id: 2,
        name: 'Site 2',
        url: 'https://site2.com',
        status: 'offline',
        pluginUpdates: 0,
        themeUpdates: 0,
      },
      {
        id: 3,
        name: 'Site 3',
        url: 'https://site3.com',
        status: 'online',
        pluginUpdates: 3,
        themeUpdates: 1,
      },
    ]

    const result = calculateUpdateCounts(sites)

    expect(result.totalUpdates).toBe(11)
    expect(result.pluginUpdates).toBe(8)
    expect(result.themeUpdates).toBe(3)
    expect(result.sitesWithUpdates).toBe(2)
    expect(result.sitesOnline).toBe(2)
    expect(result.sitesOffline).toBe(1)
  })

  it('should handle sites with unknown status', () => {
    const sites: Site[] = [
      {
        id: 1,
        name: 'Test Site',
        url: 'https://test.com',
        status: 'unknown',
        pluginUpdates: 1,
        themeUpdates: 0,
      },
    ]

    const result = calculateUpdateCounts(sites)

    expect(result.sitesOnline).toBe(0)
    expect(result.sitesOffline).toBe(0)
  })
})
