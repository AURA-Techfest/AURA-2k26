import QRCode from "qrcode";

/**
 * Generate a QR code as a data-URL entirely in the browser.
 *
 * The desk hands out QR tickets during the live event, so this must not
 * depend on any third-party service (api.qrserver.com had no SLA and could
 * throttle exactly when the queue is longest).
 */
export const qrDataUrl = (text, size = 200) =>
  QRCode.toDataURL(String(text || ""), {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
