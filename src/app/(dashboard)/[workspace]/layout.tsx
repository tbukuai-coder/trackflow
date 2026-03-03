import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { validateRequest } from "@/lib/session";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { db } from "@/db";
import { projects, workspaceMembers, workspaces } from "@/db/schema";
import { Sidebar } from "@/components/sidebar";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspace: workspaceSlug } = await params;
  const { user } = await validateRequest();

  if (!user) {
    notFound();
  }

  let workspaceData;
  try {
    workspaceData = await requireWorkspaceAccess(user.id, workspaceSlug);
  } catch {
    notFound();
  }

  const { workspace } = workspaceData;

  // Get workspace projects
  const workspaceProjects = await db.query.projects.findMany({
    where: eq(projects.workspaceId, workspace.id),
    columns: {
      id: true,
      name: true,
    },
    orderBy: (projects, { desc }) => [desc(projects.createdAt)],
  });

  // Get all workspaces the user is a member of
  const memberships = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.userId, user.id),
  });

  const allWorkspaces = await Promise.all(
    memberships.map(async (membership) => {
      const ws = await db.query.workspaces.findFirst({
        where: eq(workspaces.id, membership.workspaceId),
      });
      return ws ? { ...ws, role: membership.role } : null;
    })
  );

  return (
    <div className="flex h-screen">
      <Sidebar
        workspace={{
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
        }}
        user={{
          name: user.name,
          email: user.email,
        }}
        projects={workspaceProjects}
        allWorkspaces={allWorkspaces.filter(Boolean) as any}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
