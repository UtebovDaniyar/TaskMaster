"use client";

import { UploadButton } from "@/lib/utils/uploadthing";
import type { OurFileRouter } from "@/lib/uploadthing";

interface UploadButtonProps {
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: Error) => void;
}

export function ImageUploadButton({ onUploadComplete, onUploadError }: UploadButtonProps) {
  return (
    <UploadButton<OurFileRouter, "imageUploader">
      endpoint="imageUploader"
      onClientUploadComplete={(res) => {
        if (res?.[0]?.ufsUrl) {
          onUploadComplete?.(res[0].ufsUrl);
        }
      }}
      onUploadError={(error: Error) => {
        onUploadError?.(error);
      }}
    />
  );
} 