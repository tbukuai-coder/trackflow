# Roadmap & Pending Features

This document outlines planned features and improvements for Trackflow. Contributions welcome!

## 🎯 Priority Features

### High Priority

- [ ] **Comments on Tasks**
  - Add comment thread to task detail view
  - Mention users with `@username`
  - Real-time updates (optional)
  - Files: `src/components/task-comments.tsx`, `src/lib/actions/comments.ts`

- [ ] **Drag-and-Drop Task Board**
  - Drag tasks between columns (Todo → In Progress → Done)
  - Reorder tasks within columns
  - Library suggestion: `@dnd-kit/core` or `react-beautiful-dnd`
  - Files: Update `src/components/task-board.tsx`

- [ ] **Task Detail Modal/Page**
  - Full task view with all fields
  - Edit task inline
  - Comments section
  - Activity history
  - Files: `src/components/task-detail.tsx`

### Medium Priority

- [ ] **Email Notifications**
  - Send invite emails (currently just returns link)
  - Task assignment notifications
  - Due date reminders
  - Library suggestion: Resend, SendGrid, or Postmark
  - Files: `src/lib/email.ts`, update `src/lib/actions/members.ts`

- [ ] **Search & Filters**
  - Search tasks by title/description
  - Filter by assignee, priority, due date
  - Filter by project
  - Files: `src/components/task-filters.tsx`

- [ ] **User Profile Settings**
  - Update name, avatar
  - Change password
  - Files: `src/app/(dashboard)/settings/profile/page.tsx`

- [ ] **Workspace Settings Enhancement**
  - Edit workspace name
  - Delete workspace (owner only)
  - Transfer ownership
  - Files: Update `src/app/(dashboard)/[workspace]/settings/page.tsx`

### Lower Priority

- [ ] **Dark Mode Toggle**
  - System preference detection
  - Manual toggle in UI
  - Library: `next-themes` (already compatible with shadcn)

- [ ] **Task Labels/Tags**
  - Create custom labels with colors
  - Filter tasks by labels
  - Schema update needed

- [ ] **Task Subtasks/Checklist**
  - Add checklist items to tasks
  - Track completion percentage
  - Schema update needed

- [ ] **File Attachments**
  - Upload files to tasks
  - Image preview
  - Storage: S3, Cloudflare R2, or Uploadthing

- [ ] **Activity Feed Page**
  - Workspace-wide activity timeline
  - Filter by user, action type
  - Files: `src/app/(dashboard)/[workspace]/activity/page.tsx`

## 🔧 Technical Improvements

### Performance

- [ ] **Optimistic Updates**
  - Instant UI feedback for task status changes
  - Rollback on error
  - Files: Update `src/components/task-board.tsx`

- [ ] **Data Caching**
  - Implement React Query or SWR
  - Cache workspace/project data
  - Reduce API calls

- [ ] **Pagination**
  - Paginate tasks list for large projects
  - Infinite scroll option

### Security

- [ ] **Rate Limiting**
  - Protect auth endpoints
  - Protect invite creation
  - Library: `@upstash/ratelimit`

- [ ] **Input Validation**
  - Add Zod schemas for all inputs
  - Server-side validation
  - Library: `zod`

- [ ] **CSRF Protection**
  - Already handled by Next.js Server Actions
  - Verify implementation

### Developer Experience

- [ ] **Testing**
  - Unit tests for server actions
  - Integration tests for API routes
  - E2E tests with Playwright
  - Files: `__tests__/`, `e2e/`

- [ ] **Error Handling**
  - Global error boundary
  - Toast notifications for errors
  - Sentry integration (optional)

- [ ] **Logging**
  - Structured logging
  - Request tracing
  - Library: `pino` or `winston`

## 🚀 Future Ideas

- [ ] **OAuth Providers** - Google, GitHub login
- [ ] **Real-time Updates** - WebSocket/SSE for live collaboration
- [ ] **Mobile App** - React Native or PWA
- [ ] **API Access** - Public API with API keys
- [ ] **Webhooks** - Notify external services on events
- [ ] **Import/Export** - CSV, JSON data export
- [ ] **Templates** - Project/task templates
- [ ] **Time Tracking** - Track time spent on tasks
- [ ] **Calendar View** - View tasks by due date
- [ ] **Recurring Tasks** - Daily/weekly task repetition
- [ ] **Guest Access** - View-only links without login

## 📁 File Structure Reference

```
src/
├── app/
│   ├── (auth)/           # Login, signup pages
│   ├── (dashboard)/      # Protected workspace pages
│   │   └── [workspace]/
│   │       ├── members/
│   │       ├── projects/
│   │       └── settings/
│   ├── api/              # API routes
│   └── invite/           # Invite acceptance
├── components/
│   ├── ui/               # shadcn components
│   ├── sidebar.tsx
│   ├── task-board.tsx
│   └── ...
├── db/
│   ├── index.ts          # Drizzle client
│   └── schema.ts         # Database schema
└── lib/
    ├── actions/          # Server actions
    ├── auth.ts           # Lucia setup
    └── permissions.ts    # Role checks
```

## 🤝 Contributing

1. Pick a feature from this list
2. Create an issue to discuss approach
3. Fork and implement
4. Submit PR with tests if applicable

For questions, open a GitHub issue or discussion.
