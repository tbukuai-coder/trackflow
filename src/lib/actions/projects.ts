"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { projects, activityLog } from "@/db/schema";
import { validateRequest } from "@/lib/session";
import { requireWorkspaceAccess, canCreateProject, canEditProject, canDeleteProject } from "@/lib/permissions";

export async function createProject(workspaceSlug: string, formData: FormData) {
  const { user } = await validateRequest();
  if (!user) return { error: "Unauthorized" };

  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug, "member");

  if (!canCreateProject(role)) {
    return { error: "You don't have permission to create projects" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name || name.trim().length === 0) {
    return { error: "Project name is required" };
  }

  const projectId = nanoid();

  await db.insert(projects).values({
    id: projectId,
    workspaceId: workspace.id,
    name: name.trim(),
    description: description?.trim() || null,
    createdBy: user.id,
  });

  // Log activity
  await db.insert(activityLog).values({
    id: nanoid(),
    workspaceId: workspace.id,
    userId: user.id,
    action: "created_project",
    entityType: "project",
    entityId: projectId,
    metadata: JSON.stringify({ name }),
  });

  revalidatePath(`/${workspaceSlug}`);
  revalidatePath(`/${workspaceSlug}/projects`);

  return { success: true, projectId };
}

export async function updateProject(
  workspaceSlug: string,
  projectId: string,
  formData: FormData
) {
  const { user } = await validateRequest();
  if (!user) return { error: "Unauthorized" };

  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug, "member");

  if (!canEditProject(role)) {
    return { error: "You don't have permission to edit projects" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name || name.trim().length === 0) {
    return { error: "Project name is required" };
  }

  await db
    .update(projects)
    .set({
      name: name.trim(),
      description: description?.trim() || null,
    })
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspace.id)));

  revalidatePath(`/${workspaceSlug}`);
  revalidatePath(`/${workspaceSlug}/projects`);
  revalidatePath(`/${workspaceSlug}/projects/${projectId}`);

  return { success: true };
}

export async function deleteProject(workspaceSlug: string, projectId: string) {
  const { user } = await validateRequest();
  if (!user) return { error: "Unauthorized" };

  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug, "admin");

  if (!canDeleteProject(role)) {
    return { error: "You don't have permission to delete projects" };
  }

  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspace.id)));

  revalidatePath(`/${workspaceSlug}`);
  revalidatePath(`/${workspaceSlug}/projects`);

  return { success: true };
}

export async function archiveProject(workspaceSlug: string, projectId: string) {
  const { user } = await validateRequest();
  if (!user) return { error: "Unauthorized" };

  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug, "admin");

  await db
    .update(projects)
    .set({ status: "archived" })
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspace.id)));

  revalidatePath(`/${workspaceSlug}`);
  revalidatePath(`/${workspaceSlug}/projects`);

  return { success: true };
}
