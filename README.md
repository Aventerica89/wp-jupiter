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

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Turso database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login and create database
turso auth login
turso db create wp-manager

# Get credentials
turso db show wp-manager --url
turso db tokens create wp-manager
```

### 3. Configure environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Add your Turso credentials:

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

### 4. Push database schema

```bash
npm run db:push
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Adding WordPress Sites

1. In your WordPress site, go to: **Users > Profile > Application Passwords**
2. Create a new application password
3. In WP Manager, click "Add Site" and enter the URL and credentials

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Add your `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` as environment variables.

## License

MIT
