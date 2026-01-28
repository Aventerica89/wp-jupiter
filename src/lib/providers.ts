/**
 * Hosting provider metadata and defaults
 * Used for seeding and displaying provider information
 */

export interface ProviderMetadata {
  slug: string;
  name: string;
  logoUrl: string | null;
  dashboardUrl: string;
  serverUrlPattern: string; // Use {serverId} as placeholder
  docsUrl: string;
  supportUrl: string;
  communityUrl?: string;
  description?: string;
}

// Using Simple Icons CDN for reliable logos where available
// https://simpleicons.org/

/**
 * Pre-configured hosting providers with metadata
 */
export const PROVIDERS: ProviderMetadata[] = [
  {
    slug: 'xcloud',
    name: 'xCloud',
    logoUrl: null, // No Simple Icon available
    dashboardUrl: 'https://my.xcloud.host',
    serverUrlPattern: '/servers/{serverId}',
    docsUrl: 'https://xcloud.host/docs/',
    supportUrl: 'https://xcloud.host/support/',
    communityUrl: 'https://www.facebook.com/groups/xcloudhost',
    description: 'Self-managed cloud hosting for WordPress',
  },
  {
    slug: 'cloudways',
    name: 'Cloudways',
    logoUrl: 'https://cdn.simpleicons.org/cloudways/2C39BD',
    dashboardUrl: 'https://platform.cloudways.com',
    serverUrlPattern: '/server/{serverId}/access_detail',
    docsUrl: 'https://support.cloudways.com/',
    supportUrl: 'https://support.cloudways.com/en/',
    communityUrl: 'https://community.cloudways.com/',
    description: 'Managed cloud hosting platform',
  },
  {
    slug: 'runcloud',
    name: 'RunCloud',
    logoUrl: null, // No Simple Icon available
    dashboardUrl: 'https://manage.runcloud.io',
    serverUrlPattern: '/servers/{serverId}',
    docsUrl: 'https://runcloud.io/docs',
    supportUrl: 'https://runcloud.io/support',
    communityUrl: 'https://www.facebook.com/groups/runcloud',
    description: 'Server management panel for PHP apps',
  },
  {
    slug: 'gridpane',
    name: 'GridPane',
    logoUrl: null, // No Simple Icon available
    dashboardUrl: 'https://my.gridpane.com',
    serverUrlPattern: '/servers/{serverId}',
    docsUrl: 'https://gridpane.com/kb/',
    supportUrl: 'https://gridpane.com/support/',
    communityUrl: 'https://www.facebook.com/groups/GridPane',
    description: 'WordPress hosting control panel',
  },
  {
    slug: 'spinupwp',
    name: 'SpinupWP',
    logoUrl: null, // No Simple Icon available
    dashboardUrl: 'https://spinupwp.app',
    serverUrlPattern: '/servers/{serverId}',
    docsUrl: 'https://spinupwp.com/docs/',
    supportUrl: 'https://spinupwp.com/support/',
    description: 'Modern WordPress server control panel',
  },
  {
    slug: 'ploi',
    name: 'Ploi',
    logoUrl: null, // No Simple Icon available
    dashboardUrl: 'https://ploi.io',
    serverUrlPattern: '/servers/{serverId}',
    docsUrl: 'https://ploi.io/documentation',
    supportUrl: 'https://ploi.io/contact',
    communityUrl: 'https://discord.gg/ploi',
    description: 'Server management made easy',
  },
  {
    slug: 'kinsta',
    name: 'Kinsta',
    logoUrl: 'https://cdn.simpleicons.org/kinsta/5333ed',
    dashboardUrl: 'https://my.kinsta.com',
    serverUrlPattern: '/sites/{serverId}',
    docsUrl: 'https://kinsta.com/docs/',
    supportUrl: 'https://kinsta.com/help/',
    description: 'Premium managed WordPress hosting',
  },
  {
    slug: 'wpengine',
    name: 'WP Engine',
    logoUrl: 'https://cdn.simpleicons.org/wpengine/0ECAD4',
    dashboardUrl: 'https://my.wpengine.com',
    serverUrlPattern: '/installs/{serverId}',
    docsUrl: 'https://wpengine.com/support/',
    supportUrl: 'https://wpengine.com/support/contact/',
    description: 'Managed WordPress digital experience platform',
  },
  {
    slug: 'flywheel',
    name: 'Flywheel',
    logoUrl: null, // No Simple Icon available
    dashboardUrl: 'https://app.getflywheel.com',
    serverUrlPattern: '/sites/{serverId}',
    docsUrl: 'https://getflywheel.com/wordpress-support/',
    supportUrl: 'https://getflywheel.com/wordpress-support/',
    description: 'Delightful WordPress hosting',
  },
  {
    slug: 'digitalocean',
    name: 'DigitalOcean',
    logoUrl: 'https://cdn.simpleicons.org/digitalocean/0080FF',
    dashboardUrl: 'https://cloud.digitalocean.com',
    serverUrlPattern: '/droplets/{serverId}',
    docsUrl: 'https://docs.digitalocean.com/',
    supportUrl: 'https://www.digitalocean.com/support/',
    communityUrl: 'https://www.digitalocean.com/community',
    description: 'Cloud infrastructure provider',
  },
  {
    slug: 'vultr',
    name: 'Vultr',
    logoUrl: 'https://cdn.simpleicons.org/vultr/007BFC',
    dashboardUrl: 'https://my.vultr.com',
    serverUrlPattern: '/subs/{serverId}',
    docsUrl: 'https://www.vultr.com/docs/',
    supportUrl: 'https://www.vultr.com/support/',
    description: 'High performance cloud compute',
  },
  {
    slug: 'linode',
    name: 'Linode (Akamai)',
    logoUrl: 'https://cdn.simpleicons.org/linode/00A95C',
    dashboardUrl: 'https://cloud.linode.com',
    serverUrlPattern: '/linodes/{serverId}',
    docsUrl: 'https://www.linode.com/docs/',
    supportUrl: 'https://www.linode.com/support/',
    communityUrl: 'https://www.linode.com/community/',
    description: 'Cloud computing and Linux servers',
  },
  {
    slug: 'hetzner',
    name: 'Hetzner',
    logoUrl: 'https://cdn.simpleicons.org/hetzner/D50C2D',
    dashboardUrl: 'https://console.hetzner.cloud',
    serverUrlPattern: '/projects/default/servers/{serverId}',
    docsUrl: 'https://docs.hetzner.com/',
    supportUrl: 'https://www.hetzner.com/support-center',
    description: 'European cloud and dedicated servers',
  },
  {
    slug: 'custom',
    name: 'Custom/Self-Managed',
    logoUrl: null,
    dashboardUrl: '',
    serverUrlPattern: '',
    docsUrl: '',
    supportUrl: '',
    description: 'Self-managed or custom hosting',
  },
];

/**
 * Get provider metadata by slug
 */
export function getProviderBySlug(slug: string): ProviderMetadata | undefined {
  return PROVIDERS.find((p) => p.slug === slug);
}

/**
 * Generate server dashboard URL from provider metadata
 */
export function getServerDashboardUrl(
  provider: ProviderMetadata,
  externalServerId: string
): string {
  if (!provider.dashboardUrl || !provider.serverUrlPattern || !externalServerId) {
    return '';
  }
  const path = provider.serverUrlPattern.replace('{serverId}', externalServerId);
  return `${provider.dashboardUrl}${path}`;
}
