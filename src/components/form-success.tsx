import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormSuccessProps {
  message?: string;
  className?: string;
}

export const FormSuccess = ({ message, className }: FormSuccessProps) => {
  if (!message) return null;

  return (
    <div className={cn(
      "flex items-center gap-x-2 rounded-md bg-green-50 p-3 text-sm text-green-600 border border-green-200",
      className
    )}>
      <CheckCircle className="h-4 w-4" />
      <p>{message}</p>
    </div>
  );
}; 