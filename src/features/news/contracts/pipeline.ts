import { z } from "zod";

export const BloombergFormat = z.enum([
  "PBN",
  "BFW",
  "BN",
  "APW",
  "UNKNOWN",
]);
export type BloombergFormat = z.infer<typeof BloombergFormat>;

export const TriggerType = z.enum([
  "cron_morning",
  "cron_afternoon",
  "manual_upload",
  "manual_admin",
]);
export type TriggerType = z.infer<typeof TriggerType>;

export const UploadPdfRequest = z.object({
  files: z.array(z.object({
    name: z.string().min(1).max(255),
    size: z.number().int().min(1).max(10 * 1024 * 1024),
    contentType: z.literal("application/pdf"),
  })).min(1).max(10),
});
export type UploadPdfRequest = z.infer<typeof UploadPdfRequest>;

export const UploadedPdf = z.object({
  id: z.string().uuid(),
  blob_url: z.string().url(),
  filename: z.string(),
  format_detected: BloombergFormat,
  size_bytes: z.number().int().min(1),
  uploaded_at: z.string().datetime(),
  auto_translated: z.boolean().default(false),
});
export type UploadedPdf = z.infer<typeof UploadedPdf>;

export const UploadPdfResponse = z.object({
  uploaded: z.array(UploadedPdf),
});
export type UploadPdfResponse = z.infer<typeof UploadPdfResponse>;

export const PdfExtractionResult = z.object({
  pdf_id: z.string().uuid(),
  format: BloombergFormat,
  text_normalized: z.string(),
  text_length: z.number().int().min(0),
  used_gemini_fallback: z.boolean(),
  auto_translated: z.boolean(),
  table_data_blocks: z.array(z.string()).default([]),
  filtered_sections: z.array(z.string()).default([]),
});
export type PdfExtractionResult = z.infer<typeof PdfExtractionResult>;

export const GenerationJob = z.object({
  trigger_type: TriggerType,
  pdf_ids: z.array(z.string().uuid()).optional(),
  triggered_by: z.string().email().optional(),
});
export type GenerationJob = z.infer<typeof GenerationJob>;

export const PipelineRunStatus = z.enum(["running", "success", "failed"]);
export type PipelineRunStatus = z.infer<typeof PipelineRunStatus>;

export const PipelineRun = z.object({
  id: z.string().uuid(),
  triggered_at: z.string().datetime(),
  trigger_type: TriggerType,
  pdf_ids_used: z.array(z.string().uuid()).default([]),
  perplexity_queries: z.array(z.string()),
  openai_total_tokens: z.number().int().min(0),
  openai_cost_brl: z.number().min(0),
  briefings_generated: z.number().int().min(0),
  briefings_blocked: z.number().int().min(0),
  themes_discarded_no_public_source: z.number().int().min(0).default(0),
  bloomberg_citation_attempts: z.number().int().min(0).default(0),
  status: PipelineRunStatus,
  error_message: z.string().nullable().default(null),
  duration_ms: z.number().int().min(0),
});
export type PipelineRun = z.infer<typeof PipelineRun>;

export const GenerationResult = z.object({
  run_id: z.string().uuid(),
  status: PipelineRunStatus,
  briefings_pending_review: z.number().int().min(0),
  briefings_blocked: z.number().int().min(0),
  themes_discarded: z.number().int().min(0),
  duration_ms: z.number().int().min(0),
});
export type GenerationResult = z.infer<typeof GenerationResult>;
