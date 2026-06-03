// Envelope de resposta consistente para as rotas de F-020:
//   sucesso → { success: true, data }
//   erro    → { success: false, message, errors? }
// (Convenção do Feature Contract; as rotas legadas usam { error } — não mexer.)

import { NextResponse } from "next/server";
import { z } from "zod";

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonError(
  message: string,
  status = 400,
  errors?: Array<{ path: string; message: string }>,
): NextResponse {
  return NextResponse.json(
    errors ? { success: false, message, errors } : { success: false, message },
    { status },
  );
}

/** Converte ZodError em 400 padronizado. */
export function jsonZodError(error: z.ZodError): NextResponse {
  return jsonError(
    "Dados inválidos",
    400,
    error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  );
}

export const UNAUTHORIZED = () => jsonError("Não autorizado", 401);
