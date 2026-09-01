export default function ToastWarning({ warningMessage }) {
  if (!warningMessage) return null;
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white shadow-lg transition-all">
      {warningMessage}
    </div>
  );
}