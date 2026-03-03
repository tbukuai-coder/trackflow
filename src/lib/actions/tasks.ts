"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { tasks, projects, activityLog } from "@/db/schema";
import { validateRequest } from "@/lib/session";
import { requireWorkspaceAccess, canEditTask } from "@/lib/permissions";

export async function createTask(
  workspaceSlug: string,
  projectId: string,
  formData: FormData
) {
  const { user } = await validateRequest();
  if (!user) return { error: "Unauthorized" };

  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug, "member");

  if (!canEditTask(role)) {
    return { error: "You don't have permission to create tasks" };
  }

  // Verify project belongs to workspace
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.workspaceId, workspace.id)),
  });

  if (!project) {
    return { error: "Project not found" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string;
  const assigneeId = formData.get("assigneeId") as string;
  const dueDate = formData.get("dueDate") as string;

  if (!title || title.trim().length === 0) {
    return { error: "Task title is required" };
  }

  const taskId = nanoid();

  await db.insert(tasks).values({
    id: taskId,
    projectId,
    title: title.trim(),
    description: description?.trim() || null,
    priority: (priority as any) || "medium",
    assigneeId: assigneeId || null,
    dueDate: dueDate ? new Date(dueDate) : null,
    createdBy: user.id,
  });

  // Log activity
  await db.insert(activityLog).values({
    id: nanoid(),
    workspaceId: workspace.id,
    userId: user.id,
    action: "created_task",
    entityType: "task",
    entityId: taskId,
    metadata: JSON.stringify({ title, projectId }),
  });

  revalidatePath(`/${workspaceSlug}/projects/${projectId}`);

  return { success: true, taskId };
}

export async function updateTask(
  workspaceSlug: string,
  projectId: string,
  taskId: string,
  data: {
    title?: string;
    description?: string;
    status?: "todo" | "in_progress" | "done";
    priority?: "low" | "medium" | "high" | "urgent";
    assigneeId?: string | null;
    dueDate?: Date | null;
  }
) {
  const { user } = await validateRequest();
  if (!user) return { error: "Unauthorized" };

  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug, "member");

  if (!canEditTask(role)) {
    return { error: "You don't have permission to edit tasks" };
  }

  const updateData: any = { updatedAt: new Date() };

  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;

  await db
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)));

  // Log activity
  await db.insert(activityLog).values({
    id: nanoid(),
    workspaceId: workspace.id,
    userId: user.id,
    action: "updated_task",
    entityType: "task",
    entityId: taskId,
    metadata: JSON.stringify(data),
  });

  revalidatePath(`/${workspaceSlug}/projects/${projectId}`);

  return { success: true };
}

export async function deleteTask(
  workspaceSlug: string,
  projectId: string,
  taskId: string
) {
  const { user } = await validateRequest();
  if (!user) return { error: "Unauthorized" };

  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug, "member");

  await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)));

  revalidatePath(`/${workspaceSlug}/projects/${projectId}`);

  return { success: true };
}

export async function updateTaskStatus(
  workspaceSlug: string,
  projectId: string,
  taskId: string,
  status: "todo" | "in_progress" | "done"
) {
  return updateTask(workspaceSlug, projectId, taskId, { status });
}
