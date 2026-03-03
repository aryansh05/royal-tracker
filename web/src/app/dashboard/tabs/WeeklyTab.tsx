"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function WeeklyTab({
  mode,
}: {
  mode: "monarch" | "slave";
}) {
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [dailyData, setDailyData] = useState<
    { date: string; minutes: number }[]
  >([]);
  const [highestDate, setHighestDate] = useState<string | null>(null);
  const [highestMinutes, setHighestMinutes] = useState(0);

  /* ---------------- HELPERS ---------------- */

  function formatDuration(minutes: number) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  }

  function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  function getWeekDates() {
    const today = new Date();
    const start = getStartOfWeek(today);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  }

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    if (mode === "monarch") {
      fetchWeeklyFromDB();
    } else {
      processWeeklyData([]);
    }
  }, [mode]);

  async function fetchWeeklyFromDB() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const weekDates = getWeekDates();
    const startStr = weekDates[0];
    const endStr = weekDates[6];

    const { data } = await supabase
      .from("work_entries")
      .select("date, duration")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr);

    if (!data) return;

    processWeeklyData(data);
  }

  function processWeeklyData(entries: any[]) {
    const weekDates = getWeekDates();
    const dailyTotals: Record<string, number> = {};

    weekDates.forEach((d) => {
      dailyTotals[d] = 0;
    });

    entries.forEach((entry) => {
      if (dailyTotals.hasOwnProperty(entry.date)) {
        dailyTotals[entry.date] += entry.duration;
      }
    });

    const formatted = weekDates.map((date) => ({
      date,
      minutes: dailyTotals[date],
    }));

    setDailyData(formatted);

    const total = formatted.reduce((sum, d) => sum + d.minutes, 0);
    setWeeklyTotal(total);

    let maxDate: string | null = null;
    let maxMinutes = 0;

    formatted.forEach((d) => {
      if (d.minutes > maxMinutes) {
        maxMinutes = d.minutes;
        maxDate = d.date;
      }
    });

    setHighestDate(maxDate);
    setHighestMinutes(maxMinutes);
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* WEEKLY TOTAL */}
      <div className="backdrop-blur-2xl bg-white/5 border border-white/10
                      shadow-[0_20px_60px_rgba(0,0,0,0.6)]
                      rounded-3xl p-5 sm:p-8">
        <p className="text-sm text-zinc-400 mb-2">
          Total This Week
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-purple-400 tracking-wide">
          {formatDuration(weeklyTotal)}
        </p>
      </div>

      {/* WEEK GRID (Mobile Scrollable) */}
      <div className="overflow-x-auto">
        <div className="flex sm:grid sm:grid-cols-7 gap-4 min-w-[700px] sm:min-w-0">
          {dailyData.map((day) => {
            const dateObj = new Date(day.date);
            const weekday = dateObj.toLocaleDateString("en-US", {
              weekday: "short",
            });
            const fullDate = dateObj.toLocaleDateString("en-GB");
            const isHighest = day.date === highestDate;

            return (
              <div
                key={day.date}
                className={`flex-1 backdrop-blur-xl border rounded-2xl p-4 sm:p-5 text-center transition-all duration-300 hover:scale-[1.03]
                ${
                  isHighest
                    ? "bg-purple-500/20 border-purple-400/40 shadow-purple-500/20 shadow-lg"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <p className="text-xs text-zinc-300 uppercase tracking-wider">
                  {weekday}
                </p>

                <p className="text-xs text-zinc-300 mt-1">
                  {fullDate}
                </p>

                <p
                  className={`mt-3 font-semibold text-base sm:text-lg
                  ${isHighest ? "text-purple-300" : "text-white"}`}
                >
                  {formatDuration(day.minutes)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* HIGHEST DAY */}
      {highestDate && highestMinutes > 0 && (
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10
                        shadow-[0_20px_60px_rgba(0,0,0,0.6)]
                        rounded-3xl p-5 sm:p-8">
          <p className="text-sm text-zinc-400 mb-3">
            Highest Day This Week
          </p>

          <p className="text-lg sm:text-xl font-semibold text-white">
            {new Date(highestDate).toLocaleDateString("en-GB")}
          </p>

          <p className="text-green-400 text-base sm:text-lg mt-2 font-semibold">
            {formatDuration(highestMinutes)}
          </p>
        </div>
      )}

      {/* EMPTY STATE */}
      {highestMinutes === 0 && (
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10
                        shadow-[0_20px_60px_rgba(0,0,0,0.6)]
                        rounded-3xl p-6 sm:p-8 text-zinc-400 text-center">
          No work recorded this week.
        </div>
      )}
    </div>
  );
} 