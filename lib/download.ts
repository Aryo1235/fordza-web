import type { AxiosResponse } from "axios";
import api from "@/lib/api";

function resolveFilename(
  contentDisposition: string | undefined,
  fallbackName: string,
) {
  if (!contentDisposition) return fallbackName;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return fallbackName;
}

export async function downloadFile(
  url: string,
  fallbackName: string,
  params?: Record<string, string | number | undefined>,
) {
  const response: AxiosResponse<Blob> = await api.get(url, {
    params,
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: response.headers["content-type"] || "application/octet-stream",
  });
  const resolvedName = resolveFilename(
    response.headers["content-disposition"],
    fallbackName,
  );

  if (typeof window === "undefined") return;

  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = resolvedName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}
