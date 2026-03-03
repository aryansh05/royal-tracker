"use client";

import { useState } from "react";
import MiniCalendar from "./MiniCalendar";
import DayPanel from "./DayPanel";
import { supabase } from "@/lib/supabase";

export default function MonthlyTab({
  mode,
}: {
  mode: "monarch" | "slave";
}) {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [notification, setNotification] = useState<string | null>(null);

  // 👑 Slave mode session-only storage
 const [demoEntries, setDemoEntries] = useState<any[]>([]);

  async function handleInsert(start: string, end: string) {
    if (!selectedDate) return;

    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    const newEntry = {
      id: crypto.randomUUID(),
      date: selectedDate,
      start_time: start,
      end_time: end,
      duration: endMin - startMin,
      description: "",
    };

    /* ---------------- MONARCH ---------------- */

    if (mode === "monarch") {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      await supabase.from("work_entries").insert({
        user_id: user.id,
        date: selectedDate,
        start_time: start,
        end_time: end,
        duration: endMin - startMin,
      });
    }

    /* ---------------- SLAVE ---------------- */

    if (mode === "slave") {
      setDemoEntries((prev) => [...prev, newEntry]);
    }

    /* ---------------- FEEDBACK ---------------- */

    setNotification("Work Entry Added ⏱️");

    const audio = new Audio("/sounds/success.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});

    setTimeout(() => setNotification(null), 3000);
  }

  return (
    <div
      className="
        relative flex h-[85vh] gap-8 p-8
        bg-gradient-to-br from-zinc-950 via-black to-zinc-900
        rounded-3xl overflow-hidden
      "
    >
      {/* Background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full" />

      {/* Notification */}
      {notification && (
        <div
          className="
            fixed bottom-8 right-8 z-[9999]
            backdrop-blur-2xl bg-white/10
            border border-white/20
            shadow-[0_20px_60px_rgba(0,0,0,0.6)]
            px-6 py-4 rounded-2xl
            text-white text-sm font-medium
          "
        >
          {notification}
        </div>
      )}

      {/* Left Panel */}
      <div
        className="
          w-[340px]
          backdrop-blur-2xl bg-white/5
          border border-white/10
          shadow-[0_10px_40px_rgba(0,0,0,0.5)]
          rounded-3xl p-6
          flex flex-col
        "
      >
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectDay={(d) => setSelectedDate(d)}
          onTimerComplete={handleInsert}
        />
      </div>

      {/* Right Panel */}
      <div
        className="
          flex-1
          backdrop-blur-2xl bg-white/5
          border border-white/10
          shadow-[0_10px_40px_rgba(0,0,0,0.5)]
          rounded-3xl p-8
          overflow-hidden
        "
      >
        {selectedDate ? (
          <DayPanel
            date={selectedDate}
            mode={mode}
            demoEntries={demoEntries}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
            Select a day to view timeline
          </div>
        )}
      </div>
    </div>
  );
}