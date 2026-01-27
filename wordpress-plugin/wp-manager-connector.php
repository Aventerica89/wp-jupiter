<?php
/**
 * Plugin Name: WP Manager Connector
 * Plugin URI: https://github.com/Aventerica89/jb-cloud-wp-manager
 * Description: Connects your WordPress site to WP Manager dashboard for centralized management.
 * Version: 1.0.0
 * Author: WP Manager
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if (!defined('ABSPATH')) {
    exit;
}

class WP_Manager_Connector {

    private $namespace = 'wp-manager/v1';

    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Get plugins
        register_rest_route($this->namespace, '/plugins', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_plugins'),
            'permission_callback' => array($this, 'verify_request'),
        ));

        // Get themes
        register_rest_route($this->namespace, '/themes', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_themes'),
            'permission_callback' => array($this, 'verify_request'),
        ));

        // Get site info
        register_rest_route($this->namespace, '/info', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_site_info'),
            'permission_callback' => array($this, 'verify_request'),
        ));

        // Health check (public)
        register_rest_route($this->namespace, '/health', array(
            'methods' => 'GET',
            'callback' => array($this, 'health_check'),
            'permission_callback' => '__return_true',
        ));
    }

    /**
     * Verify the request has valid authentication
     */
    public function verify_request($request) {
        $secret = get_option('wp_manager_secret');

        if (empty($secret)) {
            return new WP_Error(
                'not_configured',
                'WP Manager Connector is not configured. Please set the secret key in Settings > WP Manager.',
                array('status' => 403)
            );
        }

        // Check Authorization header
        $auth_header = $request->get_header('X-WP-Manager-Secret');

        if (empty($auth_header)) {
            // Also check query param for easier testing
            $auth_header = $request->get_param('secret');
        }

        if (empty($auth_header) || !hash_equals($secret, $auth_header)) {
            return new WP_Error(
                'unauthorized',
                'Invalid or missing secret key.',
                array('status' => 401)
            );
        }

        return true;
    }

    /**
     * Get all plugins with update status
     */
    public function get_plugins($request) {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        if (!function_exists('get_plugin_updates')) {
            require_once ABSPATH . 'wp-admin/includes/update.php';
        }

        $all_plugins = get_plugins();
        $active_plugins = get_option('active_plugins', array());
        $plugin_updates = get_plugin_updates();

        $plugins = array();

        foreach ($all_plugins as $plugin_file => $plugin_data) {
            $update_info = isset($plugin_updates[$plugin_file]) ? $plugin_updates[$plugin_file] : null;

            $plugins[] = array(
                'plugin' => $plugin_file,
                'name' => $plugin_data['Name'],
                'version' => $plugin_data['Version'],
                'status' => in_array($plugin_file, $active_plugins) ? 'active' : 'inactive',
                'update' => $update_info ? array(
                    'version' => $update_info->update->new_version,
                ) : null,
                'description' => $plugin_data['Description'],
                'author' => $plugin_data['Author'],
                'plugin_uri' => $plugin_data['PluginURI'],
            );
        }

        return rest_ensure_response($plugins);
    }

    /**
     * Get all themes with update status
     */
    public function get_themes($request) {
        if (!function_exists('wp_get_themes')) {
            return new WP_Error('themes_unavailable', 'Unable to get themes', array('status' => 500));
        }

        $all_themes = wp_get_themes();
        $active_theme = wp_get_theme();
        $theme_updates = get_site_transient('update_themes');

        $themes = array();

        foreach ($all_themes as $stylesheet => $theme) {
            $update_info = isset($theme_updates->response[$stylesheet]) ? $theme_updates->response[$stylesheet] : null;

            $themes[] = array(
                'stylesheet' => $stylesheet,
                'name' => $theme->get('Name'),
                'version' => $theme->get('Version'),
                'status' => ($active_theme->get_stylesheet() === $stylesheet) ? 'active' : 'inactive',
                'update' => $update_info ? array(
                    'version' => $update_info['new_version'],
                ) : null,
                'description' => $theme->get('Description'),
                'author' => $theme->get('Author'),
            );
        }

        return rest_ensure_response($themes);
    }

    /**
     * Get site information
     */
    public function get_site_info($request) {
        global $wp_version;

        return rest_ensure_response(array(
            'name' => get_bloginfo('name'),
            'url' => home_url(),
            'wp_version' => $wp_version,
            'php_version' => phpversion(),
            'is_ssl' => is_ssl(),
            'is_multisite' => is_multisite(),
            'active_theme' => wp_get_theme()->get('Name'),
            'plugin_count' => count(get_option('active_plugins', array())),
            'timezone' => wp_timezone_string(),
        ));
    }

    /**
     * Public health check endpoint
     */
    public function health_check($request) {
        return rest_ensure_response(array(
            'status' => 'ok',
            'plugin_version' => '1.0.0',
            'configured' => !empty(get_option('wp_manager_secret')),
        ));
    }

    /**
     * Add settings page to admin menu
     */
    public function add_settings_page() {
        add_options_page(
            'WP Manager Connector',
            'WP Manager',
            'manage_options',
            'wp-manager-connector',
            array($this, 'render_settings_page')
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('wp_manager_settings', 'wp_manager_secret', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
        ));
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        $secret = get_option('wp_manager_secret');
        $site_url = home_url();
        ?>
        <div class="wrap">
            <h1>WP Manager Connector</h1>

            <form method="post" action="options.php">
                <?php settings_fields('wp_manager_settings'); ?>

                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="wp_manager_secret">Secret Key</label>
                        </th>
                        <td>
                            <input type="text"
                                   id="wp_manager_secret"
                                   name="wp_manager_secret"
                                   value="<?php echo esc_attr($secret); ?>"
                                   class="regular-text"
                                   placeholder="Enter a secure secret key" />
                            <p class="description">
                                This key must match the one you enter in your WP Manager dashboard when adding this site.
                            </p>
                            <?php if (empty($secret)): ?>
                                <p class="description" style="color: #d63638;">
                                    <strong>Not configured!</strong> Enter a secret key to enable the connector.
                                </p>
                            <?php endif; ?>
                        </td>
                    </tr>
                </table>

                <?php submit_button('Save Settings'); ?>
            </form>

            <hr />

            <h2>Connection Information</h2>
            <table class="form-table">
                <tr>
                    <th>Site URL</th>
                    <td><code><?php echo esc_html($site_url); ?></code></td>
                </tr>
                <tr>
                    <th>API Endpoint</th>
                    <td><code><?php echo esc_html($site_url); ?>/wp-json/wp-manager/v1/</code></td>
                </tr>
                <tr>
                    <th>Health Check</th>
                    <td>
                        <a href="<?php echo esc_url($site_url . '/wp-json/wp-manager/v1/health'); ?>" target="_blank">
                            <?php echo esc_html($site_url); ?>/wp-json/wp-manager/v1/health
                        </a>
                    </td>
                </tr>
            </table>

            <h3>How to Connect</h3>
            <ol>
                <li>Set a secure secret key above and save</li>
                <li>In your WP Manager dashboard, add this site with:
                    <ul>
                        <li><strong>URL:</strong> <?php echo esc_html($site_url); ?></li>
                        <li><strong>Secret Key:</strong> (the key you set above)</li>
                    </ul>
                </li>
                <li>The connector will handle plugin and theme syncing</li>
            </ol>
        </div>
        <?php
    }
}

// Initialize the plugin
new WP_Manager_Connector();
