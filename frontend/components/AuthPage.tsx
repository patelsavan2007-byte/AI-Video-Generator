"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Video,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";

type AuthMode = "signin" | "signup";

export function AuthPage({ initialMode = "signin" }: { initialMode?: AuthMode }) {
  const router = useRouter();
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const { isAuthenticated } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const switchMode = () => {
    setMode((prev) => (prev === "signin" ? "signup" : "signin"));
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (mode === "signup") {
        await register({ email, password }); // Note: Our backend schema might not use `name` yet
        router.push("/dashboard");
      } else {
        await login({ email, password });
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Something went wrong. Please try again.");
    }
  };

  const isSubmitting = isLoggingIn || isRegistering;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050508]">
      {/* Animated Background */}
      <div className="absolute inset-0 grid-bg opacity-40" />
      <motion.div
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 blur-[200px] pointer-events-none"
      />

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 shadow-2xl shadow-purple-500/30 mb-4"
          >
            <Video className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            VisionForge <span className="text-purple-400">AI</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1.5 font-medium">
            Cinematic AI Video Studio
          </p>
        </div>

        {/* Glass Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b14]/80 backdrop-blur-2xl shadow-2xl shadow-black/50">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          <div className="p-8">
            {/* Mode Tabs */}
            <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.06] p-1 mb-7">
              {(["signin", "signup"] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); }}
                  className="relative flex-1 py-2.5 text-sm font-semibold transition-colors duration-200 rounded-lg"
                >
                  {mode === m && (
                    <motion.div
                      layoutId="auth-tab"
                      className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/20 rounded-lg"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 ${mode === m ? "text-white" : "text-zinc-500"}`}>
                    {m === "signin" ? "Sign In" : "Sign Up"}
                  </span>
                </button>
              ))}
            </div>

            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5"
                >
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-red-400 text-xs font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                      <input
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full h-12 pl-11 pr-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.06] transition-all duration-200"
                        autoComplete="name"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-12 pl-11 pr-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.06] transition-all duration-200"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Min 6 characters" : "Enter your password"}
                    className="w-full h-12 pl-11 pr-12 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.06] transition-all duration-200"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mt-6"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{mode === "signin" ? "Sign In to Studio" : "Create Account"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-[1px] bg-white/[0.06]" />
              <span className="text-zinc-600 text-xs font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-[1px] bg-white/[0.06]" />
            </div>

            <p className="text-center text-zinc-500 text-xs mt-6">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={switchMode}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-zinc-600 text-[10px] mt-6 font-medium">
          By signing in, you agree to VisionForge AI&apos;s Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
