"use client";

import { cn } from "@/lib/utils";
import { checkPasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from "@/lib/password-utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export const PasswordStrength = ({ password, className }: PasswordStrengthProps) => {
  if (!password) return null;

  const { score, checks } = checkPasswordStrength(password);
  const label = getPasswordStrengthLabel(score);
  const colorName = getPasswordStrengthColor(score);

  const getStrengthInfo = (colorName: string, score: number) => {
    const colorMap = {
      red: { color: "bg-red-500", textColor: "text-red-600" },
      yellow: { color: "bg-yellow-500", textColor: "text-yellow-600" },
      blue: { color: "bg-blue-500", textColor: "text-blue-600" },
      green: { color: "bg-green-500", textColor: "text-green-600" },
    };

    const widthMap = {
      1: "w-1/4",
      2: "w-1/4", 
      3: "w-2/4",
      4: "w-2/4",
      5: "w-3/4",
      6: "w-3/4",
      7: "w-full",
    };

    return {
      ...colorMap[colorName as keyof typeof colorMap],
      width: widthMap[Math.min(score, 7) as keyof typeof widthMap] || "w-1/4",
    };
  };

  const strengthInfo = getStrengthInfo(colorName, score);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Password strength:</span>
        <span className={cn("text-sm font-medium", strengthInfo.textColor)}>
          {label}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            strengthInfo.color,
            strengthInfo.width
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={cn("flex items-center gap-2", checks.length ? "text-green-600" : "text-gray-400")}>
          <span className={cn("w-2 h-2 rounded-full", checks.length ? "bg-green-500" : "bg-gray-300")} />
          At least 8 characters
        </div>
        <div className={cn("flex items-center gap-2", checks.lowercase ? "text-green-600" : "text-gray-400")}>
          <span className={cn("w-2 h-2 rounded-full", checks.lowercase ? "bg-green-500" : "bg-gray-300")} />
          Lowercase letters
        </div>
        <div className={cn("flex items-center gap-2", checks.uppercase ? "text-green-600" : "text-gray-400")}>
          <span className={cn("w-2 h-2 rounded-full", checks.uppercase ? "bg-green-500" : "bg-gray-300")} />
          Uppercase letters
        </div>
        <div className={cn("flex items-center gap-2", checks.number ? "text-green-600" : "text-gray-400")}>
          <span className={cn("w-2 h-2 rounded-full", checks.number ? "bg-green-500" : "bg-gray-300")} />
          Numbers
        </div>
      </div>
    </div>
  );
}; 