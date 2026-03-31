import type { AppActor, ProtectedResource, ResourceAction, ResourceScopeOverrides, UserRole } from "@/lib/auth/rbac";
import {
  AuthenticationError,
  AuthorizationError,
  assertResourceAccess,
  buildProjection,
  buildScopeFilter,
  getHiddenFields,
  sanitizeResourceData,
} from "@/lib/auth/rbac";
import { requireRequestActor } from "@/lib/auth/session";

export type AuthorizedRequestContext = {
  actor: AppActor;
  scopeFilter: Record<string, unknown> | null;
  projection: Record<string, 0>;
  hiddenFields: readonly string[];
};

export type AuthorizedRouteConfig = {
  resource: ProtectedResource;
  action?: ResourceAction;
  roles?: readonly UserRole[];
  scopeOverrides?: ResourceScopeOverrides;
};

export async function authorizeRequest(
  input: Request,
  config: AuthorizedRouteConfig,
): Promise<AuthorizedRequestContext> {
  const actor = await requireRequestActor(input);
  assertAllowedRole(actor, config.roles);
  assertResourceAccess(actor, config.resource, config.action ?? "read");

  const hiddenFields = getHiddenFields(actor, config.resource);

  return {
    actor,
    scopeFilter: buildScopeFilter(actor, config.resource, config.scopeOverrides),
    projection: buildProjection(hiddenFields),
    hiddenFields,
  };
}

export function withAuthorizedRoute<TContext = unknown>(
  config: AuthorizedRouteConfig,
  handler: (
    request: Request,
    context: TContext,
    access: AuthorizedRequestContext,
  ) => Promise<Response> | Response,
) {
  return async (request: Request, context: TContext) => {
    try {
      const access = await authorizeRequest(request, config);
      return await handler(request, context, access);
    } catch (error) {
      return createAuthorizationResponse(error);
    }
  };
}

export function createAuthorizationResponse(error: unknown) {
  if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  throw error;
}

export function filterAuthorizedResponse<T>(
  actor: AppActor,
  resource: ProtectedResource,
  payload: T,
) {
  return sanitizeResourceData(actor, resource, payload);
}

function assertAllowedRole(actor: AppActor, roles?: readonly UserRole[]) {
  if (!roles || roles.includes(actor.role)) {
    return;
  }

  throw new AuthorizationError(`${actor.role} is not allowed to access this endpoint.`);
}
