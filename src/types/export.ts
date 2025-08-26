export interface ExportData {
  [key: string]: string | number | boolean | Date;
}

export interface CustomerExportData {
  "Tên khách hàng": string;
  "Email": string;
  "Địa chỉ": string;
  "Số điện thoại": string;
  "Mã số thuế": string;
  "Trạng thái": string;
  "Ngày tạo": string;
  "Ngày cập nhật": string;
}

export interface VehicleExportData {
  "Biển số xe": string;
  "Tên tài xế": string;
  "Số điện thoại": string;
  "CMND/CCCD": string;
  "Trạng thái": string;
  "Ngày tạo": string;
  "Ngày cập nhật": string;
}

export interface OrderExportData {
  "Mã container": string;
  "Khách hàng": string;
  "Xe lấy rỗng": string;
  "Xe hạ hàng": string;
  "Ngày lấy rỗng": string;
  "Điểm đầu lấy rỗng": string;
  "Điểm cuối lấy rỗng": string;
  "Ngày hạ hàng": string;
  "Điểm đầu hạ hàng": string;
  "Điểm cuối hạ hàng": string;
  "Trạng thái": string;
  "Giá tiền": string;
  "Mô tả": string;
  "Ngày tạo": string;
  "Ngày cập nhật": string;
}

export interface ExportOptions {
  fileName: string;
  sheetName?: string;
  autoFilter?: boolean;
  freezeFirstRow?: boolean;
}

export type ExportErrorCode =
  | "NO_DATA"
  | "INVALID_FILTERS"
  | "DATABASE_ERROR"
  | "EXCEL_ERROR"
  | "UNKNOWN_ERROR";

export interface ExportError {
  code: ExportErrorCode;
  message: string;
  context?: Record<string, unknown>;
}

export interface ExportApiResponse {
  success: boolean;
  error?: ExportErrorCode;
  message?: string;
  context?: Record<string, unknown>;
}

export interface ExportProgress {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  total: number;
  startedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
}
