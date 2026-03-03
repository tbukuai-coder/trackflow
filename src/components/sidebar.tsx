"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    name: string;
    email: string;
  };
  projects: {
    id: string;
    name: string;
  }[];
}

const navItems = [
  { label: "Overview", href: "" },
  { label: "Projects", href: "/projects" },
  { label: "Members", href: "/members" },
  { label: "Settings", href: "/settings" },
];

export function Sidebar({ workspace, user, projects }: SidebarProps) {
  const pathname = usePathname();
  const basePath = `/${workspace.slug}`;

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-muted/30">
      {/* Workspace header */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href={basePath} className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          <span className="truncate">{workspace.name}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const href = `${basePath}${item.href}`;
          const isActive =
            item.href === ""
              ? pathname === basePath
              : pathname.startsWith(href);

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}

        {/* Projects list */}
        {projects.length > 0 && (
          <div className="pt-4">
            <p className="mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Projects
            </p>
            {projects.map((project) => {
              const href = `${basePath}/projects/${project.id}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={project.id}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="truncate">{project.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User menu */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-sm">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {user.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">Profile settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logout}>
                <button type="submit" className="w-full text-left">
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
