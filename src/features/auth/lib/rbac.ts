export const USER_ROLES = ["SUPER_ADMIN", "MANAGER", "EMPLOYEE", "SALES"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const PROTECTED_RESOURCES = [
  "client",
  "clientContact",
  "payment",
  "salary",
  "project",
  "task",
  "lead",
  "leadDocument",
] as const;

export type ProtectedResource = (typeof PROTECTED_RESOURCES)[number];

export const RESOURCE_ACTIONS = ["read", "create", "update", "delete"] as const;

export type ResourceAction = (typeof RESOURCE_ACTIONS)[number];

export type AppActor = {
  userId: string;
  role: UserRole;
  projectIds: string[];
  leadIds: string[];
};

type RolePermissions = Record<ProtectedResource, readonly ResourceAction[]>;

type FieldMask = Partial<Record<UserRole, readonly string[]>>;

export type ResourceScopeOverrides = Partial<{
  projectMembershipPaths: readonly string[];
  taskAssignmentPaths: readonly string[];
  taskProjectPaths: readonly string[];
  leadOwnershipPaths: readonly string[];
  leadDocumentOwnershipPaths: readonly string[];
  leadDocumentLeadPaths: readonly string[];
}>;

const ALL_ACTIONS = RESOURCE_ACTIONS;

const PROJECT_PRIVATE_FIELDS = [
  "client",
  "clientDetails",
  "clientEmail",
  "clientPhone",
  "clientWhatsapp",
  "clientAddress",
  "clientContact",
  "clientContacts",
  "payments",
  "payment",
  "billing",
  "invoice",
  "salary",
  "salaries",
  "payroll",
] as const;

const TASK_PRIVATE_FIELDS = [
  "client",
  "clientContact",
  "clientContacts",
  "payments",
  "payment",
  "salary",
  "salaries",
] as const;

export const RBAC_POLICY: Record<UserRole, RolePermissions> = {
  SUPER_ADMIN: {
    client: ALL_ACTIONS,
    clientContact: ALL_ACTIONS,
    payment: ALL_ACTIONS,
    salary: ALL_ACTIONS,
    project: ALL_ACTIONS,
    task: ALL_ACTIONS,
    lead: ALL_ACTIONS,
    leadDocument: ALL_ACTIONS,
  },
  MANAGER: {
    client: [],
    clientContact: [],
    payment: [],
    salary: [],
    project: ["read"],
    task: ["read", "create", "update"],
    lead: [],
    leadDocument: [],
  },
  EMPLOYEE: {
    client: [],
    clientContact: [],
    payment: [],
    salary: [],
    project: ["read"],
    task: ["read"],
    lead: [],
    leadDocument: [],
  },
  SALES: {
    client: [],
    clientContact: [],
    payment: [],
    salary: [],
    project: [],
    task: [],
    lead: ["read"],
    leadDocument: ["read"],
  },
};

export const DEFAULT_SCOPE_PATHS: Required<ResourceScopeOverrides> = {
  projectMembershipPaths: ["assigneeIds", "assignedEmployeeIds", "memberIds", "employeeIds"],
  taskAssignmentPaths: ["assigneeId", "assigneeIds", "assignedTo", "employeeId"],
  taskProjectPaths: ["projectId"],
  leadOwnershipPaths: ["salesOwnerId", "ownerId", "assignedTo", "salesRepId"],
  leadDocumentOwnershipPaths: ["uploadedBy", "ownerId"],
  leadDocumentLeadPaths: ["leadId"],
};

export const RESOURCE_FIELD_MASKS: Record<ProtectedResource, FieldMask> = {
  client: {},
  clientContact: {},
  payment: {},
  salary: {},
  project: {
    MANAGER: PROJECT_PRIVATE_FIELDS,
    EMPLOYEE: PROJECT_PRIVATE_FIELDS,
  },
  task: {
    MANAGER: TASK_PRIVATE_FIELDS,
    EMPLOYEE: TASK_PRIVATE_FIELDS,
  },
  lead: {},
  leadDocument: {},
};

export class AuthenticationError extends Error {
  status = 401;

  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  status = 403;

  constructor(message = "You do not have permission to access this resource.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function isProtectedResource(value: string): value is ProtectedResource {
  return PROTECTED_RESOURCES.includes(value as ProtectedResource);
}

export function isResourceAction(value: string): value is ResourceAction {
  return RESOURCE_ACTIONS.includes(value as ResourceAction);
}

export function normalizeActor(
  actor: {
    userId: string;
    role: string;
  } & Partial<AppActor>,
): AppActor {
  if (!actor.userId) {
    throw new AuthenticationError("Authenticated actor is missing a user id.");
  }

  if (!isUserRole(actor.role)) {
    throw new AuthorizationError(`Unsupported role "${String(actor.role)}".`);
  }

  return {
    userId: actor.userId,
    role: actor.role,
    projectIds: uniqueIds(actor.projectIds),
    leadIds: uniqueIds(actor.leadIds),
  };
}

export function getAllowedActions(role: UserRole, resource: ProtectedResource) {
  return RBAC_POLICY[role][resource];
}

export function canAccessResource(
  actor: AppActor,
  resource: ProtectedResource,
  action: ResourceAction = "read",
) {
  return getAllowedActions(actor.role, resource).includes(action);
}

export function assertResourceAccess(
  actor: AppActor,
  resource: ProtectedResource,
  action: ResourceAction = "read",
) {
  if (!canAccessResource(actor, resource, action)) {
    throw new AuthorizationError(`${actor.role} cannot ${action} ${resource} records.`);
  }
}

export function getHiddenFields(actor: AppActor, resource: ProtectedResource) {
  return RESOURCE_FIELD_MASKS[resource][actor.role] ?? [];
}

export function buildProjection(hiddenFields: readonly string[]) {
  return hiddenFields.reduce<Record<string, 0>>((projection, field) => {
    projection[field] = 0;
    return projection;
  }, {});
}

export function sanitizeResourceData<T>(actor: AppActor, resource: ProtectedResource, value: T): T {
  const hiddenFields = getHiddenFields(actor, resource);

  if (!hiddenFields.length) {
    return value;
  }

  return pruneValue(value, hiddenFields);
}

export function assertNoRestrictedFieldMutations(
  actor: AppActor,
  resource: ProtectedResource,
  payload: unknown,
  action: Exclude<ResourceAction, "read"> = "update",
) {
  assertResourceAccess(actor, resource, action);

  const hiddenFields = getHiddenFields(actor, resource);

  if (!hiddenFields.length) {
    return;
  }

  const mutatedPaths = getMutationPaths(payload);
  const blockedPaths = mutatedPaths.filter((path) =>
    hiddenFields.some((field) => path === field || path.startsWith(`${field}.`)),
  );

  if (blockedPaths.length > 0) {
    throw new AuthorizationError(
      `${actor.role} cannot mutate restricted fields on ${resource}: ${blockedPaths.join(", ")}`,
    );
  }
}

export function buildScopeFilter(
  actor: AppActor,
  resource: ProtectedResource,
  scopeOverrides: ResourceScopeOverrides = {},
) {
  assertResourceAccess(actor, resource, "read");

  if (actor.role === "SUPER_ADMIN") {
    return null;
  }

  const scope = { ...DEFAULT_SCOPE_PATHS, ...scopeOverrides };

  if (actor.role === "MANAGER") {
    if (resource === "project") {
      return null;
    }

    if (resource === "task") {
      return buildOrScope([
        ...buildEqualityScope(["assignedByUserId"], actor.userId),
        ...buildEqualityScope(scope.taskAssignmentPaths, actor.userId),
      ]);
    }

    throw new AuthorizationError(`${actor.role} cannot access ${resource} records.`);
  }

  if (actor.role === "EMPLOYEE") {
    if (resource === "project") {
      return buildOrScope([
        ...buildIdInScope("_id", actor.projectIds),
        ...buildEqualityScope(scope.projectMembershipPaths, actor.userId),
      ]);
    }

    if (resource === "task") {
      return buildOrScope([
        ...buildEqualityScope(scope.taskAssignmentPaths, actor.userId),
        ...buildIdsAcrossPaths(scope.taskProjectPaths, actor.projectIds),
      ]);
    }

    throw new AuthorizationError(`${actor.role} cannot access ${resource} records.`);
  }

  if (actor.role === "SALES") {
    if (resource === "lead") {
      return buildOrScope([
        ...buildIdInScope("_id", actor.leadIds),
        ...buildEqualityScope(scope.leadOwnershipPaths, actor.userId),
      ]);
    }

    if (resource === "leadDocument") {
      return buildOrScope([
        ...buildEqualityScope(scope.leadDocumentOwnershipPaths, actor.userId),
        ...buildIdsAcrossPaths(scope.leadDocumentLeadPaths, actor.leadIds),
      ]);
    }

    throw new AuthorizationError(`${actor.role} cannot access ${resource} records.`);
  }

  return null;
}

function uniqueIds(values?: string[]) {
  return Array.from(new Set((values ?? []).filter(Boolean)));
}

function buildIdInScope(path: string, ids: readonly string[]) {
  return buildIdsAcrossPaths([path], ids);
}

function buildIdsAcrossPaths(paths: readonly string[], ids: readonly string[]) {
  if (!ids.length) {
    return [];
  }

  return paths.map((path) => ({
    [path]: { $in: [...ids] },
  }));
}

function buildEqualityScope(paths: readonly string[], value: string) {
  if (!value) {
    return [];
  }

  return paths.map((path) => ({
    [path]: value,
  }));
}

function buildOrScope(conditions: ReadonlyArray<Record<string, unknown>>) {
  if (conditions.length === 0) {
    return { _id: { $in: [] } };
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { $or: conditions };
}

function pruneValue<T>(value: T, hiddenFields: readonly string[]): T {
  if (Array.isArray(value)) {
    return value.map((item) => pruneValue(item, hiddenFields)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const clone: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    const matchingPaths = hiddenFields
      .filter((field) => field === key || field.startsWith(`${key}.`))
      .map((field) => (field === key ? "" : field.slice(key.length + 1)))
      .filter(Boolean);

    if (hiddenFields.includes(key)) {
      continue;
    }

    clone[key] = matchingPaths.length ? pruneValue(nestedValue, matchingPaths) : nestedValue;
  }

  return clone as T;
}

function getMutationPaths(payload: unknown) {
  if (!isPlainObject(payload)) {
    return [];
  }

  const operatorEntries = Object.entries(payload).filter(([key]) => key.startsWith("$"));

  if (operatorEntries.length > 0) {
    return operatorEntries.flatMap(([, value]) => flattenObjectKeys(value));
  }

  return flattenObjectKeys(payload);
}

function flattenObjectKeys(value: unknown, prefix = ""): string[] {
  if (!isPlainObject(value)) {
    return prefix ? [prefix] : [];
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    return prefix ? [prefix] : [];
  }

  return entries.flatMap(([key, nestedValue]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(nestedValue) || !isPlainObject(nestedValue)) {
      return [path];
    }

    return flattenObjectKeys(nestedValue, path);
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
