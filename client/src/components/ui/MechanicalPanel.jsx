import React from "react";
import clsx from "clsx";

export default function MechanicalPanel({
  children,
  title,
  screws = true,
  vents = false,
  className,
  titleClassName,
}) {
  return (
    <div className={clsx("panel-bevel-out relative p-5 select-none flex flex-col min-w-0", className)}>
      {/* Screw decoration on corners */}
      {screws && (
        <>
          <div className="absolute top-2 left-2 cyber-screw" />
          <div className="absolute top-2 right-2 cyber-screw" />
          <div className="absolute bottom-2 left-2 cyber-screw" />
          <div className="absolute bottom-2 right-2 cyber-screw" />
        </>
      )}

      {/* Panel header with engraved label */}
      {title && (
        <div className="mb-4 mt-1 flex items-center justify-between border-b border-cyber-brown/40 pb-2">
          <h3
            className={clsx(
              "font-mono text-xs font-bold tracking-wider text-cyber-light-copper select-text",
              titleClassName
            )}
          >
            // {title.toUpperCase()}
          </h3>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 bg-cyber-teal/30 rounded-full" />
            <div className="w-1.5 h-1.5 bg-cyber-teal/50 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {/* Vent decorations if requested */}
      {vents && (
        <div className="cyber-vent w-full h-8 mb-4 flex items-center justify-center">
          <div className="text-[9px] font-mono text-cyber-dark tracking-widest font-bold opacity-30 select-none">
            HEAT EXCHANGER GRATE
          </div>
        </div>
      )}

      {/* Main panel child contents */}
      <div className="relative z-5 flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
