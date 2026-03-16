import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Newspaper,
  Signal,
  FlaskConical,
  Settings,
  Activity,
  Search,
  Wifi,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/news", icon: Newspaper, label: "News" },
  { to: "/signals", icon: Signal, label: "Signals" },
  { to: "/simulation", icon: FlaskConical, label: "Simulation" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 60 : 200 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-border bg-sidebar"
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        <Activity className="h-6 w-6 shrink-0 text-primary" />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-bold tracking-tight text-foreground"
          >
            MarketMind
          </motion.span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <RouterNavLink key={item.to} to={item.to}>
              <div
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-0 h-full w-[3px] rounded-r-sm bg-primary"
                    transition={{ duration: 0.2 }}
                  />
                )}
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
            </RouterNavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-10 items-center justify-center border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </motion.aside>
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search symbol..."
            className="h-8 w-56 rounded-md border border-border bg-muted pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-success">
          <Wifi className="h-3.5 w-3.5" />
          <span className="font-mono">LIVE</span>
        </div>
        <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
          AI
        </div>
      </div>
    </header>
  );
}
