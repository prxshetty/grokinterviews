import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_" 
      }],
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "warn",
      "import/no-anonymous-default-export": "off",
      "react-hooks/exhaustive-deps": "error"
    }
  }
];

export default eslintConfig;
