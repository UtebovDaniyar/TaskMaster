import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrorProps {
  message?: string;
  className?: string;
}

export const FormError = ({ message, className }: FormErrorProps) => {
  if (!message) return null;

  return (
    <div className={cn(
      "flex items-center gap-x-2 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200",
      className
    )}>
      <AlertCircle className="h-4 w-4" />
      <p>{message}</p>
    </div>
  );
}; 