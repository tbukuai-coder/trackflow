import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { validateRequest } from "@/lib/session";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { db } from "@/db";
import { projects } from "@/db/schema";
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
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
