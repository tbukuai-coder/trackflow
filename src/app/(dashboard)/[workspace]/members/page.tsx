import { eq } from "drizzle-orm";
import { validateRequest } from "@/lib/session";
import { requireWorkspaceAccess, canManageMembers } from "@/lib/permissions";
import { db } from "@/db";
import { workspaceMembers, workspaceInvites, users } from "@/db/schema";
import { MembersTable } from "@/components/members-table";
import { InvitesTable } from "@/components/invites-table";
import { InviteMemberDialog } from "@/components/invite-member-dialog";

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

  // Get pending invites
  const pendingInvites = await db.query.workspaceInvites.findMany({
    where: eq(workspaceInvites.workspaceId, workspace.id),
    orderBy: (invites, { desc }) => [desc(invites.createdAt)],
  });

  const canInvite = canManageMembers(role);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workspace team members
          </p>
        </div>

        {canInvite && <InviteMemberDialog workspaceSlug={workspaceSlug} />}
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Team Members ({membersWithDetails.length})
          </h2>
          <MembersTable
            workspaceSlug={workspaceSlug}
            members={membersWithDetails}
            currentUserId={user.id}
            canManage={canInvite}
          />
        </div>

        {canInvite && pendingInvites.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Pending Invites ({pendingInvites.length})
            </h2>
            <InvitesTable
              workspaceSlug={workspaceSlug}
              invites={pendingInvites}
            />
          </div>
        )}
      </div>
    </div>
  );
}
