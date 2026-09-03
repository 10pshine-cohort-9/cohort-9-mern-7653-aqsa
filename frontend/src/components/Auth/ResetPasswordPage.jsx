import { useEffect, useState } from "react";
import api from "../../api/axios";
export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const savedEmail = sessionStorage.getItem("resetEmail");
    if (savedEmail) setEmail(savedEmail);
  }, []);
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await api.post("/auth/reset-password", { email, otp, password });
      setMessage(response.data.message || "Password reset successfully.");
      sessionStorage.removeItem("resetEmail");
      setTimeout(() => { window.location.href = "/auth"; }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  function handleBackToSignIn() {
    window.location.href = "/auth";
  }
  return (
    <main className="font-raleway min-h-screen bg-[#fdf9f1] flex items-center justify-center p-4 sm:p-6 md:p-10 antialiased text-[#1c1c17]">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#e6e2db] shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden p-8 sm:p-10 flex flex-col">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-1 tracking-tight">Notes App</h1>
          <p className="text-sm text-[#5f5e5d]">A workspace for thinkers.</p>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Reset your password</h2>
          <p className="text-sm text-[#5f5e5d] leading-relaxed">
            Enter the verification code sent to your email and choose a new password for your account.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-semibold mb-2">Email Address</label>
            <input id="reset-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="w-full bg-[#f7f3eb] border border-[#e6e2db] rounded-lg px-4 py-3 text-base text-[#1c1c17] outline-none focus:ring-1 focus:ring-[#0040df] focus:border-[#0040df] disabled:opacity-60 transition" />
          </div>
          <div>
            <label htmlFor="reset-otp" className="block text-sm font-semibold mb-2">Verification Code</label>
            <input id="reset-otp" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required disabled={loading} className="w-full bg-[#f7f3eb] border border-[#e6e2db] rounded-lg px-4 py-3 text-base tracking-[0.25em] text-[#1c1c17] outline-none focus:ring-1 focus:ring-[#0040df] focus:border-[#0040df] disabled:opacity-60 transition" />
          </div>
          <div>
            <label htmlFor="reset-password" className="block text-sm font-semibold mb-2">New Password</label>
            <input id="reset-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} className="w-full bg-[#f7f3eb] border border-[#e6e2db] rounded-lg px-4 py-3 text-base text-[#1c1c17] outline-none focus:ring-1 focus:ring-[#0040df] focus:border-[#0040df] disabled:opacity-60 transition" />
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}
          {message && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{message}</div>}
          <button type="submit" disabled={loading} className="w-full bg-[#0040df] text-white font-medium py-3 rounded-lg hover:bg-[#0035bd] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2">
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
        <div className="mt-8 pt-4 text-center border-t border-[#f1ede6]">
          <p className="text-xs text-[#5f5e5d]">
            Remember your password?{" "}
            <button type="button" onClick={handleBackToSignIn} className="text-[#1c1c17] underline underline-offset-4 hover:text-[#0040df]">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}