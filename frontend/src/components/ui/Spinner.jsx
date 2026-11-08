export default function Spinner({ label = "Loading...", className = "" }) {
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 py-16 text-slate-500 ${className}`}>
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
