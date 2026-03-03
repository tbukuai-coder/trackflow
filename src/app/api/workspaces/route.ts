import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { validateRequest } from "@/lib/session";
import { db } from "@/db";
import { workspaces, workspaceMembers } from "@/db/schema";

export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all workspaces the user is a member of
    const memberships = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.userId, user.id),
    });

    const userWorkspaces = await Promise.all(
      memberships.map(async (membership) => {
        const workspace = await db.query.workspaces.findFirst({
          where: eq(workspaces.id, membership.workspaceId),
        });
        return workspace ? { ...workspace, role: membership.role } : null;
      })
    );

    return NextResponse.json({
      workspaces: userWorkspaces.filter(Boolean),
    });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }

    // Generate slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${nanoid(6)}`;

    // Check if slug exists (unlikely with nanoid)
    const existing = await db.query.workspaces.findFirst({
      where: eq(workspaces.slug, slug),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Please try again" },
        { status: 400 }
      );
    }

    const workspaceId = nanoid();

    // Create workspace
    await db.insert(workspaces).values({
      id: workspaceId,
      name: name.trim(),
      slug,
      ownerId: user.id,
    });

    // Add user as owner
    await db.insert(workspaceMembers).values({
      id: nanoid(),
      workspaceId,
      userId: user.id,
      role: "owner",
    });

    return NextResponse.json({
      id: workspaceId,
      name: name.trim(),
      slug,
    });
  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}
