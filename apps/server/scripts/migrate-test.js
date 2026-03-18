const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const serverDir = path.resolve(__dirname, "..");
const envPath = path.resolve(serverDir, ".env");
const envBackup = envPath + ".bak";

dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL_TEST) {
  console.error("DATABASE_URL_TEST is not set in .env");
  process.exit(1);
}

const testUrl = process.env.DATABASE_URL_TEST;

// Temporarily hide .env so Prisma doesn't override our env vars
fs.renameSync(envPath, envBackup);

try {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    cwd: serverDir,
    env: { ...process.env, DATABASE_URL: testUrl, DIRECT_URL: testUrl },
  });
} finally {
  fs.renameSync(envBackup, envPath);
}
