import { Outlet, Link, useLocation } from "react-router-dom";
import { HardHat, FolderOpen } from "lucide-react";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 font-heading text-lg font-bold text-primary">
            <HardHat className="h-6 w-6 text-amber-600" />
            <span>PatioScope</span>
          </Link>
          <nav className="ml-8 flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname === "/" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-1.5"><FolderOpen className="h-4 w-4" /> Projects</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}