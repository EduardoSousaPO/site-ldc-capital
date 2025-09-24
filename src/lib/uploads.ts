export type UploadKind = "image" | "document";

interface UploadResponse {
  success: boolean;
  url: string;
  path: string;
  filename: string;
  size: number;
  type: string;
}

export async function uploadFile(file: File, kind: UploadKind): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", kind);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erro no upload" }));
    throw new Error(error.error || "Erro no upload do arquivo");
  }

  return response.json();
}
