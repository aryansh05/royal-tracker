"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type StreakTask = {
  id: string;
  task_name: string;
  current_streak: number;
  last_completed: string | null;
};

export default function StreakTab({
  mode,
}: {
  mode: "monarch" | "slave";
}) {
  const [tasks, setTasks] = useState<StreakTask[]>([]);
  const [newTask, setNewTask] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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

  /* ---------------- FETCH TASKS ---------------- */

  useEffect(() => {
    if (mode === "monarch") {
      fetchTasksFromDB();
    } else {
      setTasks([]);
    }
  }, [mode]);

  async function fetchTasksFromDB() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const { data } = await supabase
      .from("streak_tasks")
      .select("*")
      .eq("user_id", user.id);

    if (!data) return;

    setTasks(resetBrokenStreaks(data));
  }

  function resetBrokenStreaks(data: StreakTask[]) {
    const todayStr = new Date().toISOString().split("T")[0];

    return data.map((task) => {
      if (!task.last_completed) return task;

      const lastStr = new Date(task.last_completed)
        .toISOString()
        .split("T")[0];

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastStr !== todayStr && lastStr !== yesterdayStr) {
        return { ...task, current_streak: 0 };
      }

      return task;
    });
  }

  /* ---------------- ADD TASK ---------------- */

  async function addTask() {
    if (!newTask.trim()) return;

    const newTaskObj: StreakTask = {
      id: crypto.randomUUID(),
      task_name: newTask,
      current_streak: 0,
      last_completed: null,
    };

    if (mode === "monarch") {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      await supabase.from("streak_tasks").insert({
        user_id: user.id,
        task_name: newTask,
        current_streak: 0,
        last_completed: null,
      });

      fetchTasksFromDB();
    } else {
      setTasks((prev) => [...prev, newTaskObj]);
    }

    setNewTask("");
    showNotification("Task Created ✨");
  }

  /* ---------------- COMPLETE TASK ---------------- */

  async function completeTask(task: StreakTask) {
    const todayStr = new Date().toISOString().split("T")[0];

    let newStreak = 1;

    if (task.last_completed) {
      const lastStr = new Date(task.last_completed)
        .toISOString()
        .split("T")[0];

      if (lastStr === todayStr) {
        showNotification("Already completed today ⚡", "error");
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastStr === yesterdayStr) {
        newStreak = task.current_streak + 1;
      }
    }

    if (mode === "monarch") {
      await supabase
        .from("streak_tasks")
        .update({
          current_streak: newStreak,
          last_completed: todayStr,
        })
        .eq("id", task.id);

      fetchTasksFromDB();
    } else {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                current_streak: newStreak,
                last_completed: todayStr,
              }
            : t
        )
      );
    }

    showNotification("Task Completed 🔥");
  }

  /* ---------------- DELETE TASK ---------------- */

  async function deleteTask(id: string) {
    if (mode === "monarch") {
      await supabase.from("streak_tasks").delete().eq("id", id);
      fetchTasksFromDB();
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }

    showNotification("Task Deleted ❌", "error");
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="relative w-full">

      {/* Notification */}
      {notification && (
        <div
          className="
            fixed bottom-6 right-4 sm:right-8 z-[9999]
            backdrop-blur-xl bg-white/10
            border border-white/20
            shadow-[0_8px_30px_rgba(0,0,0,0.6)]
            px-5 py-3 rounded-2xl
            text-white text-sm font-medium
          "
        >
          {notification.message}
        </div>
      )}

      <div
        className="
          backdrop-blur-2xl bg-white/5 border border-white/10
          shadow-[0_20px_60px_rgba(0,0,0,0.6)]
          rounded-3xl
          p-4 sm:p-6 lg:p-8
          overflow-y-auto
        "
      >
        {/* Add Task */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            placeholder="Create a new streak..."
            className="
              flex-1 px-4 py-3
              bg-white/5 border border-white/10
              rounded-xl text-white placeholder-zinc-400
              focus:outline-none focus:ring-2 focus:ring-purple-500/40
              transition
            "
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />

          <button
            onClick={addTask}
            className="
              px-6 py-3
              bg-purple-500/20 border border-purple-400/30
              text-purple-300 rounded-xl
              hover:bg-purple-500/30
              transition-all duration-200
              active:scale-95
            "
          >
            Add
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="
                flex flex-col sm:flex-row sm:justify-between sm:items-center
                gap-4
                backdrop-blur-xl bg-white/5
                border border-white/10
                shadow-[0_8px_30px_rgba(0,0,0,0.5)]
                p-4 sm:p-5 rounded-2xl
              "
            >
              <div>
                <p className="font-semibold text-white text-lg">
                  {task.task_name}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  🔥 {task.current_streak} day
                  {task.current_streak !== 1 && "s"}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => completeTask(task)}
                  className="
                    px-4 py-2
                    bg-green-500/20 border border-green-400/30
                    text-green-300 rounded-xl
                    active:scale-95
                  "
                >
                  Complete
                </button>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="
                    px-4 py-2
                    bg-red-500/20 border border-red-400/30
                    text-red-300 rounded-xl
                    active:scale-95
                  "
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}