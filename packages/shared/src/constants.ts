// Fallback only — the actual value is configured via the admin panel (PlatformSetting)
export const DEFAULT_FREE_DAILY_AI_LIMIT = 3;

// Field length limits
export const FOOD_NAME_MAX_LENGTH = 100;
export const SERVING_SIZE_MAX_LENGTH = 50;
export const WEIGHT_NOTE_MAX_LENGTH = 200;
export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MAX_LENGTH = 128;

// AI Chat limits
export const AI_DESCRIPTION_MAX_LENGTH = 200;
export const AI_CHAT_REPLY_MAX_LENGTH = 300;
export const AI_SOURCE_MAX_LENGTH = 100;

// Voice
export const VOICE_RECORDING_MAX_DURATION_MS = 30_000;

// Image
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB base64 string length limit
