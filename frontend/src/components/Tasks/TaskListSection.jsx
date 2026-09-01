import TaskItem from "./TaskItem";
export default function TaskListSection({ icon, title, iconClass, tasks, emptyText, onToggle, onDelete }) {
  return (
    <section className="bg-white border border-[#c4c5d9] rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_-4px_rgba(28,28,23,0.05)]">
      <div className="flex items-center gap-2 mb-6">
        <span className={`material-symbols-outlined text-[22px] ${iconClass}`}>
          {icon}
        </span>
        <h2 className="font-display text-2xl font-bold text-[#1c1c17]">
          {title}
        </h2>
      </div>
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-xs text-[#747688] italic py-2">
            {emptyText}
          </p>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}/>
          ))
        )}
      </div>
    </section>
  );
}