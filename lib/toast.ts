import { toast } from "sonner";
import { AxiosError } from "axios";

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    const msg = data?.message || error.message || "Terjadi kesalahan";
    const traceId = data?.traceId || error.response?.headers?.["x-request-id"];
    if (traceId) {
      return `${msg} [Trace ID: ${traceId}]`;
    }
    return msg;
  }
  
  if (error instanceof Error) {
    const traceId = (error as any).traceId;
    if (traceId) {
      return `${error.message} [Trace ID: ${traceId}]`;
    }
    return error.message;
  }
  
  return "Terjadi kesalahan yang tidak diketahui";
}

export function showErrorToast(error: unknown, fallbackMessage?: string) {
  const message = getErrorMessage(error);
  toast.error(fallbackMessage || message);
}

export function showSuccessToast(message: string) {
  toast.success(message);
}

export function showLoadingToast(message: string) {
  return toast.loading(message);
}

export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}
