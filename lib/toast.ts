import { toast } from "sonner";
import { AxiosError } from "axios";

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || "Terjadi kesalahan";
  }
  
  if (error instanceof Error) {
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
