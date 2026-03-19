import { type ImageData, MAX_IMAGE_SIZE } from "@snap-cals/shared";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];

export function validateImage(image?: ImageData): string | null {
  if (!image) return null;

  if (typeof image.base64 !== "string" || typeof image.mimeType !== "string") {
    return "image must have base64 and mimeType strings";
  }
  if (!ALLOWED_MIME_TYPES.includes(image.mimeType)) {
    return `mimeType must be one of: ${ALLOWED_MIME_TYPES.join(", ")}`;
  }
  if (image.base64.length > MAX_IMAGE_SIZE) {
    return "Image is too large";
  }
  return null;
}
