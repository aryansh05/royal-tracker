"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function MFAPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    async function loadFactor() {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error || !data?.totp?.length) {
        setError("No MFA factor enrolled");
        return;
      }

      const factor = data.totp[0];
      setFactorId(factor.id);

      const challenge = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });

      if (challenge.error) {
        setError(challenge.error.message);
        return;
      }

      setChallengeId(challenge.data.id);
    }

    loadFactor();
  }, []);

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!factorId || !challengeId) return;

    setLoading(true);

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/royal-code");
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

      {/* Card */}
      <motion.form
        onSubmit={handleVerify}
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
          Royal Verification 🔐
        </h1>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="6-digit code"
          className="
            w-full p-3 rounded-xl bg-zinc-800/80 mb-4
            outline-none focus:ring-2 focus:ring-purple-500
            transition-all text-center tracking-widest text-lg
          "
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="
            w-full bg-purple-600 hover:bg-purple-700
            transition-colors p-3 rounded-xl font-semibold
            active:scale-95
          "
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </motion.form>
    </motion.div>
  );
}