import { useState } from "react";
import api from "../../api/axios";
export default function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.trim();
    const password = formData.get("password");
    if (!email) return setError("Email address is required.");
    if (!password) return setError("Password is required.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login error:", err.response?.status);
      const data = err.response?.data;
      const backendMessage =
        data?.message ||
        data?.error?.message ||
        data?.error ||
        data?.errors?.[0]?.message ||
        data?.errors?.[0] ||
        data?.msg;

      if (backendMessage) {
        setError(String(backendMessage));
        return;
      }
      if (err.response?.status === 400 || err.response?.status === 401) {
        const responseText = JSON.stringify(data || {}).toLowerCase();
        if (responseText.includes("invalid") || responseText.includes("credential")) {
          return setError("Invalid email or password.");
        }
        if (responseText.includes("google")) {
          return setError("Please login with Google.");
        }
        return setError("Unable to sign in. Please check your credentials.");
      }
      if (err.response) {
        if (err.response.status >= 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(`Unable to sign in. Server responded with status ${err.response.status}.`);
        }
        return;
      }
      if (err.request) {
        return setError("Unable to connect to the server. Please check your internet connection and try again.");
      }
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  function handleGoogleLogin() {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  }
  function handleForgotPassword() {
    window.location.href = "/forgot-password";
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold mb-2">Email Address</label>
          <input id="email" name="email" type="email" placeholder="you@example.com" required disabled={loading} className="w-full bg-[#f7f3eb] border border-[#e6e2db] rounded-lg px-4 py-3 text-base text-[#1c1c17] outline-none focus:ring-1 focus:ring-[#0040df] focus:border-[#0040df] disabled:opacity-60 transition" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="block text-sm font-semibold">Password</label>
            <button type="button" onClick={handleForgotPassword} disabled={loading} className="text-sm text-[#5f5e5d] hover:text-[#0040df] disabled:opacity-60">Forgot?</button>
          </div>
          <input id="password" name="password" type="password" placeholder="••••••••" required disabled={loading} className="w-full bg-[#f7f3eb] border border-[#e6e2db] rounded-lg px-4 py-3 text-base text-[#1c1c17] outline-none focus:ring-1 focus:ring-[#0040df] focus:border-[#0040df] disabled:opacity-60 transition" />
        </div>
      </div>
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <button type="submit" disabled={loading} className="w-full bg-[#0040df] text-white font-medium py-3 rounded-lg hover:bg-[#0035bd] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2">
        {loading ? "Signing in..." : "Continue to Notes App"}
      </button>
      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-[#e6e2db]" />
        <span className="px-4 text-sm text-[#5f5e5d]">OR</span>
        <div className="flex-1 border-t border-[#e6e2db]" />
      </div>
      <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white border border-[#e6e2db] text-[#1c1c17] py-3 rounded-lg hover:bg-[#f7f3eb] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        Sign in with Google
      </button>
    </form>
  );
}