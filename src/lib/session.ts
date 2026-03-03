import { cookies } from "next/headers";
import { cache } from "react";
import { lucia } from "./auth";

export const validateRequest = cache(async () => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;

  if (!sessionId) {
    return { user: null, session: null };
  }

  const result = await lucia.validateSession(sessionId);

  try {
    if (result.session && result.session.fresh) {
      const sessionCookie = lucia.createSessionCookie(result.session.id);
      cookieStore.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
    }
    if (!result.session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookieStore.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
    }
  } catch {
    // Next.js throws error when setting cookies in Server Components
  }

  return result;
});

export const getUser = cache(async () => {
  const { user } = await validateRequest();
  return user;
});

export const requireAuth = async () => {
  const { user, session } = await validateRequest();
  if (!user || !session) {
    throw new Error("Unauthorized");
  }
  return { user, session };
};
