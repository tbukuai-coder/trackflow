"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Member {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface MembersTableProps {
  workspaceSlug: string;
  members: Member[];
  currentUserId: string;
  canManage: boolean;
}

const roleColors = {
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  member: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export function MembersTable({
  workspaceSlug,
  members,
  currentUserId,
  canManage,
}: MembersTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleRoleChange(memberId: string, newRole: string) {
    setLoading(memberId);
    
    try {
      await fetch(`/api/workspaces/${workspaceSlug}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      
      window.location.reload();
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setLoading(null);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    setLoading(memberId);
    
    try {
      await fetch(`/api/workspaces/${workspaceSlug}/members/${memberId}`, {
        method: "DELETE",
      });
      
      window.location.reload();
    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            {canManage && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isCurrentUser = member.userId === currentUserId;
            const isOwner = member.role === "owner";

            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {member.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.user.name}
                        {isCurrentUser && (
                          <span className="text-muted-foreground ml-2">(you)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {canManage && !isOwner && !isCurrentUser ? (
                    <Select
                      defaultValue={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value)}
                      disabled={loading === member.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={roleColors[member.role]} variant="outline">
                      {member.role}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    {!isOwner && !isCurrentUser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={loading === member.id}
                      >
                        Remove
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
