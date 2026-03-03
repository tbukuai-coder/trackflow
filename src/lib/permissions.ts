import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { workspaceMembers, workspaces } from "@/db/schema";
import type { Role } from "@/db/schema";

export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export async function getUserWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<Role | null> {
  const member = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.workspaceId, workspaceId)
    ),
  });

  return member?.role ?? null;
}

export async function getWorkspaceBySlug(slug: string) {
  return db.query.workspaces.findFirst({
    where: eq(workspaces.slug, slug),
  });
}

export async function requireWorkspaceAccess(
  userId: string,
  workspaceSlug: string,
  requiredRole: Role = "viewer"
) {
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const role = await getUserWorkspaceRole(userId, workspace.id);

  if (!role) {
    throw new Error("Not a member of this workspace");
  }

  if (!hasPermission(role, requiredRole)) {
    throw new Error("Insufficient permissions");
  }

  return { workspace, role };
}

// Permission checks for specific actions
export const canManageMembers = (role: Role) => hasPermission(role, "admin");
export const canDeleteWorkspace = (role: Role) => role === "owner";
export const canCreateProject = (role: Role) => hasPermission(role, "member");
export const canDeleteProject = (role: Role) => hasPermission(role, "admin");
export const canEditTask = (role: Role) => hasPermission(role, "member");
export const canComment = (role: Role) => hasPermission(role, "member");
