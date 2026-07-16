import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Droplets, HeartPulse, Activity, TrendingUp, BookOpen, Package, Plane, StickyNote, Menu, X, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/ThemeContext";

const navItems = [
  { path: "/", label: "Today", icon: Home },
  { path: "/exchanges", label: "Exchanges", icon: Droplets },
  { path: "/vitals", label: "Vitals", icon: HeartPulse },
  { path: "/symptoms", label: "Symptoms", icon: Activity },
  { path: "/trends", label: "Trends", icon: TrendingUp },
  { path: "/journal", label: "Journal", icon: BookOpen },
  { path: "/notes", label: "Notes", icon: StickyNote },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/travel", label: "Travel", icon: Plane },
];

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, cycle } = useTheme();
  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  const handleLogout = () => { base44.auth.logout("/login"); };

  return (
    <div className="min-h-screen bg-background">
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b px-4 h-14 flex items-center justify-between">
        <h1 className="font-heading text-lg font-semibold text-foreground">PD Companion</h1>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-secondary">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-14 right-0 w-56 bg-card border-l shadow-xl rounded-bl-2xl p-3 max-h-[calc(100vh-3.5rem)] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {navItems.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${location.pathname === item.path ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <item.icon size={18} />{item.label}
              </Link>
            ))}
            <button onClick={cycle} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground w-full border-t pt-4">
              <ThemeIcon size={18} /><span className="capitalize">{theme}</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground w-full mt-2">
              <LogOut size={18} />Log out
            </button>
          </div>
        </div>
      )}

      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 flex-col border-r bg-card/50 p-4">
        <div className="mb-8 px-2">
          <h1 className="font-heading text-xl font-bold text-foreground">PD Companion</h1>
          <p className="text-xs text-muted-foreground mt-1">Peritoneal Dialysis</p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${location.pathname === item.path ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
              <item.icon size={18} />{item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={cycle} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground w-full">
            <ThemeIcon size={18} />
            <span className="capitalize">{theme}</span>
          </button>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
          <LogOut size={18} />Log out
        </button>
      </aside>

      <main className="md:ml-56 pt-16 md:pt-0 min-h-screen">
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t z-40">
        <div className="flex justify-around py-2">
          {navItems.filter(i => ["/", "/exchanges", "/vitals", "/symptoms", "/notes"].includes(i.path)).map(item => (
            <Link key={item.path} to={item.path}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${location.pathname === item.path ? "text-primary" : "text-muted-foreground"}`}>
              <item.icon size={20} />{item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}