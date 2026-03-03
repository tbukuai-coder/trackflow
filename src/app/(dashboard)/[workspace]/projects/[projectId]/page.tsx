import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { validateRequest } from "@/lib/session";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { db } from "@/db";
import { projects, tasks, users, workspaceMembers } from "@/db/schema";
import { TaskBoard } from "@/components/task-board";

interface ProjectPageProps {
  params: Promise<{ workspace: string; projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { workspace: workspaceSlug, projectId } = await params;
  const { user } = await validateRequest();

  if (!user) return notFound();

  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug);

  // Get project
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.workspaceId, workspace.id)
    ),
  });

  if (!project) {
    notFound();
  }

  // Get tasks with assignee info
  const projectTasks = await db.query.tasks.findMany({
    where: eq(tasks.projectId, projectId),
    orderBy: (tasks, { asc }) => [asc(tasks.createdAt)],
  });

  // Get assignee details
  const tasksWithAssignees = await Promise.all(
    projectTasks.map(async (task) => {
      if (!task.assigneeId) return { ...task, assignee: null };
      
      const assignee = await db.query.users.findFirst({
        where: eq(users.id, task.assigneeId),
        columns: { id: true, name: true, email: true, avatar: true },
      });
      
      return { ...task, assignee: assignee ?? null };
    })
  );

  // Get workspace members for assignment dropdown
  const members = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.workspaceId, workspace.id),
  });

  const membersWithDetails = await Promise.all(
    members.map(async (member) => {
      const memberUser = await db.query.users.findFirst({
        where: eq(users.id, member.userId),
        columns: { id: true, name: true, email: true, avatar: true },
      });
      return { ...member, user: memberUser ?? null };
    })
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="text-muted-foreground mt-1">{project.description}</p>
        )}
      </div>

      <TaskBoard
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        tasks={tasksWithAssignees}
        members={membersWithDetails}
        userRole={role}
      />
    </div>
  );
}
