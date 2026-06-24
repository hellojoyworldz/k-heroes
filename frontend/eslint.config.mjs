import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "figma-make/**"]),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "off",
    },
  },
]);

export default eslintConfig;
