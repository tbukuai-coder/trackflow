import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/session";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
      <Toaster />
    </div>
  );
}
