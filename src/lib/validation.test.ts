import { describe, it, expect } from 'vitest'
import {
  validateSiteUrl,
  sanitizeInput,
  validateSiteData,
  type ValidationResult,
  type SiteInput,
} from './validation'

describe('validateSiteUrl', () => {
  it('should accept valid HTTPS URL', () => {
    const result = validateSiteUrl('https://example.com')
    expect(result.valid).toBe(true)
    expect(result.url).toBe('https://example.com')
  })

  it('should accept valid HTTP URL', () => {
    const result = validateSiteUrl('http://example.com')
    expect(result.valid).toBe(true)
  })

  it('should accept URL with path', () => {
    const result = validateSiteUrl('https://example.com/wordpress')
    expect(result.valid).toBe(true)
  })

  it('should accept URL with subdomain', () => {
    const result = validateSiteUrl('https://blog.example.com')
    expect(result.valid).toBe(true)
  })

  it('should reject empty string', () => {
    const result = validateSiteUrl('')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('URL is required')
  })

  it('should reject URL without protocol', () => {
    const result = validateSiteUrl('example.com')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('URL must start with http:// or https://')
  })

  it('should reject invalid protocol', () => {
    const result = validateSiteUrl('ftp://example.com')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('URL must start with http:// or https://')
  })

  it('should reject malformed URL', () => {
    const result = validateSiteUrl('https://')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid URL format')
  })

  it('should trim whitespace from URL', () => {
    const result = validateSiteUrl('  https://example.com  ')
    expect(result.valid).toBe(true)
    expect(result.url).toBe('https://example.com')
  })

  it('should remove trailing slash', () => {
    const result = validateSiteUrl('https://example.com/')
    expect(result.valid).toBe(true)
    expect(result.url).toBe('https://example.com')
  })
})

describe('sanitizeInput', () => {
  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('should escape HTML entities', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('should handle special characters', () => {
    expect(sanitizeInput("It's a test & more")).toBe(
      "It's a test &amp; more"
    )
  })

  it('should handle empty string', () => {
    expect(sanitizeInput('')).toBe('')
  })

  it('should handle null/undefined', () => {
    expect(sanitizeInput(null as unknown as string)).toBe('')
    expect(sanitizeInput(undefined as unknown as string)).toBe('')
  })

  it('should preserve normal text', () => {
    expect(sanitizeInput('My WordPress Site')).toBe('My WordPress Site')
  })

  it('should handle unicode characters', () => {
    expect(sanitizeInput('Café ☕')).toBe('Café ☕')
  })
})

describe('validateSiteData', () => {
  it('should accept valid site data', () => {
    const data: SiteInput = {
      name: 'My Site',
      url: 'https://example.com',
      apiUsername: 'admin',
      apiPassword: 'xxxx xxxx xxxx',
    }

    const result = validateSiteData(data)
    expect(result.valid).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('should reject missing name', () => {
    const data: SiteInput = {
      name: '',
      url: 'https://example.com',
      apiUsername: 'admin',
      apiPassword: 'password',
    }

    const result = validateSiteData(data)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Site name is required')
  })

  it('should reject name that is too long', () => {
    const data: SiteInput = {
      name: 'a'.repeat(256),
      url: 'https://example.com',
      apiUsername: 'admin',
      apiPassword: 'password',
    }

    const result = validateSiteData(data)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Site name must be less than 255 characters')
  })

  it('should reject invalid URL', () => {
    const data: SiteInput = {
      name: 'My Site',
      url: 'not-a-url',
      apiUsername: 'admin',
      apiPassword: 'password',
    }

    const result = validateSiteData(data)
    expect(result.valid).toBe(false)
    expect(result.errors?.some((e) => e.includes('URL'))).toBe(true)
  })

  it('should reject missing username', () => {
    const data: SiteInput = {
      name: 'My Site',
      url: 'https://example.com',
      apiUsername: '',
      apiPassword: 'password',
    }

    const result = validateSiteData(data)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('API username is required')
  })

  it('should reject missing password', () => {
    const data: SiteInput = {
      name: 'My Site',
      url: 'https://example.com',
      apiUsername: 'admin',
      apiPassword: '',
    }

    const result = validateSiteData(data)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('API password is required')
  })

  it('should sanitize input data', () => {
    const data: SiteInput = {
      name: '  <script>My Site</script>  ',
      url: '  https://example.com/  ',
      apiUsername: '  admin  ',
      apiPassword: 'password',
    }

    const result = validateSiteData(data)
    expect(result.valid).toBe(true)
    expect(result.data?.name).toBe('&lt;script&gt;My Site&lt;/script&gt;')
    expect(result.data?.url).toBe('https://example.com')
  })
})
