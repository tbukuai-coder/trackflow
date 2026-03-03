"use server";

import { hash, verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

import { lucia } from "./auth";
import { db } from "@/db";
import { users, workspaces, workspaceMembers } from "@/db/schema";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "All fields are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  // Check if user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  if (existingUser) {
    return { error: "Email already registered" };
  }

  const hashedPassword = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const userId = nanoid();

  await db.insert(users).values({
    id: userId,
    email: email.toLowerCase(),
    name,
    hashedPassword,
  });

  // Create a default workspace for the user
  const workspaceId = nanoid();
  const workspaceSlug = `${name.toLowerCase().replace(/\s+/g, "-")}-workspace-${nanoid(6)}`;

  await db.insert(workspaces).values({
    id: workspaceId,
    name: `${name}'s Workspace`,
    slug: workspaceSlug,
    ownerId: userId,
  });

  await db.insert(workspaceMembers).values({
    id: nanoid(),
    workspaceId,
    userId,
    role: "owner",
  });

  // Create session
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  redirect(`/${workspaceSlug}`);
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "All fields are required" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  if (!user) {
    return { error: "Invalid email or password" };
  }

  const validPassword = await verify(user.hashedPassword, password);

  if (!validPassword) {
    return { error: "Invalid email or password" };
  }

  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  // Get user's first workspace
  const membership = await db.query.workspaceMembers.findFirst({
    where: eq(workspaceMembers.userId, user.id),
    with: {
      workspace: true,
    },
  });

  if (membership) {
    redirect(`/${(membership as any).workspace.slug}`);
  }

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value;

  if (sessionId) {
    await lucia.invalidateSession(sessionId);
  }

  const sessionCookie = lucia.createBlankSessionCookie();
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  redirect("/login");
}
