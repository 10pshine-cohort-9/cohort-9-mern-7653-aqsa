import { useEffect, useState } from "react";
import Sidebar from "../components/Dashboard/Sidebar";
import TaskInputBar from "../components/Tasks/TaskInputBar";
import TaskListSection from "../components/Tasks/TaskListSection";
import CompletedTasksSidebar from "../components/Tasks/CompletedTasksSidebar";
import { getTasks, createTask, toggleTask, deleteTask } from "../api/tasks.js";
import { getNotes } from "../api/notes.js";
import { socket } from "../api/socket.js";
import axios from "../api/axios.js";
const MAX_TITLE_LENGTH = 70;
const MAX_DESCRIPTION_LENGTH = 150;
function formatDateForInput(date) {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseNaturalLanguageDate(inputStr) {
  let text = inputStr;
  let parsedDate = null;
  const today = new Date();
  const lower = inputStr.toLowerCase();
  if (/\b(today|tonight)\b/i.test(lower)) {
    parsedDate = new Date();
    text = text.replace(/\b(today|tonight)\b/gi, "").trim();
  } else if (/\btomorrow\b/i.test(lower)) {
    const d = new Date();
    d.setDate(today.getDate() + 1);
    parsedDate = d;
    text = text.replace(/\btomorrow\b/gi, "").trim();
  } else if (/\bnext week\b/i.test(lower)) {
    const d = new Date();
    d.setDate(today.getDate() + 7);
    parsedDate = d;
    text = text.replace(/\bnext week\b/gi, "").trim();
  } else if (/\bnext (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(lower)) {
    const match = lower.match(/\bnext (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    if (match) {
      const targetDay = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(match[1].toLowerCase());
      const d = new Date();
      const currentDay = d.getDay();
      let diff = (targetDay + 7 - currentDay) % 7;
      if (diff === 0) diff = 7;
      d.setDate(d.getDate() + diff);
      parsedDate = d;
      text = text.replace(match[0], "").trim();
    }
  }
  return { cleanTitle: text, detectedDate: parsedDate };
}
export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDescription, setQuickDescription] = useState("");
  const [quickDueDate, setQuickDueDate] = useState("");
  const [quickPriority, setQuickPriority] = useState("Medium");
  const [quickNote, setQuickNote] = useState("");
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
  useEffect(() => {
    loadData();
    fetchUser();
  }, []);
  async function fetchUser() {
    try {
      const { data } = await axios.get("/auth/profile");
      if (data?.user?._id) setUserId(data.user._id);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  }
  useEffect(() => {
    if (!userId) return;
    if (!socket.connected) socket.connect();
    const handleConnect = () => socket.emit("join_user_room", userId);
    if (socket.connected) handleConnect();
    socket.on("connect", handleConnect);
    socket.on("task_created", (newTask) => {
      setTasks((prev) => (prev.some((t) => t._id === newTask._id) ? prev : [newTask, ...prev]));
    });
    socket.on("task_updated", (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    });
    socket.on("task_deleted", (deletedTaskId) => {
      setTasks((prev) => prev.filter((t) => t._id !== deletedTaskId));
    });
    return () => {
      socket.off("connect", handleConnect);
      socket.off("task_created");
      socket.off("task_updated");
      socket.off("task_deleted");
    };
  }, [userId]);
  async function loadData() {
    try {
      setLoading(true);
      const [tasksRes, notesRes] = await Promise.all([
        getTasks(),
        getNotes({ limit: 50 }).catch(() => ({ notes: [] })),
      ]);
      setTasks(tasksRes.tasks || []);
      setNotes(notesRes.notes || []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }
  function handleQuickTitleChange(e) {
    const val = e.target.value.slice(0, MAX_TITLE_LENGTH);
    setQuickTitle(val);
    const { detectedDate } = parseNaturalLanguageDate(val);
    if (detectedDate) setQuickDueDate(formatDateForInput(detectedDate));
  }
  function handlePresetPill(type) {
    const target = new Date();
    if (type === "today") setQuickDueDate(formatDateForInput(target));
    else if (type === "tomorrow") {
      target.setDate(target.getDate() + 1);
      setQuickDueDate(formatDateForInput(target));
    } else if (type === "next-week") {
      target.setDate(target.getDate() + 7);
      setQuickDueDate(formatDateForInput(target));
    } else if (type === "clear") {
      setQuickDueDate("");
    }
  }
  async function handleQuickAdd(e) {
    e.preventDefault();
    if (!quickTitle.trim() || isQuickSubmitting) return;
    const { cleanTitle, detectedDate } = parseNaturalLanguageDate(quickTitle);
    const finalTitle = (cleanTitle || quickTitle.trim()).slice(0, MAX_TITLE_LENGTH);
    const todayStr = formatDateForInput(new Date());
    const finalDate = quickDueDate || (detectedDate ? formatDateForInput(detectedDate) : todayStr);
    try {
      setIsQuickSubmitting(true);
      const res = await createTask({
        title: finalTitle,
        description: quickDescription.trim().slice(0, MAX_DESCRIPTION_LENGTH),
        dueDate: finalDate,
        priority: quickPriority || "Medium",
        note: quickNote || null,
      });
      setTasks((prev) => (prev.some((t) => t._id === res.task._id) ? prev : [res.task, ...prev]));
      setQuickTitle("");
      setQuickDescription("");
      setQuickDueDate("");
      setQuickPriority("Medium");
      setQuickNote("");
      setShowQuickNote(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setIsQuickSubmitting(false);
    }
  }
  async function handleToggle(id) {
    try {
      setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, completed: !t.completed } : t)));
      await toggleTask(id);
    } catch (err) {
      console.error("Failed to toggle task:", err);
      loadData();
    }
  }
  async function handleDelete(id) {
    try {
      setTasks((prev) => prev.filter((t) => t._id !== id));
      await deleteTask(id);
    } catch (err) {
      console.error("Failed to delete task:", err);
      loadData();
    }
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const todayTasks = pendingTasks.filter((t) => {
    if (!t.dueDate) return true;
    const d = new Date(t.dueDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() <= now.getTime();
  });
  const upcomingTasks = pendingTasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() > now.getTime();
  });
  const progressPercent = tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100);
  const todayStr = formatDateForInput(new Date());
  const tomorrowStr = formatDateForInput(new Date(Date.now() + 86400000));
  return (
    <div className="min-h-screen bg-[#fdf9f1] text-[#1c1c17] font-sans antialiased overflow-x-hidden">
      <Sidebar />
      <main className="min-h-screen md:ml-[280px] pt-20 md:pt-14 px-4 md:px-12 pb-16">
        <header className="mb-6">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[#1c1c17]">
            Tasks
          </h1>
          <div className="mt-4 flex flex-col gap-2 max-w-sm">
            <span className="text-xs font-semibold text-[#5f5e5d]">
              {completedTasks.length} of {tasks.length} completed
            </span>
            <div className="w-full h-1.5 bg-[#ece8e0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0040df] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>
        <div className="max-w-3xl mb-8">
          <TaskInputBar
            quickTitle={quickTitle}
            quickDescription={quickDescription}
            quickDueDate={quickDueDate}
            quickPriority={quickPriority}
            quickNote={quickNote}
            showQuickNote={showQuickNote}
            isQuickSubmitting={isQuickSubmitting}
            notes={notes}
            maxTitleLength={MAX_TITLE_LENGTH}
            maxDescLength={MAX_DESCRIPTION_LENGTH}
            todayStr={todayStr}
            tomorrowStr={tomorrowStr}
            onTitleChange={handleQuickTitleChange}
            onDescriptionChange={(e) => setQuickDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
            onDueDateChange={setQuickDueDate}
            onPriorityChange={setQuickPriority}
            onNoteChange={setQuickNote}
            onToggleNote={() => setShowQuickNote(!showQuickNote)}
            onPresetPill={handlePresetPill}
            onSubmit={handleQuickAdd}
          />
        </div>
        {loading ? (
          <div className="py-20 text-center text-sm text-[#5f5e5d]">
            Loading tasks...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <TaskListSection
                icon="light_mode"
                title="Today"
                iconClass="text-[#0040df]"
                tasks={todayTasks}
                emptyText="No pending tasks for today."
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
              <TaskListSection
                icon="calendar_month"
                title="Upcoming"
                iconClass="text-[#5f5e5d]"
                tasks={upcomingTasks}
                emptyText="No upcoming tasks scheduled."
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            </div>
            <CompletedTasksSidebar
              completedTasks={completedTasks}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          </div>
        )}
      </main>
    </div>
  );
}