import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { X, Loader2, ScanLine } from "lucide-react";

/**
 * Camera QR scanner used to read an AURA voter ticket.
 *
 * Keeps scanning until `onScan(rawValue)` returns anything other than a
 * string — return `true` to accept (camera stops), or an error message to
 * show feedback under the viewfinder and keep scanning (e.g. the person
 * pointed at the wrong QR).
 */
export default function QrScanner({ onScan, onClose, title = "Scan your ticket QR" }) {
  const videoRef = useRef(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    let stream = null;
    let rafId = null;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const stop = () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
    };

    const tick = () => {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(frame.data, frame.width, frame.height, {
          inversionAttempts: "dontInvert",
        });
        if (code && code.data) {
          const result = onScanRef.current(code.data);
          if (result === true) {
            stop();
            return;
          }
          if (typeof result === "string") {
            setNote(result);
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error("unsupported"), { name: "Unsupported" });
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
        });
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStarting(false);
        rafId = requestAnimationFrame(tick);
      } catch (err) {
        setStarting(false);
        setError(
          err?.name === "NotAllowedError"
            ? "Camera permission denied — allow camera access, or type your Voter ID instead."
            : "Couldn't start the camera on this device — type your Voter ID instead."
        );
      }
    })();

    return stop;
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-neutral-950 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h4 className="font-bold flex items-center gap-2">
            <ScanLine size={18} /> {title}
          </h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="p-1.5 rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-white/40 transition"
          >
            <X size={16} />
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 text-sm p-4">
            {error}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 block w-full bg-white/10 border border-white/20 text-white font-semibold py-2 rounded-lg"
            >
              Type Voter ID instead
            </button>
          </div>
        ) : (
          <>
            <div className="relative rounded-xl overflow-hidden border border-white/15 bg-black aspect-[4/3]">
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Target frame */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-44 h-44 border-2 border-amber-400/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
              {starting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-sm text-white/80">
                  <Loader2 className="animate-spin" size={22} /> Starting camera…
                </div>
              )}
            </div>
            <p className="text-xs text-white/50 text-center mt-3">
              Point at the QR on your voting ticket
            </p>
            {note && (
              <p className="text-xs text-amber-300 text-center mt-1">{note}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
