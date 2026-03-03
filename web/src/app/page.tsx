"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    const generated = Array.from({ length: 25 }).map(() => ({
      size: Math.random() * 6 + 4,
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: Math.random() * 10 + 10,
    }));

    setParticles(generated);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = ((y / rect.height) - 0.5) * 10;
    const rotateY = ((x / rect.width) - 0.5) * -10;

    el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  function resetTilt(e: React.MouseEvent<HTMLDivElement>) {
    e.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg)";
  }


function handleMonarch() {
  router.push("/login?mode=monarch");
}

function handleSlave() {
  router.push("/dashboard?mode=slave");
}

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen overflow-hidden text-white flex flex-col items-center justify-center">

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/dashboard-bg.jpg')" }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-black/40 to-black/80 animate-gradient" />

      {/* Spotlight Effect */}
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
      <div className="relative z-10 text-center animate-fade">

        <div className="mb-6 text-6xl animate-crown">👑</div>

        <h1 className="text-5xl font-bold mb-16 tracking-wide">
          Royal Tracker
        </h1>

        <div className="flex gap-10 flex-wrap justify-center">

          {/* Monarch */}
          <div
            onClick={handleMonarch}
            onMouseMove={handleMouseMove}
            onMouseLeave={resetTilt}
            className="w-72 h-72 backdrop-blur-xl bg-white/10 border border-purple-500/30 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 shadow-[0_0_40px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_rgba(168,85,247,0.8)]"
          >
            <h2 className="text-3xl font-bold mb-4">Monarch</h2>
            <p className="text-zinc-300 text-sm text-center px-6">
              Secure multi-layer authentication access.
            </p>
          </div>

          {/* Slave */}
          <div
            onClick={handleSlave}
            onMouseMove={handleMouseMove}
            onMouseLeave={resetTilt}
            className="w-72 h-72 backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]"
          >
            <h2 className="text-3xl font-bold mb-4">Slave (Demo)</h2>
            <p className="text-zinc-400 text-sm text-center px-6">
              Explore features without authentication.
            </p>
          </div>

        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); opacity: 0.5; }
          50% { transform: translateY(-20px); opacity: 1; }
          100% { transform: translateY(0px); opacity: 0.5; }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes crown {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-gradient {
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
        }

        .animate-crown {
          animation: crown 3s ease-in-out infinite;
        }

        .animate-fade {
          animation: fade 1s ease forwards;
        }
      `}</style>
    </div>
  );
}