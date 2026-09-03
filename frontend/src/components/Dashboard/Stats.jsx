import { useState, useEffect, useCallback } from "react";
import { getTasks } from "../../api/tasks";
import { getNotes } from "../../api/notes";
import { socket } from "../../api/socket";
import api from "../../api/axios";
export default function Stats() {
  const [counts, setCounts] = useState({
    tasksToday: 0,
    notesThisWeek: 0,
    unfinishedItems: 0,
  });
  const fetchStats = useCallback(async () => {
    try {
      const [tasksRes, notesRes] = await Promise.all([
        getTasks({}),
        getNotes(),
      ]);
      const tasks = tasksRes.tasks || tasksRes || [];
      const notes = notesRes.notes || notesRes || [];
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isTaskCompleted = (t) => t.completed === true || t.completed === "true";
      const unfinishedTasks = tasks.filter((t) => !isTaskCompleted(t));
      const tasksToday = unfinishedTasks.filter((t) => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        const dueStr = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
        return dueStr === todayStr;
      }).length;
      const notesThisWeek = notes.filter((n) => {
        const created = new Date(n.createdAt);
        return created >= sevenDaysAgo;
      }).length;
      setCounts({
        tasksToday,
        notesThisWeek,
        unfinishedItems: unfinishedTasks.length,
      });
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    }
  }, []);
  useEffect(() => {
    fetchStats();
    api.get("/auth/profile").then((res) => {
      const userId = res.data?.user?._id;
      if (userId) {
        if (!socket.connected) socket.connect();
        socket.emit("join", userId);
      }
    });
    socket.on("task_created", fetchStats);
    socket.on("task_updated", fetchStats);
    socket.on("task_deleted", fetchStats);
    return () => {
      socket.off("task_created", fetchStats);
      socket.off("task_updated", fetchStats);
      socket.off("task_deleted", fetchStats);
    };
  }, [fetchStats]);
  const statsList = [
    {
      icon: "task_alt",
      value: counts.tasksToday,
      label: "Tasks Today",
      tone: "normal",
    },
    {
      icon: "description",
      value: counts.notesThisWeek,
      label: "Notes this week",
      tone: "normal",
    },
    {
      icon: "pending",
      value: counts.unfinishedItems,
      label: "Unfinished items",
      tone: counts.unfinishedItems > 0 ? "error" : "normal",
    },
  ];
  return (
    <section className="lg:col-span-12 flex flex-col sm:flex-row gap-4 mb-4 border-b border-[#c4c5d9] pb-8">
      {statsList.map((stat, index) => (
        <div
          key={stat.label}
          className={`flex items-center gap-3 ${
            index === 0
              ? "pr-8 sm:border-r"
              : index === 1
              ? "px-0 sm:px-8 sm:border-r"
              : "px-0 sm:px-8"
          } border-[#c4c5d9]/50`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              stat.tone === "error"
                ? "bg-[#ffdad6] text-[#93000a]"
                : "bg-[#ece8e0] text-[#1c1c17]"
            }`}
          >
            <span className="material-symbols-outlined">{stat.icon}</span>
          </div>
          <div>
            <p className="font-display text-[20px] font-semibold leading-tight">
              {stat.value}
            </p>
            <p className="text-xs text-[#5f5e5d] uppercase tracking-widest mt-0.5">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}