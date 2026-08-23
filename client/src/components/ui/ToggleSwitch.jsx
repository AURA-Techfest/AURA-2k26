import React from "react";
import clsx from "clsx";

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  className,
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center gap-2 font-mono text-[9px] text-cyber-muted cursor-pointer select-none interactive",
        className
      )}
      onClick={() => onChange(!checked)}
    >
      {/* Switch frame housing */}
      <div className="w-10 h-16 bg-cyber-dark border-2 border-cyber-copper rounded shadow-inner flex flex-col items-center justify-between p-1.5 relative">
        <div className="text-[7px] text-center w-full font-bold select-none border-b border-cyber-brown pb-0.5 text-cyber-muted/40">
          ON
        </div>

        {/* Toggle physical track & toggle lever */}
        <div className="w-3.5 h-8 bg-black rounded shadow-inner relative flex items-center justify-center">
          <div
            className={clsx(
              "w-5 h-5 bg-cyber-copper border border-cyber-light-copper rounded flex flex-col justify-center items-center cursor-pointer transition-all duration-200 shadow-md",
              checked
                ? "translate-y-[-6px] bg-cyber-light-copper shadow-[0_0_8px_rgba(209,132,98,0.5)]"
                : "translate-y-[6px]"
            )}
          >
            {/* Screw indent on lever handle */}
            <div className="w-1.5 h-1.5 rounded-full bg-cyber-dark/80 flex items-center justify-center">
              <div className="w-1 h-0.5 bg-cyber-copper/40" />
            </div>
          </div>
        </div>

        <div className="text-[7px] text-center w-full font-bold select-none border-t border-cyber-brown pt-0.5 text-cyber-muted/40">
          OFF
        </div>
      </div>
      {label && <span className="uppercase tracking-wider select-none font-bold text-center mt-1">{label}</span>}
    </div>
  );
}
