# WP Jupiter - WordPress Site Dashboard

A self-hosted WordPress site management dashboard, similar to MainWP but lightweight and built with modern tech.

## Documentation

- Sync to docs.jbcloud.app: Yes
- Project slug: wp-jupiter
- Docs URL: https://docs.jbcloud.app/wp-jupiter/

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Turso (SQLite edge database)
- **ORM**: Drizzle ORM
- **UI**: Tailwind CSS + custom shadcn-style components
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── sites/         # Site CRUD + health/plugins endpoints
│   │   └── sync/          # Bulk sync all sites
│   ├── dashboard/         # Main dashboard page
│   └── sites/             # Site management pages
├── components/
│   └── ui/                # Reusable UI components
└── lib/
    ├── db/                # Database client and schema
    │   ├── index.ts       # Turso/Drizzle client
    │   └── schema.ts      # Database schema definitions
    ├── utils.ts           # Utility functions (cn)
    └── wordpress.ts       # WordPress REST API client
```

## Database Schema

- **sites**: WordPress site credentials and status
- **plugins**: Installed plugins per site
- **themes**: Installed themes per site
- **wp_users**: WordPress users on remote sites
- **activity_log**: Action tracking

## Getting Started

### 1. Set up Turso database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create wp-jupiter

# Get credentials
turso db show wp-jupiter --url
turso db tokens create wp-jupiter
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

### 3. Run migrations

```bash
npm run db:push
```

### 4. Start development

```bash
npm run dev
```

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:generate` - Generate migration files

## Adding a WordPress Site

### Option 1: Application Passwords (Standard)

1. Go to your WordPress site
2. Navigate to: Users → Profile → Application Passwords
3. Create a new application password
4. Add the site in WP Jupiter with the URL and credentials

### Option 2: WP Jupiter Connector Plugin (Recommended)

Some hosts (like xCloud.host) or security plugins block the standard WordPress REST API. Use the connector plugin instead:

1. Download `wordpress-plugin/wp-jupiter-connector.php` from this repo
2. Upload it to your WordPress site via Plugins → Add New → Upload Plugin
3. Activate the plugin
4. Go to Settings → WP Jupiter and set a secret key
5. In WP Jupiter, add your site using:
   - **URL**: Your WordPress site URL
   - **Username**: (anything - it's ignored)
   - **Password**: The secret key you set in step 4

WP Jupiter will automatically detect the connector plugin and use it for syncing.

## API Endpoints

- `GET /api/sites` - List all sites with update counts
- `POST /api/sites` - Add a new site
- `GET /api/sites/[id]` - Get site details with plugins/themes
- `PUT /api/sites/[id]` - Update site
- `DELETE /api/sites/[id]` - Delete site
- `GET /api/sites/[id]/health` - Check site health
- `GET /api/sites/[id]/plugins` - Sync and get plugins
- `POST /api/sites/[id]/plugins` - Update a plugin
- `POST /api/sync` - Sync all sites

## MVP Features (Phase 1) - Complete

- [x] Site management (add/edit/delete)
- [x] Dashboard with status overview
- [x] Plugin/theme listing with update status
- [x] Health checks (online/offline status)
- [x] Bulk sync functionality
- [x] WP Jupiter Connector plugin for restricted hosts

## Phase 2 (Core Features) - Complete

- [x] Bulk plugin/theme updates
- [x] Activity logging
- [x] Site credential editing
- [x] Style guide page
- [x] TDD utilities (validation, health scoring, scheduling)
- [x] Migration to official shadcn/ui components

## Phase 3 (Polish) - Complete

- [x] Dashboard charts (site status pie, updates bar chart)
- [x] Health score calculation (0-100 scoring)
- [x] "Sites Needing Attention" section
- [x] Toast notifications
- [x] Mobile responsive sidebar
- [x] Client-side form validation
- [x] 63 tests with 100% coverage

## Phase 4 (Planned)

- [ ] User management across sites
- [ ] Scheduled syncing
- [ ] Backup coordination
- [ ] Security scanning
