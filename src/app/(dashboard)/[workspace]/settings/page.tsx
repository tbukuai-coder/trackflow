import { validateRequest } from "@/lib/session";
import { requireWorkspaceAccess, canDeleteWorkspace } from "@/lib/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SettingsPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspace: workspaceSlug } = await params;
  const { user } = await validateRequest();

  if (!user) return null;

  const { workspace, role } = await requireWorkspaceAccess(user.id, workspaceSlug);

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your workspace settings</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic workspace information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input id="name" defaultValue={workspace.name} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input id="slug" defaultValue={workspace.slug} disabled />
            </div>
            <div className="flex items-center gap-2">
              <Label>Your Role:</Label>
              <Badge variant="outline">{role}</Badge>
            </div>
          </CardContent>
        </Card>

        {canDeleteWorkspace(role) && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" disabled>
                Delete Workspace
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will permanently delete the workspace and all its data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
