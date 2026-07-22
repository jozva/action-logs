import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

import { ACTOR_ROLES } from '../constants/logs.js';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ACTOR_ROLES, default: 'user' },
    region: { type: String, required: true, trim: true, maxlength: 64, default: 'ap-south-1' },
    status: {
      type: String,
      required: true,
      enum: ['active', 'disabled'],
      default: 'active',
      index: true,
    },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'users',
    toJSON: {
      transform(_doc, ret) {
        const { _id, passwordHash: _passwordHash, ...rest } = ret;
        return { id: String(_id), ...rest };
      },
    },
  },
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

export type UserSchema = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserSchema>;

export const UserModel = model('User', userSchema);
