"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setAuth = useAppStore((s) => s.setAuth);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      setAuth(data.user, data.token, data.workspaces);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#0d1117] via-[#0b1220] to-[#05070d] text-gray-100 px-4 relative overflow-hidden font-[Inter]">
      {/* Background Glows */}
      <div className="absolute w-[600px] h-[600px] bg-blue-600/15 blur-[120px] rounded-full -top-48 -left-48 animate-pulse duration-[10s]" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-600/15 blur-[120px] rounded-full -bottom-48 -right-48 animate-pulse duration-[8s] delay-1000" />

      <div className="w-full max-w-md z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-xl mb-6 relative group overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <ShieldCheck className="w-10 h-10 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-gray-400 font-light text-lg">
            Sign in to access your API Forge workspace
          </p>
        </div>

        {/* Card */}
        <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group">
          {/* Subtle Border Gradient Accent */}
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-blue-500/20 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <div className="text-sm text-red-200 bg-red-500/20 border border-red-500/30 p-4 rounded-2xl animate-fade-in flex items-center gap-3 backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Email */}
              <div className="group/field">
                <label className="text-xs font-semibold text-gray-400 mb-2 block tracking-widest uppercase ml-1 opacity-70 group-focus-within/field:opacity-100 transition-opacity">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within/field:text-blue-400 transition-all" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[#0d1117]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-light text-[15px] placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="group/field">
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="text-xs font-semibold text-gray-400 tracking-widest uppercase opacity-70 group-focus-within/field:opacity-100 transition-opacity">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within/field:text-blue-400 transition-all" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0d1117]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-light text-[15px] placeholder:text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all font-bold text-[16px] text-white flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-[15px] text-gray-400 font-light">
              Don’t have an account?{" "}
              <Link
                href="/signup"
                className="text-white hover:text-blue-400 font-semibold underline underline-offset-4 decoration-blue-500/30 hover:decoration-blue-500 transition-all ml-1"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Global Footer Text */}
        <div className="mt-12 flex items-center justify-center gap-6 text-[11px] text-gray-500 tracking-[0.2em] font-semibold uppercase opacity-60">
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-500" />
            Secure Connection
          </span>
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-indigo-500" />
            E2E Encrypted
          </span>
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-400" />
            API Forge ID
          </span>
        </div>
      </div>
    </div>
  );
}
