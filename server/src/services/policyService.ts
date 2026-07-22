import { NotFoundError } from '../errors/AppError.js';
import { PolicyModel } from '../models/Policy.js';
import type { AuthenticatedUser } from '../types/auth.js';
import { recordAuditEvent } from './auditService.js';

const DEFAULT_POLICIES = [
  {
    key: 'mfa_required',
    name: 'Require MFA',
    description: 'Require multi-factor authentication for privileged roles',
    enabled: true,
  },
  {
    key: 'export_approval',
    name: 'Export Approval',
    description: 'Require approval before large data exports',
    enabled: true,
  },
  {
    key: 'session_timeout',
    name: 'Session Timeout',
    description: 'Expire idle sessions after 30 minutes',
    enabled: false,
  },
] as const;

function mapPolicy(doc: { _id: unknown } & Record<string, unknown>) {
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export async function ensureDefaultPolicies() {
  for (const policy of DEFAULT_POLICIES) {
    await PolicyModel.updateOne(
      { key: policy.key },
      { $setOnInsert: policy },
      { upsert: true },
    ).exec();
  }
}

export async function listPolicies() {
  await ensureDefaultPolicies();
  const policies = await PolicyModel.find().sort({ name: 1 }).lean().exec();
  return policies.map((policy) =>
    mapPolicy(policy as { _id: unknown } & Record<string, unknown>),
  );
}

export async function updatePolicy(
  actor: AuthenticatedUser,
  policyId: string,
  enabled: boolean,
  meta: { ipAddress: string },
) {
  const updated = await PolicyModel.findByIdAndUpdate(
    policyId,
    { enabled, updatedBy: actor.email },
    { new: true, runValidators: true },
  )
    .lean()
    .exec();

  if (!updated) {
    throw new NotFoundError('Policy not found');
  }

  await recordAuditEvent({
    actor: actor.email,
    role: actor.role,
    action: 'CONFIGURE_POLICY',
    resource: `/api/policies/${policyId}`,
    resourceType: 'POLICY',
    ipAddress: meta.ipAddress,
    region: actor.region,
  });

  return mapPolicy(updated as { _id: unknown } & Record<string, unknown>);
}
