import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // ⛔ Ignore build output and dependencies
  {
    ignores: ["node_modules", ".next", "dist", "out", ".turbo", "coverage"]
  },

  // ✅ Legacy configs via FlatCompat
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "plugin:jsx-a11y/recommended"
  ),

  // ✅ Project-specific rules and language options
  {
    rules: {
      // Accessibility
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      
      // React 18+ best practices
      "react/jsx-no-leaked-render": ["warn", { validStrategies: ["coerce", "ternary"] }],
      
      // TypeScript
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_" 
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Import hygiene (optional: enforce optimized imports)
      "no-restricted-imports": ["warn", {
        patterns: [
          {
            group: ["@tanstack/react-query/*"],
            message: "Import from '@tanstack/react-query' instead for optimized bundling"
          }
        ]
      }],
      
      // Code quality
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      
      // Next.js specific
      "@next/next/no-html-link-for-pages": "error",
    },
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
];

export default eslintConfig;