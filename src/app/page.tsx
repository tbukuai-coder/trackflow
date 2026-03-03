import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { validateRequest } from "@/lib/session";
import { db } from "@/db";
import { workspaceMembers, workspaces } from "@/db/schema";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { user } = await validateRequest();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold">Trackflow</h1>
          <p className="text-xl text-muted-foreground">
            Simple project management for teams
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Get user's first workspace
  const membership = await db.query.workspaceMembers.findFirst({
    where: eq(workspaceMembers.userId, user.id),
  });

  if (membership) {
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, membership.workspaceId),
    });

    if (workspace) {
      redirect(`/${workspace.slug}`);
    }
  }

  // No workspace - redirect to create one (or show onboarding)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Welcome to Trackflow</h1>
        <p className="text-xl text-muted-foreground">
          You don&apos;t have any workspaces yet.
        </p>
        <p className="text-muted-foreground">
          Contact an admin to get invited to a workspace.
        </p>
      </div>
    </div>
  );
}
