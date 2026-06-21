import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      // Strictest settings for cleanest code. These WILL fail the build on
      // any existing violations — only paste this after cleaning up current
      // `any` usage and unused imports, or expect npm run lint to fail hard.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      // exhaustive-deps stays "warn" even in strict configs — too many
      // legitimate exceptions (intentional one-time effects, stable refs)
      // to safely hard-block on.
      "react-hooks/exhaustive-deps": "warn",

      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "database/supabase-types.ts",
    "scratch/**",
  ]),
]);

export default eslintConfig;