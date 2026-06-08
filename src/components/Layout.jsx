import { Outlet, Link, useLocation } from "react-router-dom";
import { HardHat, FolderOpen, Settings } from "lucide-react";
import SyncStatusIndicator from "@/components/SyncStatusIndicator.jsx";

export default function Layout() {
  const location = useLocation();

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
    >
      {/* Sticky header with safe-area-inset-top */}
      <header
        className="border-b border-border bg-card sticky top-0 z-50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-4 h-14 flex items-center gap-4 max-w-screen-xl mx-auto w-full">
          <Link
            to="/"
            className="flex items-center gap-2 font-heading text-lg font-bold text-primary no-select"
          >
            <HardHat className="h-6 w-6 text-amber-600" />
            <span className="hidden sm:inline">Project Estimator</span>
            <span className="sm:hidden">Estimator</span>
          </Link>
          <nav className="ml-4 flex items-center gap-1 flex-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 h-9 rounded-md text-sm font-medium transition-colors no-select ${
                location.pathname === "/"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              <span>Projects</span>
            </Link>
          </nav>
          <Link
            to="/settings"
            className={`flex items-center justify-center h-9 w-9 rounded-md transition-colors no-select ${
              location.pathname === "/settings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <SyncStatusIndicator />
      {/* Main scrollable content area */}
      <main
        className="flex-1 scroll-container overflow-y-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="px-4 py-6 max-w-screen-xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}