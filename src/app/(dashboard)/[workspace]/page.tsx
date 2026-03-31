import { eq, count } from "drizzle-orm";
import { validateRequest } from "@/lib/session";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { db } from "@/db";
import { projects, tasks, workspaceMembers } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkspacePageProps {
  params: Promise<{ workspace: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspace: workspaceSlug } = await params;
  const { user } = await validateRequest();

  if (!user) return null;

  const { workspace } = await requireWorkspaceAccess(user.id, workspaceSlug);

  // Get stats
  const [projectCount] = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.workspaceId, workspace.id));

  const [memberCount] = await db
    .select({ count: count() })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspace.id));

  // Get tasks assigned to current user
  const projectIds = await db.query.projects.findMany({
    where: eq(projects.workspaceId, workspace.id),
    columns: { id: true },
  });

  let taskStats = { todo: 0, inProgress: 0, done: 0 };

  if (projectIds.length > 0) {
    const userTasks = await db.query.tasks.findMany({
      where: eq(tasks.assigneeId, user.id),
    });

    taskStats = userTasks.reduce(
      (acc, task) => {
        if (task.status === "todo") acc.todo++;
        else if (task.status === "in_progress") acc.inProgress++;
        else if (task.status === "done") acc.done++;
        return acc;
      },
      { todo: 0, inProgress: 0, done: 0 }
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{workspace.name}</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user.name}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount.count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount.count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks (Todo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.todo}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.inProgress}</div>
          </CardContent>
        </Card>
      </div>

      {projectCount.count === 0 && (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first project
            </p>
            <a
              href={`/${workspaceSlug}/projects`}
              className="text-primary hover:underline"
            >
              Go to Projects →
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
