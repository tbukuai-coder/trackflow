# Changelog

All notable changes to Trackflow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.3.0] - 2026-03-03

### Added

#### Task Edit Functionality
- Task detail dialog with view and edit modes
- Click any task card to open detail view
- Edit all task fields: title, description, status, priority, assignee, due date
- Delete task directly from detail dialog
- Cancel button reverts unsaved changes
- Optimistic UI updates for status changes

### Components Added
- `TaskDetailDialog` - full task view/edit modal

## [0.2.0] - 2026-03-03

### Added

#### Workspace Switcher
- Dropdown menu in sidebar to switch between workspaces
- Visual indicator (checkmark) for current workspace
- "Create Workspace" option directly from dropdown
- API endpoint `GET /api/workspaces` - list user's workspaces
- API endpoint `POST /api/workspaces` - create new workspace

#### Invite Members by Email
- Invite dialog with email input and role selection (Admin/Member/Viewer)
- Smart handling: existing users added instantly, new users receive invite link
- Pending invites table showing status, role, and sent date
- Invite actions: copy link, resend (extends expiry), cancel
- Accept invite page at `/invite/[token]`
- 7-day invite expiration
- Activity logging for all invite-related actions
- Server actions: `inviteMember`, `acceptInvite`, `cancelInvite`, `resendInvite`

### Components Added
- `WorkspaceSwitcher` - workspace dropdown with create dialog
- `InviteMemberDialog` - invite form with role selection
- `InvitesTable` - pending invites management

## [0.1.0] - 2026-03-03

### Added

#### Core Features
- Next.js 14 with App Router
- Tailwind CSS + shadcn/ui components
- Turso (SQLite) database with Drizzle ORM
- Lucia authentication (email/password)

#### Authentication
- User signup with email and password
- User login with session management
- Secure password hashing (Argon2)
- Protected routes with middleware

#### Workspaces
- Create workspace on signup
- Role-based access control (Owner, Admin, Member, Viewer)
- Workspace settings page

#### Projects
- Create, edit, archive projects
- Project listing with task counts
- Project detail page

#### Tasks
- Kanban board (Todo, In Progress, Done)
- Create tasks with title, description, priority
- Assign tasks to team members
- Set due dates
- Move tasks between columns
- Delete tasks

#### Members
- View workspace members
- Change member roles (Admin only)
- Remove members (Admin only)

#### Activity Logging
- Track project creation
- Track task creation and updates
- Track member changes

### Technical
- Drizzle ORM schema with relations
- Server actions for mutations
- API routes for data fetching
- Type-safe database queries
