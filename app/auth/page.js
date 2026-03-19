"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Mail, Lock, User, Wrench, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20";

function AuthForm() {
  const [tab, setTab]           = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/";

  function resetState() { setError(null); setSuccess(null); }

  async function handleGoogle() {
    setLoading(true); resetState();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${redirect}` },
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); resetState();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else router.push(redirect);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true); resetState();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) { setError(error.message); setLoading(false); }
    else {
      setSuccess("Account created! Check your email to confirm your account, then log in.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-card">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Welcome to</p>
            <p className="text-sm font-black text-slate-900">GarageDekho</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-card mb-4">
          {[
            { key: "login",  label: "Log In"       },
            { key: "signup", label: "Sign Up"       },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setTab(key); resetState(); }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
                tab === key ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-white p-5 shadow-card space-y-3">

          {error   && <p className="rounded-xl bg-red-50   px-3 py-2 text-xs font-semibold text-red-500  ">{error}</p>}
          {success && <p className="rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-600">{success}</p>}

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <form onSubmit={tab === "login" ? handleLogin : handleSignup} className="space-y-3">

            {tab === "signup" && (
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Full name" required
                  className={inputCls + " pl-10"}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address" required
                className={inputCls + " pl-10"}
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPw ? "text" : "password"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 chars)" required minLength={6}
                className={inputCls + " pl-10 pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-card-hover transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
            </button>

          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          {tab === "login"
            ? <>No account? <button onClick={() => setTab("signup")} className="font-bold text-primary">Sign up free</button></>
            : <>Have an account? <button onClick={() => setTab("login")} className="font-bold text-primary">Log in</button></>
          }
        </p>

      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
