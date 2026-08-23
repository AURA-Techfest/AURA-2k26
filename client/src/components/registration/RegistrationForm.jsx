import React, { useState } from "react";

function RegistrationForm({ onClose }) {
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState(["", "", "", ""]);
  const [college, setCollege] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentFile, setPaymentFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleMemberChange = (index, value) => {
    const updated = [...members];
    updated[index] = value;
    setMembers(updated);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!paymentFile) {
      setError("Please upload your payment screenshot");
      return;
    }
    if (members.some((m) => !m.trim())) {
      setError("Please fill in all 4 team member names");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("teamName", teamName);
      formData.append("teamMembers", JSON.stringify(members));
      formData.append("college", college);
      formData.append("phone", phone);
      formData.append("email", email);
      formData.append("paymentScreenshot", paymentFile);

      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        body: formData, // no Content-Type header — browser sets multipart boundary automatically
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-cyber-dark border-2 border-rose-400 rounded-lg shadow-2xl w-full max-w-md p-6 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-cyber-text/70 hover:text-white text-lg font-bold cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        {success ? (
          <div className="text-center space-y-3 py-4">
            <h2 className="font-display font-black text-2xl text-cyber-teal-light tracking-wider uppercase">
              REGISTRATION LOCKED ON
            </h2>
            <p className="font-mono text-[10px] text-cyber-text/80 uppercase leading-relaxed">
              TEAM MOUNTED SECURELY. PAYMENT PROOF RECEIVED.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs uppercase rounded-lg border border-rose-400 cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <h2 className="font-display font-black text-xl text-white tracking-wider uppercase text-center mb-1">
              Team Registration
            </h2>

            <input
              type="text"
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              className="px-4 py-2 rounded bg-white/90 text-black font-mono text-sm outline-none focus:ring-2 focus:ring-rose-400"
            />

            {members.map((member, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Member ${i + 1} Name`}
                value={member}
                onChange={(e) => handleMemberChange(i, e.target.value)}
                required
                className="px-4 py-2 rounded bg-white/90 text-black font-mono text-sm outline-none focus:ring-2 focus:ring-rose-400"
              />
            ))}

            <input
              type="text"
              placeholder="College Name"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              required
              className="px-4 py-2 rounded bg-white/90 text-black font-mono text-sm outline-none focus:ring-2 focus:ring-rose-400"
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="px-4 py-2 rounded bg-white/90 text-black font-mono text-sm outline-none focus:ring-2 focus:ring-rose-400"
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-2 rounded bg-white/90 text-black font-mono text-sm outline-none focus:ring-2 focus:ring-rose-400"
            />

            {/* Payment QR code — replace src with your actual QR image */}
            <div className="flex flex-col items-center gap-1 py-2">
              <p className="font-mono text-[10px] text-cyber-text/80 uppercase">
                Scan to Pay
              </p>
              <img
                src="/payment-qr.png"
                alt="Payment QR Code"
                className="w-32 h-32 object-contain border border-cyber-text/30 rounded"
              />
            </div>

            <label className="font-mono text-[10px] text-cyber-text/80 uppercase">
              Upload Payment Screenshot
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="text-xs text-cyber-text file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-rose-600 file:text-white file:text-xs file:uppercase file:cursor-pointer cursor-pointer"
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-40 object-contain rounded border border-cyber-text/30 mt-1"
              />
            )}

            {error && (
              <p className="text-rose-400 text-xs font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 mt-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display text-sm font-black tracking-widest uppercase rounded-lg border-2 border-rose-400 cursor-pointer transition-all"
            >
              {loading ? "Submitting..." : "Submit Registration"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default RegistrationForm;