import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

import {
  ACTOR_ROLES,
  ACTIONS,
  LOG_STATUSES,
  RESOURCE_TYPES,
  SEVERITIES,
} from '../constants/logs.js';

const securityLogSchema = new Schema(
  {
    actor: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    role: { type: String, required: true, enum: ACTOR_ROLES, index: true },
    action: { type: String, required: true, enum: ACTIONS, index: true },
    resource: { type: String, required: true, trim: true, maxlength: 512 },
    resourceType: {
      type: String,
      required: true,
      enum: RESOURCE_TYPES,
      index: true,
    },
    ipAddress: { type: String, required: true, trim: true, maxlength: 64 },
    region: { type: String, required: true, trim: true, maxlength: 64, index: true },
    severity: { type: String, required: true, enum: SEVERITIES, index: true },
    status: { type: String, required: true, enum: LOG_STATUSES, index: true },
    timestamp: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'security_logs',
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const { _id, ...rest } = ret;
        return { id: String(_id), ...rest };
      },
    },
  },
);

securityLogSchema.index({ timestamp: -1, severity: 1 });
securityLogSchema.index({ status: 1, timestamp: -1 });
securityLogSchema.index({ role: 1, timestamp: -1 });
securityLogSchema.index({ action: 1, timestamp: -1 });
securityLogSchema.index({ resourceType: 1, timestamp: -1 });
securityLogSchema.index({ region: 1, timestamp: -1 });
securityLogSchema.index({ createdAt: -1 });

securityLogSchema.index(
  {
    actor: 'text',
    action: 'text',
    resource: 'text',
    ipAddress: 'text',
    region: 'text',
    status: 'text',
  },
  {
    name: 'security_logs_text_search',
    weights: {
      actor: 8,
      action: 6,
      resource: 5,
      ipAddress: 4,
      region: 3,
      status: 2,
    },
  },
);

export type SecurityLogSchema = InferSchemaType<typeof securityLogSchema>;
export type SecurityLogDocument = HydratedDocument<SecurityLogSchema>;

export const SecurityLogModel = model('SecurityLog', securityLogSchema);
