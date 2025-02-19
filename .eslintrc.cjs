/*global module*/

module.exports = {
    env: {
        browser: true,
        es2021: true
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended-type-checked",
        "plugin:@typescript-eslint/stylistic-type-checked"
    ],
    overrides: [
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: true
    },
    plugins: [
        "@typescript-eslint"
    ],
    ignorePatterns: ["dist/*", "test/dist/*"],
    rules: {
        "indent": "error",
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": "error",
        "semi": "error",
        "prefer-object-spread": "error",
        "no-trailing-spaces": "error",
        "object-shorthand": "error",
        "space-in-parens": "error",
    }
};
