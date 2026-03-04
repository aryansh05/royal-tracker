"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [particles, setParticles] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    async function init() {
      setIsMobile(window.innerWidth < 768);

      /* ---------------- SESSION CHECK ---------------- */

      const { data } = await supabase.auth.getSession();

      if (data.session) {
        const savedMode = localStorage.getItem("royal_mode") || "monarch";
        router.replace(`/dashboard?mode=${savedMode}`);
        return;
      }

      /* ---------------- PARTICLES ---------------- */

      const generated = Array.from({ length: 25 }).map(() => ({
        size: Math.random() * 6 + 4,
        top: Math.random() * 100,
        left: Math.random() * 100,
        duration: Math.random() * 10 + 10,
      }));

      setParticles(generated);
    }

    init();
  }, [router]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isMobile) return;

    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = ((y / rect.height) - 0.5) * 10;
    const rotateY = ((x / rect.width) - 0.5) * -10;

    el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  function resetTilt(e: React.MouseEvent<HTMLDivElement>) {
    if (isMobile) return;
    e.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  function handleMonarch() {
    localStorage.setItem("royal_mode", "monarch");
    router.push("/login");
  }

  function handleSlave() {
    localStorage.setItem("royal_mode", "slave");
    router.push("/dashboard?mode=slave");
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white flex flex-col items-center justify-center px-6">

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/dashboard-bg.jpg')" }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-black/40 to-black/80 animate-gradient" />

      {/* Spotlight */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_60%)]" />

      {/* Floating Particles */}
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

      {/* Content */}
      <div className="relative z-10 text-center animate-fade w-full max-w-md">

        <div className="mb-6 text-5xl sm:text-6xl animate-crown">👑</div>

        <h1 className="text-3xl sm:text-5xl font-bold mb-12 sm:mb-16 tracking-wide">
          Royal Tracker
        </h1>

        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 justify-center">

          {/* Monarch */}
          <div
            onClick={handleMonarch}
            onMouseMove={handleMouseMove}
            onMouseLeave={resetTilt}
            className="w-full sm:w-72 h-40 sm:h-72 
                       backdrop-blur-xl bg-white/10 
                       border border-purple-500/30 
                       rounded-3xl flex flex-col 
                       items-center justify-center 
                       cursor-pointer transition-all duration-500 
                       active:scale-95
                       shadow-[0_0_40px_rgba(168,85,247,0.5)] 
                       hover:shadow-[0_0_60px_rgba(168,85,247,0.8)]"
          >
            <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">
              Monarch
            </h2>
            <p className="text-zinc-300 text-sm text-center px-6">
              Secure multi-layer authentication access.
            </p>
          </div>

          {/* Slave */}
          <div
            onClick={handleSlave}
            onMouseMove={handleMouseMove}
            onMouseLeave={resetTilt}
            className="w-full sm:w-72 h-40 sm:h-72 
                       backdrop-blur-xl bg-white/5 
                       border border-white/20 
                       rounded-3xl flex flex-col 
                       items-center justify-center 
                       cursor-pointer transition-all duration-500 
                       active:scale-95
                       shadow-[0_0_40px_rgba(255,255,255,0.2)] 
                       hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]"
          >
            <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">
              Slave (Demo)
            </h2>
            <p className="text-zinc-400 text-sm text-center px-6">
              Explore features without authentication.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}