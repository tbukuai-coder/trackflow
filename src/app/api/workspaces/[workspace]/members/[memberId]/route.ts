import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { validateRequest } from "@/lib/session";
import { requireWorkspaceAccess, canManageMembers } from "@/lib/permissions";
import { db } from "@/db";
import { workspaceMembers } from "@/db/schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspace: string; memberId: string }> }
) {
  try {
    const { workspace: workspaceSlug, memberId } = await params;
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug, "admin");

    if (!canManageMembers(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { role: newRole } = await request.json();

    if (!["admin", "member", "viewer"].includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Can't change owner's role
    const targetMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.id, memberId),
        eq(workspaceMembers.workspaceId, workspace.id)
      ),
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (targetMember.role === "owner") {
      return NextResponse.json({ error: "Cannot change owner's role" }, { status: 400 });
    }

    await db
      .update(workspaceMembers)
      .set({ role: newRole })
      .where(eq(workspaceMembers.id, memberId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspace: string; memberId: string }> }
) {
  try {
    const { workspace: workspaceSlug, memberId } = await params;
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug, "admin");

    if (!canManageMembers(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can't remove owner
    const targetMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.id, memberId),
        eq(workspaceMembers.workspaceId, workspace.id)
      ),
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (targetMember.role === "owner") {
      return NextResponse.json({ error: "Cannot remove owner" }, { status: 400 });
    }

    // Can't remove yourself
    if (targetMember.userId === user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    await db
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.id, memberId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
