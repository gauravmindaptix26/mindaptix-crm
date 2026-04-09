import type { SchemaOptions } from "mongoose";

export const baseSchemaOptions = {
  timestamps: true,
  versionKey: false,
  minimize: false,
} satisfies SchemaOptions;
