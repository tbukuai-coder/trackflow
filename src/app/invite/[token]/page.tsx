"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "@/lib/actions/members";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAccept() {
    setLoading(true);
    setError(null);

    const result = await acceptInvite(token);

    if (result.error) {
      setError(result.error);
      if (result.redirect) {
        // Store token in sessionStorage for after login
        sessionStorage.setItem("pendingInvite", token);
        setTimeout(() => router.push(result.redirect!), 2000);
      }
      setLoading(false);
      return;
    }

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push(result.workspaceSlug ? `/${result.workspaceSlug}` : "/");
      }, 1500);
    }
  }

  // Check for pending invite after login
  useEffect(() => {
    const pendingToken = sessionStorage.getItem("pendingInvite");
    if (pendingToken === token) {
      sessionStorage.removeItem("pendingInvite");
      handleAccept();
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Workspace Invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join a workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950 rounded-md">
              Successfully joined! Redirecting...
            </div>
          )}
          {!success && !error && (
            <p className="text-muted-foreground">
              Click the button below to accept the invitation and join the workspace.
            </p>
          )}
        </CardContent>
        {!success && (
          <CardFooter className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleAccept} disabled={loading}>
              {loading ? "Joining..." : "Accept Invitation"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
