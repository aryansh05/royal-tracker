
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import MonthlyTab from "./tabs/monthly/MonthlyTab";
import StreakTab from "./tabs/StreakTab";
import WeeklyTab from "./tabs/WeeklyTab";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("monthly");
  const router = useRouter();
  const searchParams = useSearchParams();
  

  const modeParam = searchParams.get("mode");

  // Validate mode from URL
  const isValidMode =
    modeParam === "monarch" || modeParam === "slave";
    useEffect(() => {
  if (!isValidMode) {
    router.replace("/");
  }
}, [isValidMode]);

  if (!isValidMode) {
    return null;
  }

  const currentMode: "monarch" | "slave" = modeParam;

  const tabs = [
    { key: "monthly", label: "Monthly" },
    { key: "streak", label: "Streaks" },
    { key: "weekly", label: "Weekly" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "monthly":
        return <MonthlyTab mode={currentMode} />;
      case "streak":
        return <StreakTab mode={currentMode} />;
      case "weekly":
        return <WeeklyTab mode={currentMode} />;
      default:
        return null;
    }
  };

  const handleLogout = async () => {
  if (currentMode === "monarch") {
    await supabase.auth.signOut();
  }

  // Optional safety cleanup (not required anymore, but safe)
  localStorage.clear();

  router.replace("/");
};
const [checkingAuth, setCheckingAuth] = useState(true);
useEffect(() => {
  const checkAuth = async () => {
    if (currentMode === "monarch") {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/");
        return;
      }
    }

    setCheckingAuth(false);
  };

  checkAuth();
}, [currentMode]);
if (!currentMode || checkingAuth) return null;

  return (
    <div
      className="min-h-screen text-white p-6 space-y-6 relative"
      style={{
        backgroundImage: "url('/images/dashboard-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />

      <div className="relative z-10 space-y-6">

        {/* Tabs */}
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 
                        shadow-[0_10px_40px_rgba(0,0,0,0.6)]
                        rounded-3xl flex overflow-hidden w-full max-w-4xl mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex-1 py-3 text-sm font-semibold transition-all duration-200 relative
                  ${
                    isActive
                      ? "bg-purple-600/30 text-white backdrop-blur-md"
                      : "text-zinc-300 hover:bg-white/5"
                  }
                `}
              >
                {tab.label}

                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 
                               w-3/4 h-[3px] bg-purple-400 rounded-full 
                               shadow-[0_0_10px_rgba(128,90,213,0.7)]"
                  />
                )}
              </button>
            );
          })}

          <div className="flex justify-end max-w-6xl mx-auto">
  <button
    onClick={handleLogout}
    className="
      px-5 py-2.5
      bg-red-500/20 border border-red-400/30
      text-red-300 rounded
      hover:bg-red-500/30
      transition-all duration-200
    "
  >
    Logout
  </button>
</div>
        </div>

        {/* Animated Content */}
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}