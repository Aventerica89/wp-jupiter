/**
 * Input validation and sanitization utilities
 * Built with TDD methodology
 */

export interface ValidationResult {
  valid: boolean;
  url?: string;
  error?: string;
}

export interface SiteInput {
  name: string;
  url: string;
  apiUsername: string;
  apiPassword: string;
}

export interface SiteValidationResult {
  valid: boolean;
  data?: SiteInput;
  errors?: string[];
}

/**
 * Validate a site URL
 */
export function validateSiteUrl(url: string): ValidationResult {
  const trimmed = url.trim();

  if (!trimmed) {
    return { valid: false, error: 'URL is required' };
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { valid: false, error: 'URL must start with http:// or https://' };
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname) {
      return { valid: false, error: 'Invalid URL format' };
    }

    // Remove trailing slash
    let cleanUrl = parsed.origin + parsed.pathname;
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }

    return { valid: true, url: cleanUrl };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (input === null || input === undefined) {
    return '';
  }

  const trimmed = String(input).trim();

  // Escape HTML entities
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Validate complete site data for creation/update
 */
export function validateSiteData(data: SiteInput): SiteValidationResult {
  const errors: string[] = [];

  // Validate name
  const name = data.name?.trim() || '';
  if (!name) {
    errors.push('Site name is required');
  } else if (name.length > 255) {
    errors.push('Site name must be less than 255 characters');
  }

  // Validate URL
  const urlResult = validateSiteUrl(data.url || '');
  if (!urlResult.valid) {
    errors.push(urlResult.error || 'Invalid URL');
  }

  // Validate username
  const apiUsername = data.apiUsername?.trim() || '';
  if (!apiUsername) {
    errors.push('API username is required');
  }

  // Validate password
  const apiPassword = data.apiPassword || '';
  if (!apiPassword) {
    errors.push('API password is required');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: sanitizeInput(name),
      url: urlResult.url!,
      apiUsername: apiUsername.trim(),
      apiPassword: apiPassword,
    },
  };
}
