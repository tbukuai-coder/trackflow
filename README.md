# Trackflow

Simple project management for teams. Built with Next.js, Turso, Drizzle, and Lucia.

## Features

- **Workspaces** - Create and manage multiple workspaces with easy switcher
- **Projects** - Organize work into projects
- **Tasks** - Kanban-style task management (Todo, In Progress, Done)
- **Task Details** - Click to view/edit tasks with full detail modal
- **Team Collaboration** - Invite members by email with role-based permissions
- **Activity Log** - Track all changes

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Turso (SQLite at the edge) |
| ORM | Drizzle |
| Auth | Lucia |
| Deployment | Vercel |

## Roles & Permissions

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| Delete workspace | ✅ | ❌ | ❌ | ❌ |
| Manage members | ✅ | ✅ | ❌ | ❌ |
| Create projects | ✅ | ✅ | ✅ | ❌ |
| Delete projects | ✅ | ✅ | ❌ | ❌ |
| Create/edit tasks | ✅ | ✅ | ✅ | ❌ |
| View tasks | ✅ | ✅ | ✅ | ✅ |
| Comment | ✅ | ✅ | ✅ | ❌ |

## Getting Started

### Prerequisites

- Node.js 18+
- Turso account (free tier works)

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/tbukuai-coder/trackflow.git
   cd trackflow
   npm install
   ```

2. **Create Turso database**
   ```bash
   # Install Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash
   
   # Create database
   turso db create trackflow
   
   # Get credentials
   turso db show trackflow --url
   turso db tokens create trackflow
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   TURSO_DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your-auth-token
   ```

4. **Push database schema**
   ```bash
   npx drizzle-kit push
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Local Development (without Turso)

For local development, you can use a SQLite file:

```env
TURSO_DATABASE_URL=file:local.db
```

## Project Structure

```
trackflow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth pages (login, signup)
│   │   ├── (dashboard)/        # Protected dashboard
│   │   │   └── [workspace]/    # Workspace pages
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   └── ui/                 # shadcn/ui components
│   ├── db/                     # Database
│   │   ├── index.ts            # Drizzle client
│   │   └── schema.ts           # Database schema
│   └── lib/                    # Utilities
│       ├── auth.ts             # Lucia setup
│       ├── auth-actions.ts     # Auth server actions
│       ├── session.ts          # Session helpers
│       ├── permissions.ts      # Role-based access
│       └── actions/            # Server actions
├── drizzle/                    # Migration files
└── drizzle.config.ts           # Drizzle config
```

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
4. Deploy

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npx drizzle-kit push     # Push schema to database
npx drizzle-kit studio   # Open Drizzle Studio
```

## License

MIT

<!-- Test commit for Gito AI review -->
