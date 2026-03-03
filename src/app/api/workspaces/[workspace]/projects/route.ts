import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { validateRequest } from "@/lib/session";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspace: string }> }
) {
  try {
    const { workspace: workspaceSlug } = await params;
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspace } = await requireWorkspaceAccess(user.id, workspaceSlug);

    const workspaceProjects = await db.query.projects.findMany({
      where: eq(projects.workspaceId, workspace.id),
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });

    // Get task counts for each project
    const projectsWithCounts = await Promise.all(
      workspaceProjects.map(async (project) => {
        const [result] = await db
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(eq(tasks.projectId, project.id));

        return {
          ...project,
          _count: { tasks: Number(result.count) },
        };
      })
    );

    return NextResponse.json({ projects: projectsWithCounts });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
