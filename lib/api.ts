/**
 * API helpers: authentication wrapper, typed session, response utilities.
 *
 * SECURITY: company_id is ALWAYS sourced from the JWT session — never from
 * request bodies or query params. This file is the single enforcement point.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// ─── Session type ────────────────────────────────────────────────────────────

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  /** null only for superadmin */
  companyId: string | null;
  companySlug: string | null;
  firstName: string | null;
  lastName: string | null;
};

// ─── withAuth wrapper ────────────────────────────────────────────────────────

type AuthHandler<P = Record<string, string>> = (
  req: NextRequest,
  session: SessionUser,
  params: P
) => Promise<NextResponse>;

type RouteContext<P> = { params: Promise<P> };

/**
 * Wraps a route handler with authentication and optional role enforcement.
 *
 * @param handler - The actual route logic
 * @param options.roles - Allowed roles. Defaults to all authenticated users.
 *
 * Usage:
 *   export const GET = withAuth(async (req, session, params) => { ... })
 *   export const POST = withAuth(handler, { roles: ['admin', 'manager'] })
 */
export function withAuth<P = Record<string, string>>(
  handler: AuthHandler<P>,
  options: { roles?: UserRole[] } = {}
) {
  return async (req: NextRequest, context: RouteContext<P>) => {
    const rawSession = await getServerSession(authOptions);

    if (!rawSession?.user) {
      return err("Unauthorized", 401);
    }

    const session = rawSession.user as SessionUser;

    // Role check
    if (options.roles && !options.roles.includes(session.role)) {
      return err("Forbidden", 403);
    }

    // Company users must have a companyId (guards against corrupted tokens)
    if (session.role !== "superadmin" && !session.companyId) {
      return err("Invalid session — missing company context", 401);
    }

    const params = await context.params;
    return handler(req, session, params);
  };
}

// ─── Response helpers ────────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

// ─── Role helpers ────────────────────────────────────────────────────────────

export const SUPERADMIN_ONLY: UserRole[] = ["superadmin"];
export const ADMIN_ONLY: UserRole[] = ["admin"];
export const MANAGERS_UP: UserRole[] = ["superadmin", "admin", "manager"];
export const ALL_STAFF: UserRole[] = ["superadmin", "admin", "manager", "staff"];
export const COMPANY_ADMINS: UserRole[] = ["admin", "manager"];
