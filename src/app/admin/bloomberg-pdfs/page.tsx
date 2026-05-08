/**
 * F-016b — Página admin de upload de PDFs Bloomberg.
 *
 * Server Component thin wrapper. Auth para `/admin/*` é coberta pelo middleware
 * (`src/middleware.ts`) que redireciona para `/admin/login` quando ausente; a
 * UI client component reusa AdminLayout (mesma convenção de `/admin/posts`)
 * que faz double-check com `getCurrentUser()`.
 *
 * Toda interação (drag&drop, listagem, debounce 30s, auto-trigger pipeline)
 * vive em PdfUploader (Client Component) — Server Component só monta o shell.
 */

import PdfUploader from "./PdfUploader";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bloomberg PDFs — Admin LDC",
};

export default function BloombergPdfsPage() {
  return <PdfUploader />;
}
