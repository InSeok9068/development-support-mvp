export interface UiModalArgs {
  show: boolean;
  title: string;
  message: string;
  dutationMs?: number;
  fn?: () => void | Promise<void>;
  cancelFn?: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}
