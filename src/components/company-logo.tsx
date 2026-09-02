import React from "react";

interface CompanyLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  iconOnly?: boolean;
}

export function CompanyLogo({
  className = "",
  showText = true,
  size = "md",
  iconOnly = false,
}: CompanyLogoProps) {
  const iconSizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl",
  };

  const subtextSizes = {
    sm: "text-[10px]",
    md: "text-[11px]",
    lg: "text-xs",
    xl: "text-sm",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`relative ${iconSizes[size]} shrink-0 rounded-lg overflow-hidden bg-white/95 p-1 shadow-sm border border-orange-500/20 flex items-center justify-center`}>
        <img
          src="/logo.svg"
          alt="Mahes Bankers Logo"
          className="h-full w-full object-contain"
        />
      </div>

      {!iconOnly && showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={`font-bold tracking-tight text-foreground ${textSizes[size]}`}
          >
            Mahes Bankers
          </span>
          <span className={`text-muted-foreground font-medium ${subtextSizes[size]}`}>
            Employee Portal
          </span>
        </div>
      )}
    </div>
  );
}
