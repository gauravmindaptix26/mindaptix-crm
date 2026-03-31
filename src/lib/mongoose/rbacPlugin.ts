import mongoose from "mongoose";
import type { AppActor, ProtectedResource, ResourceAction, ResourceScopeOverrides } from "@/lib/auth/rbac";
import {
  AuthenticationError,
  assertNoRestrictedFieldMutations,
  assertResourceAccess,
  buildProjection,
  buildScopeFilter,
  getHiddenFields,
} from "@/lib/auth/rbac";

type QueryRbacContext = {
  actor: AppActor;
  action?: ResourceAction;
  scopeOverrides?: ResourceScopeOverrides;
};

type DocumentWithRbacContext = mongoose.Document & {
  $locals: {
    rbacContext?: QueryRbacContext;
  };
};

type QueryWithRbacContext = mongoose.Query<unknown, unknown> & {
  getOptions(): mongoose.QueryOptions & {
    rbacContext?: QueryRbacContext;
  };
};

export type RbacPluginOptions = {
  resource: ProtectedResource;
  scopeOverrides?: ResourceScopeOverrides;
  strict?: boolean;
};

const READ_QUERY_HOOKS = ["countDocuments", "find", "findOne"] as const;
const UPDATE_QUERY_HOOKS = ["findOneAndReplace", "findOneAndUpdate", "replaceOne", "updateMany", "updateOne"] as const;
const DELETE_QUERY_HOOKS = ["deleteMany", "deleteOne", "findOneAndDelete"] as const;

export function attachQueryRbacContext<TQuery extends mongoose.Query<unknown, unknown>>(
  query: TQuery,
  actor: AppActor,
  action: ResourceAction = "read",
  scopeOverrides?: ResourceScopeOverrides,
) {
  return query.setOptions({
    rbacContext: {
      actor,
      action,
      scopeOverrides,
    },
  }) as TQuery;
}

export function attachDocumentRbacContext<TDocument extends mongoose.Document>(
  document: TDocument,
  actor: AppActor,
  action?: Exclude<ResourceAction, "read" | "delete">,
) {
  const documentWithContext = document as TDocument & DocumentWithRbacContext;
  documentWithContext.$locals ??= {};
  documentWithContext.$locals.rbacContext = { actor, action };
  return document;
}

export function rbacPlugin(schema: mongoose.Schema, options: RbacPluginOptions) {
  const strict = options.strict ?? true;

  for (const hook of READ_QUERY_HOOKS) {
    schema.pre(hook, function () {
      const context = getQueryContext(this as QueryWithRbacContext, strict, options.resource);

      if (!context) {
        return;
      }

      applyReadAccess(this as QueryWithRbacContext, context, options, hook !== "countDocuments");
    });
  }

  for (const hook of UPDATE_QUERY_HOOKS) {
    schema.pre(hook, function () {
      const context = getQueryContext(this as QueryWithRbacContext, strict, options.resource, "update");

      if (!context) {
        return;
      }

      applyMutationAccess(this as QueryWithRbacContext, context, options, "update");
    });
  }

  for (const hook of DELETE_QUERY_HOOKS) {
    schema.pre(hook, function () {
      const context = getQueryContext(this as QueryWithRbacContext, strict, options.resource, "delete");

      if (!context) {
        return;
      }

      applyMutationAccess(this as QueryWithRbacContext, context, options, "delete");
    });
  }

  schema.pre("save", function () {
    const document = this as DocumentWithRbacContext;
    const context = document.$locals?.rbacContext;

    if (!context) {
      if (strict) {
        throw new AuthenticationError(`RBAC context is required before saving ${options.resource} documents.`);
      }

      return;
    }

    const action = context.action ?? (document.isNew ? "create" : "update");

    if (action === "read") {
      throw new AuthenticationError(`Read-only RBAC context cannot be used to save ${options.resource} documents.`);
    }

    assertResourceAccess(context.actor, options.resource, action);
    assertNoRestrictedFieldMutations(context.actor, options.resource, document.toObject(), action);
  });
}

function getQueryContext(
  query: QueryWithRbacContext,
  strict: boolean,
  resource: ProtectedResource,
  fallbackAction: ResourceAction = "read",
) {
  const context = query.getOptions().rbacContext;

  if (!context) {
    if (strict) {
      throw new AuthenticationError(`RBAC context is required before querying ${resource} documents.`);
    }

    return null;
  }

  return {
    ...context,
    action: context.action ?? fallbackAction,
  };
}

function applyReadAccess(
  query: QueryWithRbacContext,
  context: QueryRbacContext,
  options: RbacPluginOptions,
  applyProjection: boolean,
) {
  assertResourceAccess(context.actor, options.resource, context.action ?? "read");

  const scopeFilter = buildScopeFilter(context.actor, options.resource, {
    ...options.scopeOverrides,
    ...context.scopeOverrides,
  });

  if (scopeFilter) {
    query.where(scopeFilter);
  }

  const projection = buildProjection(getHiddenFields(context.actor, options.resource));

  if (Object.keys(projection).length > 0 && applyProjection) {
    query.select(projection);
  }
}

function applyMutationAccess(
  query: QueryWithRbacContext,
  context: QueryRbacContext,
  options: RbacPluginOptions,
  action: Exclude<ResourceAction, "read">,
) {
  assertResourceAccess(context.actor, options.resource, action);

  const scopeFilter = buildScopeFilter(context.actor, options.resource, {
    ...options.scopeOverrides,
    ...context.scopeOverrides,
  });

  if (scopeFilter) {
    query.where(scopeFilter);
  }

  const update = query.getUpdate();

  if (update) {
    assertNoRestrictedFieldMutations(context.actor, options.resource, update, action);
  }
}
