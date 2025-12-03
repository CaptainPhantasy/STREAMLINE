// eslint.config.mjs
import globals from "globals";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  // 1. Global Ignores
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "node_modules/",
      "*.log",
    ],
  },

  // 2. Base JavaScript/ESM configuration
  js.configs.recommended,

  // 3. TypeScript configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs["eslint-recommended"].rules, // Explicitly include rules
      // Custom TypeScript rules or overrides
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // 4. React configuration
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    settings: {
      react: {
        version: "detect", // Automatically detect React version
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // Not needed with React 17+ JSX transform
      "react/prop-types": "off", // Often not needed with TypeScript
    },
  },

  // 5. Next.js specific configuration
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules, // Use the core-web-vitals rules from the plugin
      // Custom Next.js rules or overrides
    },
  },

  // 6. Project specific overrides
  {
    // Any rules you want to apply globally or override from above
    rules: {
      // Example: "semi": ["error", "never"],
    },
  },
];