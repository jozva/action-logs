import { v2 as cloudinary } from 'cloudinary';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let configured = false;

export function configureCloudinary(): void {
  if (configured) return;

  if (env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret) {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
      secure: true,
    });
  } else if (env.cloudinaryUrl) {
    process.env.CLOUDINARY_URL = env.cloudinaryUrl;
    cloudinary.config();
  } else {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET.',
    );
  }

  configured = true;
  logger.info('Cloudinary configured', {
    cloudName: cloudinary.config().cloud_name,
  });
}

export function getCloudinary() {
  configureCloudinary();
  return cloudinary;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    env.cloudinaryUrl ||
      (env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret),
  );
}
