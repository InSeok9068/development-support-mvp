export interface UiModalArgs {
  show: boolean;
  title: string;
  message: string;
  dutationMs?: number;
  fn?: () => void;
}
