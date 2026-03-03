"use client";

import { useState } from "react";
import { cancelInvite, resendInvite } from "@/lib/actions/members";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Invite {
  id: string;
  email: string;
  role: "admin" | "member" | "viewer";
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

interface InvitesTableProps {
  workspaceSlug: string;
  invites: Invite[];
}

const roleColors = {
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  member: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export function InvitesTable({ workspaceSlug, invites }: InvitesTableProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCancel(inviteId: string) {
    if (!confirm("Are you sure you want to cancel this invite?")) return;

    setLoading(inviteId);
    await cancelInvite(workspaceSlug, inviteId);
    setLoading(null);
    window.location.reload();
  }

  async function handleResend(inviteId: string) {
    setLoading(inviteId);
    const result = await resendInvite(workspaceSlug, inviteId);
    setLoading(null);

    if (result.success && result.inviteLink) {
      const fullUrl = `${window.location.origin}${result.inviteLink}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(inviteId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function copyLink(token: string, inviteId: string) {
    const fullUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(inviteId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function isExpired(expiresAt: Date) {
    return new Date() > new Date(expiresAt);
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => {
            const expired = isExpired(invite.expiresAt);

            return (
              <TableRow key={invite.id}>
                <TableCell className="font-medium">{invite.email}</TableCell>
                <TableCell>
                  <Badge className={roleColors[invite.role]} variant="outline">
                    {invite.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {expired ? (
                    <Badge variant="destructive">Expired</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(invite.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={loading === invite.id}
                      >
                        {loading === invite.id ? "..." : "⋮"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => copyLink(invite.token, invite.id)}
                      >
                        {copiedId === invite.id ? "Copied!" : "Copy Link"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleResend(invite.id)}
                      >
                        Resend Invite
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleCancel(invite.id)}
                      >
                        Cancel Invite
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
