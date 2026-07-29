import { RefreshCw } from "lucide-react";

export default function RefreshButton({ onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center disabled:opacity-60"
      aria-label="Refresh dashboard">
      <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
    </button>
  );
}