import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  displayNameFor,
  parseCcEmails,
  sendApprovalEmail,
} from "../approval-email";

interface CapturedPayload {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
}

type ResendSendFn = (payload: CapturedPayload) => Promise<{
  data: { id: string } | null;
  error: { message: string } | null;
}>;

function makeMockResend(): {
  resend: { emails: { send: ResendSendFn } };
  captured: CapturedPayload[];
} {
  const captured: CapturedPayload[] = [];
  const send: ResendSendFn = vi.fn(
    async (payload: CapturedPayload) => {
      captured.push(payload);
      return { data: { id: "msg-id-fake" }, error: null };
    },
  );
  return {
    resend: { emails: { send } },
    captured,
  };
}

const baseInput = {
  blogPostId: "post-id-1",
  blogPostSlug: "boj-banco-central-emergente-2026",
  blogPostTitle: "Como o BoJ virou banco central emergente em 2026",
  blogPostSummary: "Resumo executivo do artigo de teste com tom UHNW.",
  blogPostCategoria: "Macro Global",
  rawToken: "abc123def456".repeat(5).slice(0, 64),
  baseUrl: "https://ldccapital.com.br",
  recipientEmail: "marcos.meneghel@ldccapital.com.br",
  ccEmails: [] as string[],
};

describe("approval-email / displayNameFor (F-016)", () => {
  it("mapeia emails do time editorial para nomes legíveis (case-insensitive)", () => {
    expect(displayNameFor("marcos.meneghel@ldccapital.com.br")).toBe(
      "Marcos Farias Meneghel",
    );
    expect(displayNameFor("MARCOS.MENEGHEL@LDCCAPITAL.COM.BR")).toBe(
      "Marcos Farias Meneghel",
    );
    expect(displayNameFor("eduardo.sousa@ldccapital.com.br")).toBe(
      "Eduardo Sousa",
    );
    expect(displayNameFor("luciano.herzog@ldccapital.com.br")).toBe(
      "Luciano Herzog",
    );
  });

  it("fallback retorna o próprio email para destinatários não mapeados", () => {
    expect(displayNameFor("desconhecido@externo.com")).toBe(
      "desconhecido@externo.com",
    );
    expect(displayNameFor("")).toBe("");
  });
});

describe("approval-email / parseCcEmails", () => {
  it("parseCcEmails: parseia CSV válido e retorna array de emails bem-formados", () => {
    const result = parseCcEmails(
      "eduardo.sousa@ldccapital.com.br,luciano.herzog@ldccapital.com.br",
    );
    expect(result).toEqual([
      "eduardo.sousa@ldccapital.com.br",
      "luciano.herzog@ldccapital.com.br",
    ]);
  });

  it("parseCcEmails: ignora entradas inválidas (sem @, vazias, com espaços) e retorna apenas emails válidos", () => {
    const result = parseCcEmails(
      "valido@x.com, sem-arroba.com, ,outro@y.com.br,@só-domínio.com",
    );
    expect(result).toEqual(["valido@x.com", "outro@y.com.br"]);
  });

  it("parseCcEmails: undefined/vazio retorna []", () => {
    expect(parseCcEmails(undefined)).toEqual([]);
    expect(parseCcEmails("")).toEqual([]);
    expect(parseCcEmails(null)).toEqual([]);
  });
});

describe("approval-email / sendApprovalEmail", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_fake");
    vi.stubEnv("EBOOK_FROM_EMAIL", "contato@ldccapital.com.br");
    vi.stubEnv("EBOOK_FROM_NAME", "LDC Capital");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sendApprovalEmail: chama Resend com from EBOOK_*, subject e HTML contendo links + título do artigo", async () => {
    const { resend, captured } = makeMockResend();
    const result = await sendApprovalEmail(baseInput, { resend });
    expect(result.messageId).toBe("msg-id-fake");
    expect(captured).toHaveLength(1);
    const payload = captured[0]!;
    expect(payload.from).toBe(
      "LDC Capital <contato@ldccapital.com.br>",
    );
    expect(payload.to).toEqual(["marcos.meneghel@ldccapital.com.br"]);
    expect(payload.subject).toContain(baseInput.blogPostTitle);
    expect(payload.html).toContain("/api/posts/approve?token=");
    expect(payload.html).toContain("/api/posts/reject?token=");
    expect(payload.html).toContain(baseInput.blogPostTitle);
  });

  it("sendApprovalEmail: ccEmails=[] NÃO inclui campo cc no payload Resend", async () => {
    const { resend, captured } = makeMockResend();
    await sendApprovalEmail(
      { ...baseInput, ccEmails: [] },
      { resend },
    );
    expect(captured[0]?.cc).toBeUndefined();
  });

  it("sendApprovalEmail: ccEmails=[a, b] passa cc=['a','b'] no payload Resend", async () => {
    const { resend, captured } = makeMockResend();
    await sendApprovalEmail(
      {
        ...baseInput,
        ccEmails: [
          "eduardo.sousa@ldccapital.com.br",
          "luciano.herzog@ldccapital.com.br",
        ],
      },
      { resend },
    );
    expect(captured[0]?.cc).toEqual([
      "eduardo.sousa@ldccapital.com.br",
      "luciano.herzog@ldccapital.com.br",
    ]);
  });

  it("sendApprovalEmail: throw quando recipientEmail é inválido (defesa Anti-SPEC §6.3)", async () => {
    const { resend } = makeMockResend();
    await expect(
      sendApprovalEmail(
        { ...baseInput, recipientEmail: "não-é-email" },
        { resend },
      ),
    ).rejects.toThrow();
  });
});
