import { useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { HardHat, FolderOpen, Settings, ChevronLeft, Archive } from "lucide-react";
import SyncStatusIndicator from "@/components/SyncStatusIndicator.jsx";

// Routes considered "root" screens (show brand, no back button)
const ROOT_PATHS = ["/", "/settings", "/archived-projects"];

// Bottom tab definitions
const TABS = [
  { path: "/", label: "Projects", icon: FolderOpen },
  { path: "/archived-projects", label: "Archived", icon: Archive },
  { path: "/settings", label: "Settings", icon: Settings },
];

// Map child routes back to a human-readable parent title
function getBackTitle(pathname) {
  if (pathname.startsWith("/project/")) return "Projects";
  if (pathname.startsWith("/area/")) return "Project";
  if (
    pathname.includes("-wizard/") ||
    pathname.includes("-summary/") ||
    pathname.includes("patio-") ||
    pathname.includes("site-management-") ||
    pathname.includes("bed-prep-") ||
    pathname.includes("rough-grading-") ||
    pathname.includes("demolition-") ||
    pathname.includes("bed-edging-") ||
    pathname.includes("planting-") ||
    pathname.includes("mulch-") ||
    pathname.includes("drainage-") ||
    pathname.includes("lawn-") ||
    pathname.includes("boulders-") ||
    pathname.includes("hardscape-repair-") ||
    pathname.includes("maintenance-") ||
    pathname.includes("stepping-stone-") ||
    pathname.includes("retaining-wall-")
  ) return "Area";
  if (pathname.startsWith("/project-summary/") || pathname.startsWith("/estimation-summary/")) return "Project";
  return "Back";
}

// System dark mode detection — run once on mount
function useDarkMode() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (dark) => {
      document.documentElement.classList.toggle("dark", dark);
    };
    apply(mq.matches);
    mq.addEventListener("change", (e) => apply(e.matches));
    return () => mq.removeEventListener("change", (e) => apply(e.matches));
  }, []);
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  useDarkMode();

  const isRoot = ROOT_PATHS.includes(location.pathname);
  const backTitle = getBackTitle(location.pathname);

  // Which tab is "active" — match by prefix for child screens
  const activeTab = TABS.find(t => {
    if (t.path === "/") return location.pathname === "/" || (!TABS.slice(1).some(o => location.pathname.startsWith(o.path)) && !ROOT_PATHS.includes(location.pathname));
    return location.pathname.startsWith(t.path);
  })?.path ?? "/";

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
    >
      {/* Dynamic header */}
      <header
        className="border-b border-border bg-card sticky top-0 z-50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-xl mx-auto w-full">
          {isRoot ? (
            /* Brand on root screens */
            <Link
              to="/"
              className="flex items-center gap-2 font-heading text-lg font-bold text-primary no-select"
            >
              <HardHat className="h-6 w-6 text-amber-600" />
              <span className="hidden sm:inline">Project Estimator</span>
              <span className="sm:hidden">Estimator</span>
            </Link>
          ) : (
            /* Back button on child screens */
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-primary font-medium no-select -ml-1 px-2 py-1 rounded-md hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">{backTitle}</span>
            </button>
          )}
        </div>
      </header>

      <SyncStatusIndicator />

      {/* Main scrollable content */}
      <main className="flex-1 scroll-container overflow-y-auto">
        <div className="px-4 py-6 max-w-screen-xl mx-auto w-full" style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}>
          <Outlet />
        </div>
      </main>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map(({ path, label, icon: Icon }) => {
          const isActive = activeTab === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={(e) => {
                // Re-selecting active root tab resets to root
                if (isActive && location.pathname !== path) {
                  e.preventDefault();
                  navigate(path, { replace: true });
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors no-select ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}