import { useState } from "react";
import api from "../../api/axios";
export default function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username")?.trim();
    const email = formData.get("email")?.trim();
    const password = formData.get("password");
    if (!username) return setError("Username is required.");
    if (username.length < 3) return setError("Username must be at least 3 characters.");
    if (!email) return setError("Email address is required.");
    if (!password) return setError("Password is required.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const response = await api.post("/auth/register", { username, email, password });
      console.log("Registered:", response.data);
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Registration error:", err);
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
      if (err.response?.status === 400 || err.response?.status === 409) {
        const responseText = JSON.stringify(data || {}).toLowerCase();
        if (responseText.includes("email")) return setError("Email already exists.");
        if (responseText.includes("username")) return setError("Username already exists.");   
        setError("Invalid registration details. Please check your information.");
        return;
      }
      if (err.response) {
        if (err.response.status >= 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(`Unable to create your account. Server responded with status ${err.response.status}.`);
        }
        return;
      }
      if (err.request) {
        setError("Unable to connect to the server. Please check your internet connection and try again.");
        return;
      }
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  function handleGoogleSignup() {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-semibold mb-2">Username</label>
          <input id="username" name="username" type="text" placeholder="your username" required disabled={loading} className="w-full bg-[#f7f3eb] border border-[#e6e2db] rounded-lg px-4 py-3 text-base text-[#1c1c17] outline-none focus:ring-1 focus:ring-[#0040df] focus:border-[#0040df] disabled:opacity-60 transition" />
        </div>
        <div>
          <label htmlFor="signup-email" className="block text-sm font-semibold mb-2">Email Address</label>
          <input id="signup-email" name="email" type="email" placeholder="you@example.com" required disabled={loading} className="w-full bg-[#f7f3eb] border border-[#e6e2db] rounded-lg px-4 py-3 text-base text-[#1c1c17] outline-none focus:ring-1 focus:ring-[#0040df] focus:border-[#0040df] disabled:opacity-60 transition" />
        </div>
        <div>
          <label htmlFor="signup-password" className="block text-sm font-semibold mb-2">Password</label>
          <input id="signup-password" name="password" type="password" placeholder="••••••••" required minLength={6} disabled={loading} className="w-full bg-[#f7f3eb] border border-[#e6e2db] rounded-lg px-4 py-3 text-base text-[#1c1c17] outline-none focus:ring-1 focus:ring-[#0040df] focus:border-[#0040df] disabled:opacity-60 transition" />
          <p className="mt-2 text-xs text-[#5f5e5d]">Password must be at least 6 characters.</p>
        </div>
      </div>
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <button type="submit" disabled={loading} className="w-full bg-[#0040df] text-white font-medium py-3 rounded-lg hover:bg-[#0035bd] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2">
        {loading ? "Creating account..." : "Create Account"}
      </button>
      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-[#e6e2db]" />
        <span className="px-4 text-sm text-[#5f5e5d]">OR</span>
        <div className="flex-1 border-t border-[#e6e2db]" />
      </div>
      <button type="button" onClick={handleGoogleSignup} disabled={loading} className="w-full bg-white border border-[#e6e2db] text-[#1c1c17] py-3 rounded-lg hover:bg-[#f7f3eb] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        Continue with Google
      </button>
    </form>
  );
}