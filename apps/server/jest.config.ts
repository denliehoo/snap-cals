import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["<rootDir>/src/__tests__/setup.ts"],
  moduleNameMapper: {
    "^@snap-cals/shared$": "<rootDir>/../../packages/shared/src",
  },
};

export default config;
