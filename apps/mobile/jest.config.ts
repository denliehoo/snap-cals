import type { Config } from "jest";

const config: Config = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["./jest.setup.ts"],
  moduleNameMapper: {
    "^@snap-cals/shared$": "<rootDir>/../../packages/shared/src",
  },
  testPathIgnorePatterns: ["/node_modules/", "helpers\\.tsx$"],
};

export default config;
