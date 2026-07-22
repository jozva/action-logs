import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const policySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 400 },
    enabled: { type: Boolean, required: true, default: true },
    updatedBy: { type: String, trim: true, lowercase: true, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'policies',
    toJSON: {
      transform(_doc, ret) {
        const { _id, ...rest } = ret;
        return { id: String(_id), ...rest };
      },
    },
  },
);

export type PolicySchema = InferSchemaType<typeof policySchema>;
export type PolicyDocument = HydratedDocument<PolicySchema>;

export const PolicyModel = model('Policy', policySchema);
