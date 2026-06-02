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
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  // Scripts legacy (Node CJS + utilitários de teste). Não rodam no bundle Next
  // e foram escritos antes da migração TS strict. Mantemos as regras como warn
  // para visibilidade, sem quebrar o CI N1 por dívida técnica fora do app.
  {
    files: ["scripts/**/*.{js,cjs,ts}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
