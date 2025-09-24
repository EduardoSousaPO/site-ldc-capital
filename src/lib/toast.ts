import { toast } from "sonner";

type ToastOptions = {
  description?: string;
};

export function notifySuccess(message: string, options?: ToastOptions) {
  toast.success(message, {
    description: options?.description,
  });
}

export function notifyError(message: string, options?: ToastOptions) {
  toast.error(message, {
    description: options?.description,
  });
}

export function notifyInfo(message: string, options?: ToastOptions) {
  toast(message, {
    description: options?.description,
  });
}
