import { eq } from "drizzle-orm";
import { validateRequest } from "@/lib/session";
import { requireWorkspaceAccess, canManageMembers } from "@/lib/permissions";
import { db } from "@/db";
import { workspaceMembers, users } from "@/db/schema";
import { MembersTable } from "@/components/members-table";

interface MembersPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { workspace: workspaceSlug } = await params;
  const { user } = await validateRequest();

  if (!user) return null;

  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug);

  // Get members with user details
  const members = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.workspaceId, workspace.id),
    orderBy: (members, { asc }) => [asc(members.joinedAt)],
  });

  const membersWithDetails = await Promise.all(
    members.map(async (member) => {
      const memberUser = await db.query.users.findFirst({
        where: eq(users.id, member.userId),
        columns: { id: true, name: true, email: true, avatar: true },
      });
      return { ...member, user: memberUser! };
    })
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Members</h1>
        <p className="text-muted-foreground mt-1">
          Manage your workspace team members
        </p>
      </div>

      <MembersTable
        workspaceSlug={workspaceSlug}
        members={membersWithDetails}
        currentUserId={user.id}
        canManage={canManageMembers(role)}
      />
    </div>
  );
}
