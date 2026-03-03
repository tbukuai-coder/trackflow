# AGENTS.md - AI Agent Guide for Trackflow

This document helps AI coding agents understand and work with the Trackflow codebase.

## Project Overview

**Trackflow** is a project management tool with workspaces, projects, and kanban-style task boards.

| Aspect | Details |
|--------|---------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | Turso (SQLite) via Drizzle ORM |
| **Auth** | Lucia (session-based) |
| **Package Manager** | npm |

## Quick Commands

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run lint      # Run ESLint
npx drizzle-kit push    # Push schema changes to DB
npx drizzle-kit studio  # Open DB GUI
```

## File Structure

```
trackflow/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group (no layout nesting)
│   │   │   ├── layout.tsx            # Centered auth layout
│   │   │   ├── login/page.tsx        # Login form
│   │   │   └── signup/page.tsx       # Signup form
│   │   │
│   │   ├── (dashboard)/              # Protected dashboard group
│   │   │   ├── layout.tsx            # Auth check, redirects if not logged in
│   │   │   └── [workspace]/          # Dynamic workspace routes
│   │   │       ├── layout.tsx        # Sidebar + workspace data fetching
│   │   │       ├── page.tsx          # Workspace overview/dashboard
│   │   │       ├── members/page.tsx  # Team members + invites
│   │   │       ├── settings/page.tsx # Workspace settings
│   │   │       └── projects/
│   │   │           ├── page.tsx      # Projects list
│   │   │           └── [projectId]/page.tsx  # Kanban task board
│   │   │
│   │   ├── api/                      # API routes
│   │   │   └── workspaces/
│   │   │       ├── route.ts          # GET list, POST create workspace
│   │   │       └── [workspace]/
│   │   │           ├── projects/route.ts           # GET projects
│   │   │           └── members/[memberId]/route.ts # PATCH/DELETE member
│   │   │
│   │   ├── invite/[token]/page.tsx   # Accept invite page
│   │   ├── layout.tsx                # Root layout (fonts, globals)
│   │   ├── page.tsx                  # Home (redirects to workspace or landing)
│   │   └── globals.css               # Tailwind + CSS variables
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components (don't edit directly)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (more)
│   │   │
│   │   ├── sidebar.tsx               # Main navigation sidebar
│   │   ├── workspace-switcher.tsx    # Workspace dropdown
│   │   ├── task-board.tsx            # Kanban board component
│   │   ├── members-table.tsx         # Members list table
│   │   ├── invites-table.tsx         # Pending invites table
│   │   └── invite-member-dialog.tsx  # Invite form dialog
│   │
│   ├── db/
│   │   ├── index.ts                  # Drizzle client initialization
│   │   └── schema.ts                 # Database schema + relations
│   │
│   └── lib/
│       ├── auth.ts                   # Lucia auth configuration
│       ├── auth-actions.ts           # Login, signup, logout server actions
│       ├── session.ts                # Session validation helpers
│       ├── permissions.ts            # Role-based access control
│       ├── utils.ts                  # cn() utility for classnames
│       └── actions/
│           ├── projects.ts           # Project CRUD server actions
│           ├── tasks.ts              # Task CRUD server actions
│           └── members.ts            # Invite/member server actions
│
├── drizzle/                          # Migration files (auto-generated)
├── drizzle.config.ts                 # Drizzle Kit configuration
├── .env.local                        # Environment variables (not in git)
├── .env.example                      # Example env template
├── CHANGELOG.md                      # Version history
├── ROADMAP.md                        # Pending features
└── README.md                         # Setup instructions
```

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (id, email, name, hashedPassword) |
| `sessions` | Lucia auth sessions |
| `workspaces` | Workspaces (id, name, slug, ownerId) |
| `workspace_members` | User-workspace relationship with role |
| `workspace_invites` | Pending email invites |
| `projects` | Projects within workspaces |
| `tasks` | Tasks within projects |
| `comments` | Comments on tasks (schema exists, UI not implemented) |
| `activity_log` | Audit trail of actions |

### Roles

```typescript
type Role = "owner" | "admin" | "member" | "viewer";

// Permission hierarchy (highest to lowest)
// owner > admin > member > viewer
```

### Key Relations

```
User → has many → WorkspaceMembers → belongs to → Workspace
Workspace → has many → Projects → has many → Tasks
Task → has many → Comments
```

## Key Patterns

### Server Actions (Mutations)

All data mutations use Next.js Server Actions in `src/lib/actions/`:

```typescript
// Example: src/lib/actions/tasks.ts
"use server";

export async function createTask(workspaceSlug: string, projectId: string, formData: FormData) {
  const { user } = await validateRequest();
  if (!user) return { error: "Unauthorized" };
  
  // Validate permissions
  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug, "member");
  
  // Do the thing
  await db.insert(tasks).values({ ... });
  
  // Revalidate cache
  revalidatePath(`/${workspaceSlug}/projects/${projectId}`);
  
  return { success: true };
}
```

### API Routes (Read Operations)

Data fetching uses API routes in `src/app/api/`:

```typescript
// Example: src/app/api/workspaces/[workspace]/projects/route.ts
export async function GET(request: NextRequest, { params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: workspaceSlug } = await params;
  const { user } = await validateRequest();
  
  // ... fetch and return data
  return NextResponse.json({ projects });
}
```

### Permission Checks

Always check permissions before mutations:

```typescript
import { requireWorkspaceAccess, canManageMembers } from "@/lib/permissions";

// Throws if user doesn't have access
const { workspace, role } = await requireWorkspaceAccess(userId, workspaceSlug, "member");

// Check specific permission
if (!canManageMembers(role)) {
  return { error: "Forbidden" };
}
```

### Component Patterns

- **Server Components**: Pages and layouts (fetch data directly)
- **Client Components**: Interactive UI (`"use client"` directive)
- **shadcn/ui**: Pre-built components in `src/components/ui/`

```typescript
// Add new shadcn component
npx shadcn@latest add [component-name]
```

## Environment Variables

```bash
# Required
TURSO_DATABASE_URL=libsql://your-db.turso.io  # or file:local.db for local dev
TURSO_AUTH_TOKEN=your-token                    # Not needed for local file

# Optional
NODE_ENV=development
```

## Common Tasks for AI Agents

### Adding a New Feature

1. **Schema change?** Update `src/db/schema.ts`, run `npx drizzle-kit push`
2. **Server action?** Add to `src/lib/actions/[feature].ts`
3. **API route?** Add to `src/app/api/[path]/route.ts`
4. **UI component?** Add to `src/components/[name].tsx`
5. **Page?** Add to `src/app/(dashboard)/[workspace]/[path]/page.tsx`

### Adding a shadcn Component

```bash
npx shadcn@latest add [component]
# Examples: button, dialog, table, tabs, tooltip
```

### Database Queries

```typescript
import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Simple query
const task = await db.query.tasks.findFirst({
  where: eq(tasks.id, taskId),
});

// With relations (defined in schema.ts)
const taskWithComments = await db.query.tasks.findFirst({
  where: eq(tasks.id, taskId),
  with: { comments: true },
});

// Insert
await db.insert(tasks).values({ id: nanoid(), title: "New task", ... });

// Update
await db.update(tasks).set({ status: "done" }).where(eq(tasks.id, taskId));

// Delete
await db.delete(tasks).where(eq(tasks.id, taskId));
```

### Authentication Check

```typescript
import { validateRequest } from "@/lib/session";

const { user, session } = await validateRequest();
if (!user) {
  // Not logged in
}
```

## Testing Changes

```bash
# Type check
npm run build

# Run dev server and test manually
npm run dev
```

## Notes for AI Agents

1. **Always check permissions** before mutations
2. **Use `nanoid()`** for generating IDs
3. **Call `revalidatePath()`** after mutations to refresh UI
4. **Follow existing patterns** - look at similar files for reference
5. **shadcn/ui components** are in `src/components/ui/` - don't modify directly
6. **TypeScript is strict** - handle null/undefined properly
7. **Lucia auth is deprecated** but works - don't upgrade without user consent
8. **Use server actions** for mutations, API routes for reads
9. **Check ROADMAP.md** for pending features
10. **Update CHANGELOG.md** after significant changes
