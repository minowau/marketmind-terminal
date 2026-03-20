import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Menu,
  X,
  TrendingUp,
  LogOut
} from "lucide-react";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  isMobile: boolean;
  toggle: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarState>({
  collapsed: false,
  mobileOpen: false,
  isMobile: false,
  toggle: () => {},
  toggleMobile: () => {},
  closeMobile: () => {},
});
export const useSidebarState = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        mobileOpen,
        isMobile,
        toggle: () => setCollapsed((c) => !c),
        toggleMobile: () => setMobileOpen((o) => !o),
        closeMobile: () => setMobileOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/news", icon: Newspaper, label: "News" },
  { to: "/signals", icon: Signal, label: "Signals" },
  { to: "/simulation", icon: FlaskConical, label: "Simulation" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { collapsed, isMobile } = useSidebarState();
  const location = useLocation();
  const showLabel = isMobile || !collapsed;

  return (
    <nav className="flex-1 space-y-1 px-2 py-3">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <RouterNavLink key={item.to} to={item.to} onClick={onNavigate}>
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
              {showLabel && <span>{item.label}</span>}
            </div>
          </RouterNavLink>
        );
      })}
    </nav>
  );
}

export function AppSidebar({ onLogout }: { onLogout?: () => void }) {
  const { collapsed, toggle, mobileOpen, closeMobile, isMobile } = useSidebarState();

  // Mobile: overlay drawer
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 top-0 z-50 h-screen w-60 flex flex-col border-r border-border bg-sidebar"
            >
              <div className="flex h-14 items-center justify-between border-b border-white/5 px-4 bg-black/20">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-white antialiased">
                  MARKET<span className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]">MIND</span> <span className="text-[10px] text-muted-foreground/40 font-bold tracking-tighter ml-1">AI</span>
                </span>
                <button onClick={closeMobile} className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SidebarNav onNavigate={closeMobile} />
              
              {/* Mobile Logout */}
              {onLogout && (
                <div className="mt-auto border-t border-white/5 p-4 bg-black/20">
                  <button 
                    onClick={() => {
                      onLogout();
                      closeMobile();
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Exit Terminal</span>
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: fixed sidebar
  return (
    <motion.aside
      animate={{ width: collapsed ? 60 : 200 }}
      transition={{ duration: 0.2 }}
      className="fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-white/5 bg-sidebar"
    >
      <div className="flex h-14 items-center gap-3 border-b border-white/5 px-4 overflow-hidden bg-black/20">
        {!collapsed ? (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[10px] font-black uppercase tracking-[0.25em] text-white whitespace-nowrap antialiased"
          >
            MARKET<span className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]">MIND</span> <span className="text-[8px] text-muted-foreground/40 font-bold tracking-tighter">AI</span>
          </motion.span>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 border border-primary/20 mx-auto">
             <span className="text-[10px] font-black text-primary">M</span>
          </div>
        )}
      </div>
      <SidebarNav />

      {/* Desktop Logout Area */}
      {onLogout && (
        <div className="mt-auto border-t border-white/5 py-2 overflow-hidden bg-black/5">
          <button 
            onClick={onLogout}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-destructive/10",
              collapsed ? "justify-center text-destructive/40 hover:text-destructive" : "text-destructive"
            )}
            title={collapsed ? "Exit Terminal" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="font-bold antialiased">Exit Terminal</span>}
          </button>
        </div>
      )}

      <button
        onClick={toggle}
        className="flex h-10 items-center justify-center border-t border-white/5 text-muted-foreground hover:text-foreground transition-colors bg-black/20"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </motion.aside>
  );
}

import SearchBar from "./SearchBar";

export function AppHeader() {
  const { isMobile, toggleMobile } = useSidebarState();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-3 md:px-6">
      <div className="flex items-center gap-2">
        {isMobile && (
          <button onClick={toggleMobile} className="p-1.5 rounded bg-muted hover:bg-accent transition-colors">
            <Menu className="h-4 w-4 text-foreground" />
          </button>
        )}
        <SearchBar />
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex items-center gap-1.5 text-xs text-success">
          <Wifi className="h-3.5 w-3.5" />
          <span className="font-mono hidden sm:inline">LIVE</span>
        </div>
        <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
          AI
        </div>
      </div>
    </header>
  );
}
