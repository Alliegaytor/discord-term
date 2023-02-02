import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    moduleFileExtensions: [
        "ts",
        "tsx",
        "js",
        "jsx",
        "json",
        "node"
    ],
    roots: ["<rootDir>/dist"],
    testMatch: [
        "**/__tests__/**/*.js",
        "**/?(*.)(spec|test).js"
    ],

};

export default jestConfig;
