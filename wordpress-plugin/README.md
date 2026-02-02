# WP Jupiter Connector

A WordPress plugin that connects your site to the WP Jupiter dashboard for centralized management.

## Why Use This Plugin?

Some hosting providers (like xCloud.host) or security plugins block access to WordPress's built-in REST API endpoints for plugins and themes. This connector plugin provides an alternative way for WP Jupiter to communicate with your WordPress site.

## Installation

### Option 1: Upload via WordPress Admin

1. Download the `wp-jupiter-connector.php` file
2. Go to your WordPress admin panel
3. Navigate to **Plugins > Add New > Upload Plugin**
4. Choose the `wp-jupiter-connector.php` file
5. Click **Install Now**
6. Activate the plugin

### Option 2: Manual Upload

1. Upload `wp-jupiter-connector.php` to your `/wp-content/plugins/` directory
2. Go to **Plugins** in WordPress admin
3. Activate "WP Jupiter Connector"

## Configuration

1. After activation, go to **Settings > WP Jupiter**
2. Enter a **Secret Key** - this should be a secure, random string
3. Save the settings
4. In your WP Jupiter dashboard, when adding this site:
   - Use the same **Secret Key** as the password
   - The username field can be anything (it's ignored when using the connector)

## How It Works

The plugin creates custom REST API endpoints:
- `/wp-json/wp-manager/v1/health` - Public health check
- `/wp-json/wp-manager/v1/plugins` - Get all plugins (requires secret)
- `/wp-json/wp-manager/v1/themes` - Get all themes (requires secret)
- `/wp-json/wp-manager/v1/info` - Get site information (requires secret)

WP Jupiter will automatically detect this plugin and use these endpoints instead of the standard WordPress API.

## Security

- The secret key is transmitted in the `X-WP-Manager-Secret` header
- All sensitive endpoints require the correct secret key
- The health endpoint is public but only reveals if the plugin is configured

## Troubleshooting

**Plugin shows "Not configured"**
- Make sure you've set a secret key in Settings > WP Jupiter

**Still getting 401 errors**
- Verify the secret key in WP Jupiter matches exactly (no extra spaces)
- Check that the plugin is activated
- Visit `/wp-json/wp-manager/v1/health` to verify the plugin is working

## License

GPL v2 or later
