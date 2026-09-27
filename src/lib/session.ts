import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export type ChurchRole =
  | "SUPER_ADMIN"
  | "CHURCH_ADMIN"
  | "COORDINATOR"
  | "WORKER"
  | "PASTOR";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");
  return session;
}

export async function requireRole(roles: ChurchRole[]) {
  const session = await requireUser();
  const role = (session.user as { role?: string }).role;
  if (!role || !roles.includes(role as ChurchRole)) redirect("/today");
  return session;
}
