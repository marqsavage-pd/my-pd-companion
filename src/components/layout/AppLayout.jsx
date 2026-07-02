import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Pill, Activity, TrendingUp, BookOpen, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/", label: "Today", icon: Home },
  { path: "/symptoms", label: "Symptoms", icon: Activity },
  { path: "/medications", label: "Meds", icon: Pill },
  { path: "/exercise", label: "Exercise", icon: Activity },
  { path: "/trends", label: "Trends", icon: TrendingUp },
  { path: "/journal", label: "Journal", icon: BookOpen },
];

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b px-4 h-14 flex items-center justify-between">
        <h1 className="font-heading text-lg font-semibold text-foreground">PD Companion</h1>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-secondary">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-14 right-0 w-56 bg-card border-l shadow-xl rounded-bl-2xl p-3" onClick={e => e.stopPropagation()}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground w-full mt-2 border-t pt-4">
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 flex-col border-r bg-card/50 p-4">
        <div className="mb-8 px-2">
          <h1 className="font-heading text-xl font-bold text-foreground">PD Companion</h1>
          <p className="text-xs text-muted-foreground mt-1">Your daily wellness partner</p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
          <LogOut size={18} />
          Log out
        </button>
      </aside>

      {/* Main content */}
      <main className="md:ml-56 pt-16 md:pt-0 min-h-screen">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t z-40">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}