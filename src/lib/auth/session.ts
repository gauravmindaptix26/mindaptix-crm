import { headers } from "next/headers";
import { getActorFromSessionToken } from "@/lib/auth/auth-session";
import type { AppActor } from "@/lib/auth/rbac";
import { AuthenticationError, isUserRole, normalizeActor } from "@/lib/auth/rbac";

export const RBAC_ACTOR_HEADER = "x-rbac-actor";
export const RBAC_USER_ID_HEADER = "x-user-id";
export const RBAC_ROLE_HEADER = "x-user-role";
export const RBAC_PROJECT_IDS_HEADER = "x-project-ids";
export const RBAC_LEAD_IDS_HEADER = "x-lead-ids";
export const RBAC_ACTOR_COOKIE = "mindaptix_rbac_actor";
export const AUTH_SESSION_COOKIE = "mindaptix_session";

export type ActorResolverInput = Headers | Request;
export type ActorResolver = (input?: ActorResolverInput) => Promise<AppActor | null>;

let actorResolver: ActorResolver = defaultActorResolver;

export function configureActorResolver(resolver: ActorResolver) {
  actorResolver = resolver;
}

export async function getRequestActor(input?: ActorResolverInput) {
  return actorResolver(input ?? (await headers()));
}

export async function requireRequestActor(input?: ActorResolverInput) {
  const actor = await getRequestActor(input);

  if (!actor) {
    throw new AuthenticationError();
  }

  return actor;
}

async function defaultActorResolver(input?: ActorResolverInput) {
  const headerBag = input instanceof Request ? input.headers : input;
  const effectiveHeaders = headerBag ?? (await headers());

  const serializedActor = effectiveHeaders.get(RBAC_ACTOR_HEADER) ?? readCookie(effectiveHeaders, RBAC_ACTOR_COOKIE);

  if (serializedActor) {
    try {
      const parsedActor = JSON.parse(serializedActor) as Partial<AppActor>;
      const parsedRole = parsedActor.role;

      if (!parsedRole || !isUserRole(parsedRole)) {
        throw new AuthenticationError("Unable to resolve a valid role from the authenticated actor payload.");
      }

      return normalizeActor({
        userId: parsedActor.userId ?? "",
        role: parsedRole,
        projectIds: parsedActor.projectIds ?? [],
        leadIds: parsedActor.leadIds ?? [],
      });
    } catch {
      throw new AuthenticationError("Unable to parse the authenticated actor payload.");
    }
  }

  const role = effectiveHeaders.get(RBAC_ROLE_HEADER);
  const userId = effectiveHeaders.get(RBAC_USER_ID_HEADER);

  if (role && userId) {
    if (!isUserRole(role)) {
      throw new AuthenticationError(`Unrecognized role "${role}".`);
    }

    return normalizeActor({
      userId,
      role,
      projectIds: splitIds(effectiveHeaders.get(RBAC_PROJECT_IDS_HEADER)),
      leadIds: splitIds(effectiveHeaders.get(RBAC_LEAD_IDS_HEADER)),
    });
  }

  const actorFromSession = await getActorFromSessionToken(readCookie(effectiveHeaders, AUTH_SESSION_COOKIE));

  if (actorFromSession) {
    return actorFromSession;
  }

  return null;
}

function splitIds(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readCookie(headerBag: Headers, cookieName: string) {
  const cookieHeader = headerBag.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(cookieName.length + 1));
}
