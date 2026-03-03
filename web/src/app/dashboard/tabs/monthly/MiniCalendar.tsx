"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
  onTimerComplete?: (start: string, end: string) => void;
};

export default function MiniCalendar({
  selectedDate,
  onSelectDay,
  onTimerComplete,
}: Props) {
  const today = new Date();
  const [current, setCurrent] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [display, setDisplay] = useState("00:00");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // ✅ Browser-safe interval type
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function parseTime(value: string) {
    const [m, s] = value.split(":").map(Number);
    if (isNaN(m) || isNaN(s)) return 0;
    return m * 60 + s;
  }

  function format(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function startTimer() {
    const seconds = parseTime(display);
    if (seconds <= 0) return;

    if (navigator.vibrate) navigator.vibrate(50);

    setTimeLeft(seconds);
    setIsRunning(true);
    startTimeRef.current = new Date();
  }

  function stopTimer() {
    if (navigator.vibrate) navigator.vibrate(30);
    setIsRunning(false);
  }

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      if (!startTimeRef.current) return;

      const now = new Date();
      const elapsed =
        Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000);

      const remaining = parseTime(display) - elapsed;

      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        setTimeLeft(0);

        const start = startTimeRef.current;
        const end = new Date();

        // 🔔 SOUND
        audioRef.current = new Audio("/sounds/timer.mp3");
        audioRef.current.volume = 0.7;
        audioRef.current.play().catch(() => {});

        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        if (onTimerComplete) {
          const formatHM = (d: Date) =>
            `${String(d.getHours()).padStart(2, "0")}:${String(
              d.getMinutes()
            ).padStart(2, "0")}`;

          onTimerComplete(formatHM(start), formatHM(end));
        }

        return;
      }

      setTimeLeft(remaining);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, display]);

  useEffect(() => {
    if (isRunning) {
      setDisplay(format(timeLeft));
    }
  }, [timeLeft, isRunning]);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = current.toLocaleString("default", { month: "long" });
  const formattedMonth = String(month + 1).padStart(2, "0");

  return (
    <div
      className="
        w-full
        flex flex-col gap-6 sm:gap-8
        bg-zinc-900 rounded-3xl
        p-4 sm:p-6
        border border-zinc-800
      "
    >
      {/* CALENDAR */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setCurrent(new Date(year, month - 1, 1))}
            className="text-lg active:scale-90 transition"
          >
            ◀
          </button>

          <h3 className="font-semibold text-lg">
            {monthName} {year}
          </h3>

          <button
            onClick={() => setCurrent(new Date(year, month + 1, 1))}
            className="text-lg active:scale-90 transition"
          >
            ▶
          </button>
        </div>

        <div className="grid grid-cols-7 text-xs text-zinc-400 mb-3 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={"empty" + i}></div>
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const formattedDay = String(day).padStart(2, "0");
            const dateString = `${year}-${formattedMonth}-${formattedDay}`;
            const isSelected = selectedDate === dateString;

            return (
              <div
                key={day}
                onClick={() => onSelectDay(dateString)}
                className={`p-3 sm:p-2 rounded-xl text-sm text-center cursor-pointer transition active:scale-95
                  ${
                    isSelected
                      ? "bg-purple-600 text-white"
                      : "hover:bg-white/10"
                  }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* TIMER */}
      <div className="flex flex-col items-center gap-6 border-t border-white/10 pt-6">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9:]*"
          value={display}
          disabled={isRunning}
          onChange={(e) => setDisplay(e.target.value)}
          className="
            text-3xl sm:text-4xl
            text-center
            bg-transparent outline-none
            font-bold text-white
            tracking-widest
          "
        />

        {!isRunning ? (
          <button
            onClick={startTimer}
            className="group relative w-full overflow-hidden rounded-xl border border-white/20 bg-white/10 py-2.5 font-semibold text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/20 active:scale-95"
          >
            <span className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative flex items-center justify-center">
              Start
            </span>
          </button>
        ) : (
          <button
            onClick={stopTimer}
            className="w-full bg-red-500 py-2.5 rounded-xl hover:bg-red-600 transition active:scale-95"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}