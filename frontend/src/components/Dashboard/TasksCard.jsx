import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getTasks, toggleTask } from "../../api/tasks.js";
import { socket } from "../../api/socket";
import api from "../../api/axios";
export default function TasksCard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTasks({ completed: "false" });
      const rawTasks = data.tasks || data || [];
      const unfinished = rawTasks.filter((t) => !t.completed);
      setTasks(unfinished);
    } catch (err) {
      console.error("Failed to load dashboard tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadTasks();
    api.get("/auth/profile").then((res) => {
      const userId = res.data?.user?._id;
      if (userId) {
        if (!socket.connected) socket.connect();
        socket.emit("join", userId);
      }
    }).catch((err) => {
      console.error("Failed to fetch profile for socket setup:", err);
    });
    socket.on("task_created", loadTasks);
    socket.on("task_updated", loadTasks);
    socket.on("task_deleted", loadTasks);
    return () => {
      socket.off("task_created", loadTasks);
      socket.off("task_updated", loadTasks);
      socket.off("task_deleted", loadTasks);
    };
  }, [loadTasks]);
  async function handleToggle(id) {
    const previousTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t._id !== id));
    try {
      await toggleTask(id);
    } catch (err) {
      console.error("Failed to toggle task:", err);
      setTasks(previousTasks);
    }
  }
  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-[#ffdad6] text-[#93000a]";
      case "medium":
        return "bg-[#e2e7ff] text-[#0040df]";
      default:
        return "bg-[#ece8e0] text-[#5f5e5d]";
    }
  };
  return (
    <section className="lg:col-span-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs text-[#5f5e5d] uppercase tracking-widest font-semibold">
          Unfinished Tasks ({tasks.length})
        </h3>
        <button
          onClick={() => navigate("/tasks")}
          className="text-[#0040df] hover:text-[#0035bd] text-sm font-semibold transition-colors"
        >
          View All
        </button>
      </div>
      <div className="bg-white border border-[#c4c5d9] rounded-xl p-6 shadow-[0_10px_30px_-10px_rgba(28,28,23,0.08)] h-[340px] flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-xs text-[#747688]">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-3xl text-[#5f5e5d] mb-1">
              task_alt
            </span>
            <p className="text-sm font-semibold text-[#1c1c17]">All caught up!</p>
            <p className="text-xs text-[#5f5e5d] mt-1">No pending tasks.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-auto pb-2 pr-2 space-y-2">
            <div className="min-w-[320px] space-y-2">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => handleToggle(task._id)}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-[#f7f3eb] rounded-lg cursor-pointer transition-colors group border border-transparent hover:border-[#c4c5d9]/40 min-w-max"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center shrink-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Mark "${task.title}" as complete`}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggle(task._id);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 border border-[#747688] rounded flex items-center justify-center bg-transparent transition-colors group-hover:border-[#0040df] peer-checked:bg-[#0040df] peer-checked:border-[#0040df]">
                        <svg
                          className={`w-3.5 h-3.5 text-white transition-opacity ${
                            task.completed ? "opacity-100" : "opacity-0"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="whitespace-nowrap">
                      <p className="text-sm font-medium text-[#1c1c17] leading-tight">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-[#5f5e5d] mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {task.priority && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${getPriorityBadgeClass(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}