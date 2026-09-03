import { useNavigate } from "react-router-dom";
export default function TaskItem({ task, onToggle, onDelete }) {
  const navigate = useNavigate();
  return (
    <div className="group flex items-start justify-between gap-3 py-1">
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <button
          type="button"
          onClick={() => onToggle(task._id)}
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border border-[#747688] bg-transparent transition-colors group-hover:border-[#0040df]">
          {task.completed && (
            <span className="material-symbols-outlined text-[15px] text-[#0040df]">
              check
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-all text-sm font-semibold leading-snug text-[#1c1c17]">
            {task.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#5f5e5d]">
            {task.note && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const noteId =
                    typeof task.note === "object"
                      ? task.note._id
                      : task.note;

                  if (noteId) {
                    navigate(`/note/${noteId}`);
                  }
                }}
                className="flex cursor-pointer items-center gap-1 rounded bg-blue-50/65 px-1.5 py-0.5 text-[#0040df] transition-colors hover:bg-blue-100/60 hover:underline"
                title="View Note">
                <span className="material-symbols-outlined text-[14px]">
                  link
                </span>
                <span className="max-w-[120px] truncate">
                  {typeof task.note === "object"
                    ? task.note.title || "Note"
                    : "Note"}
                </span>
              </button>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-1 font-medium text-[#ba1a1a]">
                <span className="material-symbols-outlined text-[14px]">
                  schedule
                </span>
                <span>
                  {new Date(task.dueDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </span>
            )}
            {task.priority && task.priority !== "Medium" && (
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                  task.priority === "High"
                    ? "bg-[#ffdad6] text-[#93000a]"
                    : "bg-[#f1ede6] text-[#5f5e5d]"
                }`}>
                {task.priority}
              </span>
            )}
          </div>
          {task.description && (
            <p className="mt-1.5 line-clamp-3 break-all text-xs text-[#434656]">
              {task.description}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(task._id)}
        className="p-1 text-[#747688] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#ba1a1a]"
        title="Delete task">
        <span className="material-symbols-outlined text-[18px]">
          delete
        </span>
      </button>
    </div>
  );
}