export interface UploadFileResponse {
  data: {
    key: string;
    url: string;
    name: string;
    size: number;
  } | null;
  error: string | null;
}

export interface UploadThingError extends Error {
  code: string;
  data?: unknown;
} 