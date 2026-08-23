import React from "react";
import clsx from "clsx";

export default function LedIndicator({
  status = "standby", // active, pending, standby, failure
  color, // override: green, amber, red, teal
  label,
  className,
  size = "md", // sm, md, lg
}) {
  // Map status to colors
  let ledColor = color;
  if (!ledColor) {
    if (status === "active" || status === "ONLINE" || status === "ACTIVE") ledColor = "green";
    else if (status === "pending" || status === "PENDING" || status === "STANDBY") ledColor = "amber";
    else if (status === "failure" || status === "OFFLINE") ledColor = "red";
    else ledColor = "teal";
  }

  const colorStyles = {
    green: {
      off: "bg-emerald-950/80 border-emerald-800",
      on: "bg-emerald-400 border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.8)]",
    },
    amber: {
      off: "bg-amber-950/80 border-amber-800",
      on: "bg-amber-400 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.8)]",
    },
    red: {
      off: "bg-rose-950/80 border-rose-900",
      on: "bg-rose-500 border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.8)]",
    },
    teal: {
      off: "bg-cyan-950/80 border-cyan-900",
      on: "bg-cyan-400 border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]",
    },
  };

  const isActive = status !== "standby" && status !== "STANDBY" && status !== "OFFLINE";

  const sizeClasses = {
    sm: "w-2 h-2 border",
    md: "w-3.5 h-3.5 border-2",
    lg: "w-5 h-5 border-2",
  };

  return (
    <div className={clsx("flex items-center gap-2 font-mono text-[10px]", className)}>
      <div
        className={clsx(
          "rounded-full transition-all duration-300",
          sizeClasses[size],
          isActive ? colorStyles[ledColor]?.on : colorStyles[ledColor]?.off,
          isActive && "animate-pulse"
        )}
      />
      {label && (
        <span className="text-cyber-muted tracking-wider uppercase">{label}</span>
      )}
    </div>
  );
}
