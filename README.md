# WP Manager

A self-hosted WordPress site management dashboard. Monitor and manage multiple WordPress sites from a single interface.

## Features

- Dashboard with site status overview
- Plugin and theme update tracking
- Bulk sync across all sites
- Health checks (online/offline, SSL status)
- Site management (add/edit/delete)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Turso (SQLite edge database)
- **ORM**: Drizzle ORM
- **UI**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- [1Password CLI](https://developer.1password.com/docs/cli/get-started/) (for secure credential management)
- [Turso CLI](https://docs.turso.tech/cli/introduction)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

**Recommended: Using 1Password (Team Setup)**

This project uses 1Password for secure credential management. All secrets are stored in 1Password and injected at runtime.

```bash
# Generate .env.local from 1Password (requires access to Business vault)
npm run env:inject
```

**Alternative: Manual Setup (Development Only)**

If you don't have access to the team's 1Password vault:

```bash
# Copy the example file
cp .env.example .env.local

# Generate secrets
ENCRYPTION_SECRET=$(openssl rand -base64 32)
AUTH_SECRET=$(openssl rand -base64 32)

# Add to .env.local
echo "ENCRYPTION_SECRET=$ENCRYPTION_SECRET" >> .env.local
echo "AUTH_SECRET=$AUTH_SECRET" >> .env.local

# Set up your own Turso database
turso db create wp-manager-dev
turso db show wp-manager-dev --url    # Add to .env.local
turso db tokens create wp-manager-dev # Add to .env.local
```

### 3. Push database schema

```bash
npm run db:push
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Adding WordPress Sites

1. In your WordPress site, go to: **Users > Profile > Application Passwords**
2. Create a new application password
3. In WP Manager, click "Add Site" and enter the URL and credentials

## Environment Variables

Required:
- `TURSO_DATABASE_URL` - Turso database connection URL
- `TURSO_AUTH_TOKEN` - Turso authentication token
- `ENCRYPTION_SECRET` - Secret for encrypting sensitive data (32+ characters)
- `AUTH_SECRET` - Secret for session authentication (32+ characters)
- `NEXT_PUBLIC_APP_URL` - Public URL of the application

Optional:
- `ADMIN_PASSWORD` - Enable basic auth protection
- `RESEND_API_KEY` - For email notifications (future feature)

See `.env.example` for details.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run env:inject` - Generate .env.local from 1Password
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Environment variables are automatically deployed from 1Password to Vercel for team members with access.

If setting up a new deployment, ensure these environment variables are set:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `ENCRYPTION_SECRET`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`

## License

MIT
