import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables.
// Called once at startup; safe to call multiple times (idempotent).
export function configureStorage(): void {
  cloudinary.config({
    cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
    api_key: process.env["CLOUDINARY_API_KEY"],
    api_secret: process.env["CLOUDINARY_API_SECRET"],
    secure: true,
  });
}

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Uploads a buffer to Cloudinary under the `avatars/` folder.
 * Returns the secure URL and public_id of the uploaded asset.
 */
export async function uploadAvatar(
  buffer: Buffer,
  userId: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "avatars",
        public_id: `user_${userId}`,
        overwrite: true,
        resource_type: "image",
        format: "webp",
        transformation: [{ width: 256, height: 256, crop: "fill" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Deletes an avatar from Cloudinary by its public_id.
 */
export async function deleteAvatar(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
