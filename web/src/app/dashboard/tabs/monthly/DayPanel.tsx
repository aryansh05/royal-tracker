"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { start } from "repl";

type Block = {
  id: string;
  start: number;
  end: number;
  gradient: string;
  description?: string;
};

type Props = {
  date: string;
  mode: "monarch" | "slave";
  demoEntries: any[];
};

export default function DayPanel({ date, mode, demoEntries }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);

  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const PIXELS = typeof window !== "undefined" && window.innerWidth < 768
  ? 900
  : 1200;
  const DAY_MINUTES = 1440;

  /* ---------------- NOTIFICATION ---------------- */

  function showNotification(
    message: string,
    type: "success" | "error" = "success"
  ) {
    setNotification({ message, type });

    const soundSrc =
      type === "success" ? "/sounds/success.mp3" : "/sounds/error.mp3";

    audioRef.current = new Audio(soundSrc);
    audioRef.current.volume = 0.4;
    audioRef.current.play().catch(() => {});

    setTimeout(() => setNotification(null), 3000);
  }

  /* ---------------- GRADIENT ---------------- */

  function randomGradient() {
    const h1 = Math.floor(Math.random() * 360);
    const h2 = Math.floor(Math.random() * 360);

    return `linear-gradient(135deg,
      hsl(${h1}, 70%, 55%),
      hsl(${h2}, 70%, 55%)
    )`;
  }

  /* ---------------- LOAD DATA ---------------- */

 useEffect(() => {
  if (mode === "monarch") {
    fetchBlocksFromDB();
  }

  if (mode === "slave") {
    loadDemoBlocks();
  }
}, [date, mode, demoEntries]);

  async function fetchBlocksFromDB() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const { data } = await supabase
      .from("work_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date);

    if (!data) {
      setBlocks([]);
      return;
    }

    setBlocks(
      data.map((e: any) => {
        const [sh, sm] = e.start_time.split(":").map(Number);
        const [eh, em] = e.end_time.split(":").map(Number);

        return {
          id: e.id,
          start: sh * 60 + sm,
          end: eh * 60 + em,
          gradient: randomGradient(),
          description: e.description || "",
        };
      })
    );
  }

  function loadDemoBlocks() {
    const filtered = (demoEntries || []).filter(
      (e) => e.date === date
    );

    setBlocks(
  filtered.map((e) => {
    const [sh, sm] = e.start_time.split(":").map(Number);
    const [eh, em] = e.end_time.split(":").map(Number);

    return {
      id: e.id,  
      start: sh * 60 + sm,
      end: eh * 60 + em,
      gradient: randomGradient(),
      description: e.description || "",
    };
  })
);
  }

  /* ---------------- HELPERS ---------------- */

  function clamp(y: number) {
    return Math.max(0, Math.min(PIXELS, y));
  }

  function formatTime(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function formatDuration(minutes: number) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins} minutes`;
    if (mins === 0) return `${hrs} hours`;
    return `${hrs} hours ${mins} minutes`;
  }

  /* ---------------- DRAG ---------------- */

 function handlePointerDown(e: React.PointerEvent) {
  if ((e.target as HTMLElement).closest(".modal-content")) return;
  if (!containerRef.current) return;

  const rect = containerRef.current.getBoundingClientRect();
  const y = clamp(e.clientY - rect.top + containerRef.current.scrollTop);

  setIsDragging(true);
  setStartY(y);
  setCurrentY(y);
}

useEffect(() => {
  function move(e: PointerEvent) {
    if (!isDragging || !containerRef.current || startY === null) return;

    const rect = containerRef.current.getBoundingClientRect();
    setCurrentY(
      clamp(e.clientY - rect.top + containerRef.current.scrollTop)
    );
  }

  async function up(e: PointerEvent) {
    if (!isDragging || !containerRef.current || startY === null) return;

    const rect = containerRef.current.getBoundingClientRect();
    const endY = clamp(e.clientY - rect.top + containerRef.current.scrollTop);

    setIsDragging(false);

    const start = Math.min(
      Math.floor((startY / PIXELS) * DAY_MINUTES),
      Math.floor((endY / PIXELS) * DAY_MINUTES)
    );

    const end = Math.max(
      Math.floor((startY / PIXELS) * DAY_MINUTES),
      Math.floor((endY / PIXELS) * DAY_MINUTES)
    );

    if (end - start < 1) return;

    const overlap = blocks.some(
      (b) => start < b.end && end > b.start
    );

    if (overlap) {
      showNotification("Time overlaps existing block ❌", "error");
      return;
    }

    const startTime = formatTime(start);
    const endTime = formatTime(end);

    if (mode === "monarch") {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("work_entries")
        .insert({
          user_id: user.id,
          date,
          start_time: startTime,
          end_time: endTime,
          duration: end - start,
          description: "",
        })
        .select()
        .single();

      if (error) {
        showNotification("Failed to create block ❌", "error");
        return;
      }

      await fetchBlocksFromDB();

      openEdit({
        id: data.id,
        start,
        end,
        gradient: randomGradient(),
        description: "",
      });
    }

    if (mode === "slave") {
      const newBlock: Block = {
        id: crypto.randomUUID(),
        start,
        end,
        gradient: randomGradient(),
        description: "",
      };

      setBlocks((prev) => [...prev, newBlock]);
      openEdit(newBlock);
    }

    showNotification("Work Added ✅");
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);

  return () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
}, [isDragging, startY, date, mode, blocks]);

  /* ---------------- EDIT ---------------- */

  function openEdit(block: Block) {
    setEditingBlock(block);
    setEditStart(formatTime(block.start));
    setEditEnd(formatTime(block.end));
    setEditDescription(block.description || "");
  }

  async function saveEdit() {
  if (!editingBlock) return;

  const [sh, sm] = editStart.split(":").map(Number);
  const [eh, em] = editEnd.split(":").map(Number);

  const newStart = sh * 60 + sm;
  const newEnd = eh * 60 + em;

  if (newEnd <= newStart) {
    showNotification("Invalid time range ❌", "error");
    return;
  }

  const overlap = blocks.some(
    b =>
      b.id !== editingBlock.id &&
      newStart < b.end &&
      newEnd > b.start
  );

  if (overlap) {
    showNotification("Time overlaps existing block ❌", "error");
    return;
  }

  if (mode === "monarch") {
    await supabase
      .from("work_entries")
      .update({
        start_time: editStart,
        end_time: editEnd,
        duration: newEnd - newStart,
        description: editDescription,
      })
      .eq("id", editingBlock.id);

    await fetchBlocksFromDB();
  }

  if (mode === "slave") {
    setBlocks(prev =>
      prev.map(b =>
        b.id === editingBlock.id
          ? {
              ...b,
              start: newStart,
              end: newEnd,
              description: editDescription,
            }
          : b
      )
    );
  }

  setEditingBlock(null);
  showNotification("Work Saved 🟢");
}

  async function deleteBlock() {
    if (!editingBlock) return;

    if (mode === "monarch") {
      await supabase
        .from("work_entries")
        .delete()
        .eq("id", editingBlock.id);

      fetchBlocksFromDB();
    }

   if (mode === "slave") {
  setBlocks(prev =>
    prev.filter(b => b.id !== editingBlock.id)
  );
}

    setEditingBlock(null);
    showNotification("Work Deleted 🔴", "error");
  }

  const totalMinutes = blocks.reduce(
    (sum, b) => sum + (b.end - b.start),
    0
  );

  return (
  <div className="flex-1 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 
                  p-8 rounded-3xl border border-zinc-800 
                  h-full overflow-y-auto relative
                  shadow-[0_40px_120px_rgba(0,0,0,0.6)]">

    {/* ---------------- NOTIFICATION ---------------- */}
    {notification && (
      <div className="fixed bottom-8 right-8 z-[99999]
                      backdrop-blur-2xl bg-white/10
                      border border-white/20
                      shadow-[0_20px_60px_rgba(0,0,0,0.6)]
                      px-6 py-4 rounded-2xl
                      text-white text-sm font-medium
                      pointer-events-none">
        {notification.message}
      </div>
    )}

    {/* ---------------- HEADER ---------------- */}
    <div className="mb-6">
     <h2 className="text-2xl font-bold text-white tracking-tight">
  {new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",   
    day: "numeric",
    month: "long",
    year: "numeric",
  })}
</h2>
      <p className="text-sm text-zinc-400 mt-1">
        Total: {formatDuration(totalMinutes)}
      </p>
    </div>

    {/* ---------------- TIMELINE ---------------- */}
    <div
      ref={containerRef}
      className="timeline-container relative bg-white/[0.03] backdrop-blur-xl
             border border-white/10 rounded-2xl
             w-full"
      onPointerDown={handlePointerDown}
    >
      <div style={{ height: PIXELS, position: "relative" }}>

        {/* Hour Lines */}
        {Array.from({ length: 24 }, (_, hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 flex items-start text-xs text-zinc-500"
            style={{ top: (hour / 24) * PIXELS }}
          >
            <div className="w-20 pl-4 opacity-60">
              {hour}:00
            </div>
            <div className="flex-1 border-t border-white/5 mt-2" />
          </div>
        ))}

        {/* Drag Preview */}
        {isDragging && startY !== null && currentY !== null && (
  <>
    {/* Soft Glow Background */}
    <div
      className="absolute left-16 right-4 rounded-2xl
                 pointer-events-none
                 blur-2xl"
      style={{
        top: Math.min(startY, currentY) - 8,
        height: Math.abs(currentY - startY) + 16,
        background:
          "linear-gradient(180deg, rgba(21, 21, 21, 0), rgba(255,255,255,0.08))",
      }}
    />

    {/* Main Drag Block */}
    <div
      className="absolute left-16 right-4 rounded-2xl
                 backdrop-blur-2xl
                 border border-white/30
                 shadow-[0_0_60px_rgba(255,255,255,0.4)]
                 pointer-events-none"
      style={{
        top: Math.min(startY, currentY),
        height: Math.abs(currentY - startY),
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))",
      }}
    />
  </>
)}

        {/* Blocks */}
        {blocks.map((b) => {
          const top = (b.start / DAY_MINUTES) * PIXELS;
          const height =
            ((b.end - b.start) / DAY_MINUTES) * PIXELS;

          return (
            <div
              key={b.id}
              onClick={() => openEdit(b)}
              className="absolute left-20 right-6 rounded-2xl
                         px-4 py-3 text-xs cursor-pointer
                         transition-all duration-300
                         hover:scale-[1.02]
                         hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
              style={{
                top,
                height,
                background: b.gradient,
              }}
            >
              <span className="text-white font-semibold block">
                {formatTime(b.start)} — {formatTime(b.end)}
              </span>

              {b.description && (
                <span className="text-[11px] text-white/80 mt-1 block line-clamp-2">
                  {b.description}
                </span>
              )}
            </div>
          );
        })}

      </div>
    </div>

    {/* ---------------- EDIT MODAL ---------------- */}
    {editingBlock && (
      <div className="fixed inset-0 flex items-center justify-center z-[10000]">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setEditingBlock(null)}
        />
        <div className="relative w-[90%] max-w-sm backdrop-blur-2xl
                        bg-white/10 border border-white/20
                        rounded-2xl p-6 space-y-5
                        shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
          <h3 className="text-white font-semibold text-lg">
            Edit Block
          </h3>

          <input
            type="time"
            value={editStart}
            onChange={(e) => setEditStart(e.target.value)}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
          />

          <input
            type="time"
            value={editEnd}
            onChange={(e) => setEditEnd(e.target.value)}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
          />

          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Add description..."
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white resize-none h-24"
          />

          <div className="flex gap-3 pt-2">
            <button
              onClick={deleteBlock}
              className="flex-1 bg-red-500/20 border border-red-400/30 text-red-300 py-2.5 rounded-xl"
            >
              Delete
            </button>

            <button
              onClick={saveEdit}
              className="flex-1 bg-green-500/20 border border-green-400/30 text-green-300 py-2.5 rounded-xl"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
);
}