"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);

    const generated = Array.from({ length: 20 }).map(() => ({
      size: Math.random() * 5 + 3,
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: Math.random() * 10 + 10,
    }));

    setParticles(generated);
  }, []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      router.push("/mfa");
    }
  }

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-screen flex items-center justify-center text-white overflow-hidden px-4"
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/dashboard-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-black/40 to-black/80 animate-gradient" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_60%)]" />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute bg-white/10 rounded-full animate-float"
            style={{
              width: p.size,
              height: p.size,
              top: `${p.top}%`,
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <motion.form
        onSubmit={handleLogin}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="
          relative z-10
          w-full max-w-md
          backdrop-blur-xl bg-white/10
          border border-purple-500/30
          rounded-3xl
          p-6 sm:p-10
          shadow-[0_0_50px_rgba(168,85,247,0.5)]
          hover:shadow-[0_0_70px_rgba(168,85,247,0.8)]
          transition-all duration-500
          shimmer
        "
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8">
          Royal Login 👑
        </h1>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          className="w-full p-3 rounded-xl bg-zinc-800/80 mb-4 outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full p-3 rounded-xl bg-zinc-800/80 outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-zinc-400 hover:text-white text-sm"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="
            w-full bg-purple-600 hover:bg-purple-700
            transition-colors p-3 rounded-xl font-semibold
            active:scale-95
          "
        >
          {loading ? "Signing in..." : "Enter the Kingdom"}
        </button>
      </motion.form>
    </motion.div>
  );
}