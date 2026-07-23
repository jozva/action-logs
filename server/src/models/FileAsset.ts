import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const fileAssetSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 180 },
    mimeType: { type: String, required: true, trim: true, maxlength: 120 },
    sizeBytes: { type: Number, required: true, min: 0 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerEmail: { type: String, required: true, trim: true, lowercase: true },
    storageKey: { type: String, required: true, trim: true, maxlength: 512 },
    cloudinaryPublicId: { type: String, trim: true, maxlength: 512 },
    cloudinaryUrl: { type: String, trim: true, maxlength: 1024 },
    cloudinaryResourceType: { type: String, trim: true, maxlength: 32 },
    contentBase64: { type: String, select: false },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'file_assets',
    toJSON: {
      transform(_doc, ret) {
        const { _id, contentBase64: _content, ...rest } = ret;
        return { id: String(_id), ...rest };
      },
    },
  },
);

export type FileAssetSchema = InferSchemaType<typeof fileAssetSchema>;
export type FileAssetDocument = HydratedDocument<FileAssetSchema>;

export const FileAssetModel = model('FileAsset', fileAssetSchema);
