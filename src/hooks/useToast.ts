import { useToastContext } from '../context/ToastContext';

export function useToast() {
  const { addToast } = useToastContext();
  return {
    success: (msg: string) => addToast(msg, 'success'),
    error:   (msg: string) => addToast(msg, 'error'),
    info:    (msg: string) => addToast(msg, 'info'),
    warning: (msg: string) => addToast(msg, 'warning'),
  };
}
