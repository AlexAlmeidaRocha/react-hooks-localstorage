import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  {
    ignores: ["dist"]
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parser: tsParser
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      prettier
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...prettier.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      "require-jsdoc": "off",
      "no-invalid-this": "off",
      "no-console": "error",
      "no-constant-condition": "warn",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-multi-spaces": "warn",
      "react/react-in-jsx-scope": "off",
      "max-len": [
        "warn",
        {
          code: 80,
          ignoreComments: true,
          ignoreUrls: true,
          ignoreStrings: true
        }
      ],
      semi: ["warn", "always"],
      "padding-line-between-statements": [
        "warn",
        {
          blankLine: "always",
          prev: "block-like",
          next: "*"
        },
        {
          blankLine: "always",
          prev: "*",
          next: "block-like"
        },
        {
          blankLine: "always",
          prev: "export",
          next: "export"
        },
        {
          blankLine: "always",
          prev: "*",
          next: "return"
        }
      ],
      "no-trailing-spaces": [
        "warn",
        {
          skipBlankLines: false
        }
      ],
      "no-warning-comments": [
        "warn",
        {
          terms: ["todo"],
          location: "anywhere"
        }
      ],
      "arrow-parens": ["warn", "always"],
      "object-curly-spacing": ["warn", "always"],
      "array-bracket-spacing": ["warn", "never"],
      "capitalized-comments": "off",
      camelcase: [
        "error",
        {
          properties: "always"
        }
      ],
      "func-names": ["warn", "as-needed"],
      "id-length": [
        "warn",
        {
          min: 1,
          max: 35
        }
      ],
      quotes: [
        "warn",
        "double",
        {
          avoidEscape: true
        }
      ],
      "no-var": "warn",
      "prefer-const": [
        "warn",
        {
          destructuring: "all",
          ignoreReadBeforeAssign: true
        }
      ],
      "space-before-function-paren": [
        "warn",
        {
          anonymous: "always",
          named: "never",
          asyncArrow: "always"
        }
      ],
      "no-else-return": "error",
      "prettier/prettier": "warn"
    }
  }
];
