"use client";

import { useState } from "react";
import { inviteMember } from "@/lib/actions/members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteMemberDialogProps {
  workspaceSlug: string;
}

export function InviteMemberDialog({ workspaceSlug }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setInviteLink(null);

    const result = await inviteMember(workspaceSlug, formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.success) {
      setSuccess(result.message || "Invite sent!");
      if (result.inviteLink) {
        setInviteLink(result.inviteLink);
      }
      setLoading(false);
      
      // Close dialog after delay if no invite link to show
      if (!result.inviteLink) {
        setTimeout(() => {
          setOpen(false);
          setSuccess(null);
        }, 1500);
      }
    }
  }

  function handleClose() {
    setOpen(false);
    setError(null);
    setSuccess(null);
    setInviteLink(null);
  }

  function copyInviteLink() {
    if (inviteLink) {
      const fullUrl = `${window.location.origin}${inviteLink}`;
      navigator.clipboard.writeText(fullUrl);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Invite Member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invite to add someone to your workspace
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4 py-4">
            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950 rounded-md">
              {success}
            </div>
            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}${inviteLink}`}
                  className="font-mono text-sm"
                />
                <Button type="button" variant="outline" onClick={copyInviteLink}>
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with the person you want to invite. The link expires in 7 days.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={handleSubmit}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950 rounded-md">
                  {success}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="member">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex flex-col items-start">
                        <span>Admin</span>
                        <span className="text-xs text-muted-foreground">
                          Can manage members and all projects
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="member">
                      <div className="flex flex-col items-start">
                        <span>Member</span>
                        <span className="text-xs text-muted-foreground">
                          Can create and edit projects/tasks
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex flex-col items-start">
                        <span>Viewer</span>
                        <span className="text-xs text-muted-foreground">
                          Can only view projects and tasks
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Invite"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
