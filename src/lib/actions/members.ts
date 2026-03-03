"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { workspaceInvites, workspaceMembers, users, activityLog } from "@/db/schema";
import { validateRequest } from "@/lib/session";
import { requireWorkspaceAccess, canManageMembers } from "@/lib/permissions";

export async function inviteMember(workspaceSlug: string, formData: FormData) {
  const { user } = await validateRequest();
  if (!user) return { error: "Unauthorized" };

  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug, "admin");

  if (!canManageMembers(role)) {
    return { error: "You don't have permission to invite members" };
  }

  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const inviteRole = (formData.get("role") as string) || "member";

  if (!email) {
    return { error: "Email is required" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Invalid email format" };
  }

  // Check if user is already a member
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    const existingMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspace.id),
        eq(workspaceMembers.userId, existingUser.id)
      ),
    });

    if (existingMember) {
      return { error: "User is already a member of this workspace" };
    }

    // User exists but not a member - add them directly
    await db.insert(workspaceMembers).values({
      id: nanoid(),
      workspaceId: workspace.id,
      userId: existingUser.id,
      role: inviteRole as "admin" | "member" | "viewer",
    });

    // Log activity
    await db.insert(activityLog).values({
      id: nanoid(),
      workspaceId: workspace.id,
      userId: user.id,
      action: "added_member",
      entityType: "member",
      entityId: existingUser.id,
      metadata: JSON.stringify({ email, role: inviteRole }),
    });

    revalidatePath(`/${workspaceSlug}/members`);
    return { success: true, message: "Member added successfully" };
  }

  // Check for existing pending invite
  const existingInvite = await db.query.workspaceInvites.findFirst({
    where: and(
      eq(workspaceInvites.workspaceId, workspace.id),
      eq(workspaceInvites.email, email)
    ),
  });

  if (existingInvite) {
    return { error: "An invite has already been sent to this email" };
  }

  // Create invite
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(workspaceInvites).values({
    id: nanoid(),
    workspaceId: workspace.id,
    email,
    role: inviteRole as "admin" | "member" | "viewer",
    token,
    expiresAt,
  });

  // Log activity
  await db.insert(activityLog).values({
    id: nanoid(),
    workspaceId: workspace.id,
    userId: user.id,
    action: "invited_member",
    entityType: "invite",
    entityId: email,
    metadata: JSON.stringify({ email, role: inviteRole }),
  });

  revalidatePath(`/${workspaceSlug}/members`);
  
  // In production, you'd send an email here with the invite link
  // For now, return the token for testing
  return { 
    success: true, 
    message: "Invite sent successfully",
    inviteLink: `/invite/${token}` 
  };
}

export async function cancelInvite(workspaceSlug: string, inviteId: string) {
  const { user } = await validateRequest();
  if (!user) return { error: "Unauthorized" };

  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug, "admin");

  if (!canManageMembers(role)) {
    return { error: "You don't have permission to cancel invites" };
  }

  await db
    .delete(workspaceInvites)
    .where(
      and(
        eq(workspaceInvites.id, inviteId),
        eq(workspaceInvites.workspaceId, workspace.id)
      )
    );

  revalidatePath(`/${workspaceSlug}/members`);
  return { success: true };
}

export async function acceptInvite(token: string) {
  const { user } = await validateRequest();
  if (!user) return { error: "Please sign in to accept the invite", redirect: "/login" };

  const invite = await db.query.workspaceInvites.findFirst({
    where: eq(workspaceInvites.token, token),
  });

  if (!invite) {
    return { error: "Invalid or expired invite" };
  }

  if (new Date() > invite.expiresAt) {
    // Delete expired invite
    await db.delete(workspaceInvites).where(eq(workspaceInvites.id, invite.id));
    return { error: "This invite has expired" };
  }

  // Check if user email matches invite
  if (user.email !== invite.email) {
    return { error: `This invite was sent to ${invite.email}. Please sign in with that email.` };
  }

  // Check if already a member
  const existingMember = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, invite.workspaceId),
      eq(workspaceMembers.userId, user.id)
    ),
  });

  if (existingMember) {
    // Delete the invite since they're already a member
    await db.delete(workspaceInvites).where(eq(workspaceInvites.id, invite.id));
    return { error: "You are already a member of this workspace" };
  }

  // Add user as member
  await db.insert(workspaceMembers).values({
    id: nanoid(),
    workspaceId: invite.workspaceId,
    userId: user.id,
    role: invite.role,
  });

  // Delete the invite
  await db.delete(workspaceInvites).where(eq(workspaceInvites.id, invite.id));

  // Get workspace for redirect
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaceInvites.workspaceId, invite.workspaceId),
  });

  // Log activity
  await db.insert(activityLog).values({
    id: nanoid(),
    workspaceId: invite.workspaceId,
    userId: user.id,
    action: "joined_workspace",
    entityType: "member",
    entityId: user.id,
    metadata: JSON.stringify({ role: invite.role }),
  });

  return { 
    success: true, 
    workspaceSlug: workspace?.slug,
    message: "Successfully joined workspace" 
  };
}

export async function resendInvite(workspaceSlug: string, inviteId: string) {
  const { user } = await validateRequest();
  if (!user) return { error: "Unauthorized" };

  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug, "admin");

  if (!canManageMembers(role)) {
    return { error: "You don't have permission to resend invites" };
  }

  // Generate new token and extend expiry
  const newToken = nanoid(32);
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db
    .update(workspaceInvites)
    .set({ 
      token: newToken, 
      expiresAt: newExpiresAt 
    })
    .where(
      and(
        eq(workspaceInvites.id, inviteId),
        eq(workspaceInvites.workspaceId, workspace.id)
      )
    );

  revalidatePath(`/${workspaceSlug}/members`);
  
  return { 
    success: true, 
    message: "Invite resent",
    inviteLink: `/invite/${newToken}`
  };
}
