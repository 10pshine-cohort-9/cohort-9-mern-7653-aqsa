export default function CompletedTasksSidebar({ completedTasks, onToggle, onDelete }) {
  return (
    <aside className="lg:col-span-4 bg-[#f7f3eb] border border-[#c4c5d9] rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(28,28,23,0.03)]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#5f5e5d]">
          <span className="material-symbols-outlined text-[18px]">
            check_circle
          </span>
          <span>Completed</span>
        </div>
      </div>
      {completedTasks.length === 0 ? (
        <p className="text-xs text-[#747688] italic py-4">No completed tasks yet.</p>
      ) : (
        <div className="space-y-3.5">
          {completedTasks.map((task) => (
            <div
              key={task._id}
              className="flex items-start gap-3 text-sm text-[#5f5e5d] group">
              <button
                onClick={() => onToggle(task._id)}
                className="mt-0.5 w-4 h-4 rounded-full bg-[#0040df] flex items-center justify-center text-white shrink-0 hover:opacity-80 transition-opacity"
                title="Mark incomplete"
                aria-label="Mark incomplete" >
                <span className="material-symbols-outlined text-[13px]">check</span>
              </button>
              <span className="line-through flex-1 break-all opacity-80 leading-snug line-clamp-2">
                {task.title}
              </span>
              <button
                onClick={() => onDelete(task._id)}
                className="text-[#747688] hover:text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-opacity"
                 aria-label="Delete task" >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}