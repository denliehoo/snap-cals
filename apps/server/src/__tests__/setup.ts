import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.DATABASE_URL_TEST) {
  throw new Error(
    "DATABASE_URL_TEST is not set. Tests require a separate test database.\n" +
      "Add DATABASE_URL_TEST to apps/server/.env and re-run.",
  );
}

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.JWT_SECRET = "test-jwt-secret";
process.env.ADMIN_JWT_SECRET = "test-admin-jwt-secret";
process.env.API_KEY = "test-api-key";
