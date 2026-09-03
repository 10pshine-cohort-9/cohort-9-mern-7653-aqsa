import { useState } from "react";
import SignInForm from "../components/Auth/SignInForm";
import SignUpForm from "../components/Auth/SignUpForm";
export default function Auth() {
  const [mode, setMode] = useState("signin");
  return (
    <main className="font-raleway min-h-screen bg-[#fdf9f1] flex items-center justify-center p-4 sm:p-6 md:p-10 antialiased text-[#1c1c17]">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-[#e6e2db] shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]"> 
        <div className="lg:col-span-6 xl:col-span-5 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-1 tracking-tight">
                Notes App
              </h1>
              <p className="text-sm text-[#5f5e5d]">
                A workspace for thinkers.
              </p>
            </div>
            <div className="flex mb-8 border-b border-[#e6e2db]">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                  mode === "signin"
                    ? "text-[#0040df] border-b-2 border-[#0040df]"
                    : "text-[#5f5e5d] hover:text-[#1c1c17]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                  mode === "signup"
                    ? "text-[#0040df] border-b-2 border-[#0040df]"
                    : "text-[#5f5e5d] hover:text-[#1c1c17]"
                }`}
              >
                Create Account
              </button>
            </div>
            {mode === "signin" ? <SignInForm /> : <SignUpForm />}
          </div>
          <div className="mt-8 pt-4 text-center border-t border-[#f1ede6]">
            <p className="text-xs text-[#5f5e5d]">
              By continuing, you agree to our{" "}
              <a
                href="#"
                className="text-[#1c1c17] underline underline-offset-4 hover:text-[#0040df]"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-[#1c1c17] underline underline-offset-4 hover:text-[#0040df]"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 p-3">
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#1c1c17] via-[#2a2923] to-[#0040df] p-10 flex flex-col justify-between text-white relative overflow-hidden shadow-inner">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#0040df]/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#fdf9f1]/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex justify-between items-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#e6e2db]/70">
                Workspace v2.0
              </span>
            </div>
            <div className="relative z-10 max-w-md">
              <h2 className="text-3xl font-bold leading-tight mb-3 text-[#fdf9f1]">
                Finally, all your thoughts in one place.
              </h2>
              <p className="text-sm text-[#e6e2db]/80 leading-relaxed">
                Organize ideas, take structured canvas notes, and collaborate effortlessly across workspace boards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}