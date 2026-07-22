import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

import {
  ACTOR_ROLES,
  ACTIONS,
  LOG_STATUSES,
  RESOURCE_TYPES,
  SEVERITIES,
} from '../constants/logs.js';

const actorSchema = new Schema(
  {
    id: { type: String, required: true, trim: true, maxlength: 128 },
    name: { type: String, required: true, trim: true, maxlength: 128 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    role: { type: String, required: true, enum: ACTOR_ROLES },
  },
  { _id: false },
);

const resourceSchema = new Schema(
  {
    type: { type: String, required: true, enum: RESOURCE_TYPES },
    id: { type: String, required: true, trim: true, maxlength: 128 },
    name: { type: String, required: true, trim: true, maxlength: 256 },
  },
  { _id: false },
);

const securityLogSchema = new Schema(
  {
    actor: { type: actorSchema, required: true },
    action: { type: String, required: true, enum: ACTIONS },
    resource: { type: resourceSchema, required: true },
    severity: { type: String, required: true, enum: SEVERITIES, index: true },
    status: { type: String, required: true, enum: LOG_STATUSES, index: true },
    ip: { type: String, required: true, trim: true, maxlength: 64 },
    region: { type: String, required: true, trim: true, maxlength: 64, index: true },
    userAgent: { type: String, trim: true, maxlength: 512, default: '' },
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
securityLogSchema.index({ 'actor.role': 1, timestamp: -1 });
securityLogSchema.index({ action: 1, timestamp: -1 });
securityLogSchema.index({ 'resource.type': 1, timestamp: -1 });
securityLogSchema.index({ region: 1, timestamp: -1 });
securityLogSchema.index({ createdAt: -1 });

securityLogSchema.index(
  {
    'actor.name': 'text',
    'actor.email': 'text',
    action: 'text',
    'resource.name': 'text',
    'resource.id': 'text',
    ip: 'text',
    region: 'text',
    status: 'text',
  },
  {
    name: 'security_logs_text_search',
    weights: {
      'actor.name': 8,
      'actor.email': 6,
      action: 5,
      'resource.name': 5,
      ip: 4,
      region: 3,
      status: 2,
      'resource.id': 2,
    },
  },
);

export type SecurityLogSchema = InferSchemaType<typeof securityLogSchema>;
export type SecurityLogDocument = HydratedDocument<SecurityLogSchema>;

export const SecurityLogModel = model('SecurityLog', securityLogSchema);
