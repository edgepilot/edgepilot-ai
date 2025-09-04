// Pure flat config for ESLint 9 + Next.js 15
import nextPlugin from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const config = [
  // ⛔ Ignore paths (flat configs don't use .eslintignore)
  {
    ignores: ["node_modules", ".next", "dist", "out", ".turbo", "coverage", "*.config.js", "*.config.mjs"],
  },

  // ✅ Base configuration for TypeScript + React
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: "readonly",
        JSX: "readonly",
        NodeJS: "readonly",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      "jsx-a11y": jsxA11y,
      "@typescript-eslint": tseslint,
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // Next.js core-web-vitals equivalent
      ...nextPlugin.configs["core-web-vitals"].rules,

      // TypeScript recommended rules
      ...tseslint.configs["recommended"].rules,

      // React plugin rules
      ...reactPlugin.configs["recommended"].rules,
      
      // React hooks rules
      ...reactHooksPlugin.configs["recommended"].rules,

      // JSX a11y recommended rules
      ...jsxA11y.configs.recommended.rules,

      // ✅ Project-specific overrides and additions
      
      // Accessibility
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      
      // React 18+ best practices
      "react/jsx-no-leaked-render": ["warn", { validStrategies: ["coerce", "ternary"] }],
      "react/react-in-jsx-scope": "off", // Not needed in React 18+
      
      // TypeScript specific
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      
      // Import hygiene
      "no-restricted-imports": ["warn", {
        patterns: [
          {
            group: ["@tanstack/react-query/*"],
            message: "Import from '@tanstack/react-query' instead for optimized bundling"
          },
          {
            group: ["zustand/*"],
            message: "Import from 'zustand' instead for optimized bundling"
          }
        ]
      }],
      
      // Code quality
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-debugger": "error",
      
      // Next.js specific
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "error",
    },
  },
];

export default config;