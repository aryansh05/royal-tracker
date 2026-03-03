"use client";

import { useEffect, useState } from "react";
import MonthlyTab from "./tabs/monthly/MonthlyTab";
import StreakTab from "./tabs/StreakTab";
import WeeklyTab from "./tabs/WeeklyTab";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState("monthly");
  const [checkingAuth, setCheckingAuth] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");

  const isValidMode = modeParam === "monarch" || modeParam === "slave";

  useEffect(() => {
    if (!isValidMode) router.replace("/");
  }, [isValidMode, router]);

  if (!isValidMode) return null;

  const currentMode: "monarch" | "slave" = modeParam;

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
  }, [currentMode, router]);

  if (checkingAuth) return null;

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
    localStorage.clear();
    router.replace("/");
  };

  return (
    <div
      className="min-h-screen w-full text-white relative overflow-x-hidden"
      style={{
        backgroundImage: "url('/images/dashboard-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col h-screen">

        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold tracking-wide">
            Aryan Sharma
          </h1>

          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 bg-red-500/20 border border-red-400/40 rounded-lg active:scale-95 transition"
          >
            Logout
          </button>
        </div>

        {/* Tab Bar (Mobile Friendly) */}
        <div className="px-3">
          <div className="flex w-full bg-white/5 rounded-2xl p-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex-1 py-2 text-sm rounded-xl transition-all
                    ${
                      isActive
                        ? "bg-purple-600 text-white shadow-lg"
                        : "text-zinc-400"
                    }
                  `}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-3 pt-4 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}