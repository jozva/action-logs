import type { ActorRole } from '../constants/logs.js';
import { UserModel } from '../models/User.js';

export interface CreateUserRecord {
  name: string;
  email: string;
  passwordHash: string;
  role: ActorRole;
  region: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: ActorRole;
  region: string;
  status: 'active' | 'disabled';
  lastLoginAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type LeanUser = {
  _id: unknown;
  name: string;
  email: string;
  role: ActorRole;
  region: string;
  status: 'active' | 'disabled';
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  passwordHash?: string;
};

function mapUser(doc: LeanUser): PublicUser {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    region: doc.region,
    status: doc.status,
    lastLoginAt: doc.lastLoginAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function findUserByEmail(email: string, withPassword = false) {
  const query = UserModel.findOne({ email: email.toLowerCase() });
  if (withPassword) {
    query.select('+passwordHash');
  }
  return query.exec();
}

export async function findUserById(id: string, withPassword = false) {
  const query = UserModel.findById(id);
  if (withPassword) {
    query.select('+passwordHash');
  }
  return query.exec();
}

export async function createUser(input: CreateUserRecord): Promise<PublicUser> {
  const created = await UserModel.create(input);
  return mapUser(created.toObject() as unknown as LeanUser);
}

export async function listUsers(): Promise<PublicUser[]> {
  const users = (await UserModel.find()
    .sort({ createdAt: -1 })
    .lean()
    .exec()) as unknown as LeanUser[];

  return users.map(mapUser);
}

export async function updateUser(
  id: string,
  updates: Partial<{
    name: string;
    role: ActorRole;
    region: string;
    status: 'active' | 'disabled';
    passwordHash: string;
    lastLoginAt: Date;
  }>,
): Promise<PublicUser | null> {
  const updated = (await UserModel.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .lean()
    .exec()) as unknown as LeanUser | null;

  return updated ? mapUser(updated) : null;
}

export async function deleteUser(id: string): Promise<PublicUser | null> {
  const deleted = (await UserModel.findByIdAndDelete(id)
    .lean()
    .exec()) as unknown as LeanUser | null;

  return deleted ? mapUser(deleted) : null;
}

export async function countUsers(): Promise<number> {
  return UserModel.countDocuments().exec();
}
