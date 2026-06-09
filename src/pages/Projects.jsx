import { useState, useEffect } from "react";
import { Projects as OfflineProjects } from "@/lib/offlineStore";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MapPin, ChevronRight, FolderOpen, FileText, Trash2, Search, Archive, MoreVertical, CheckCircle, Circle, MinusCircle } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";

const TABS = ["All", "Active", "Completed", "Inactive"];

const STATUS_COLORS = {
  Active: "bg-emerald-100 text-emerald-700",
  Completed: "bg-blue-100 text-blue-700",
  Inactive: "bg-amber-100 text-amber-700",
  Archived: "bg-muted text-muted-foreground",
};

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", client_name: "", address: "", notes: "" });
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => { loadProjects(); }, []);
  const { pulling, refreshing } = usePullToRefresh(loadProjects);

  async function loadProjects() {
    const data = await OfflineProjects.list();
    setProjects(data.filter(p => p.status !== "Archived"));
    setLoading(false);
  }

  async function handleCreate() {
    await OfflineProjects.create({ ...form, status: "Active" });
    setForm({ name: "", client_name: "", address: "", notes: "" });
    setOpen(false);
    loadProjects();
  }

  async function handleDelete(e, projectId) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this project and all its data? This cannot be undone.")) return;
    await OfflineProjects.delete(projectId);
    loadProjects();
  }

  async function handleSetStatus(e, projectId, status) {
    e.preventDefault();
    e.stopPropagation();
    await OfflineProjects.update(projectId, { status });
    loadProjects();
  }

  const filtered = projects.filter(p => {
    const matchesTab = tab === "All" || p.status === tab;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.client_name || "").toLowerCase().includes(q) ||
      (p.address || "").toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="overscroll-none">
      <PullToRefreshIndicator pulling={pulling} refreshing={refreshing} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your landscaping site visits</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/archived-projects")}>
            <Archive className="h-4 w-4 mr-1.5" /> Archived
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> New</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label>Project Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Smith Residence" /></div>
                <div><Label>Client Name</Label><Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
                <div><Label>Site Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
                <Button onClick={handleCreate} disabled={!form.name} className="w-full">Create Project</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t}
            <span className="ml-1.5 text-xs opacity-70">
              {t === "All" ? projects.length : projects.filter(p => p.status === t).length}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>{search || tab !== "All" ? "No projects match your filters." : "No projects yet. Create your first project to get started."}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => (
            <div key={p.id} className="relative">
              <Link to={`/project/${p.id}`}>
                <Card className="hover:shadow-md active:shadow-sm transition-shadow cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{p.name}</CardTitle>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-0.5" />
                    </div>
                    {p.client_name && <CardDescription>{p.client_name}</CardDescription>}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {p.address && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="h-3 w-3 flex-shrink-0" />{p.address}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status] || STATUS_COLORS.Inactive}`}>
                        {p.status}
                      </span>
                      <div className="flex items-center gap-0.5" onClick={e => e.preventDefault()}>
                        <button
                          onClick={(e) => { e.preventDefault(); navigate(`/project-summary/${p.id}`); }}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-2 rounded-md hover:bg-muted"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={e => handleSetStatus(e, p.id, "Active")} disabled={p.status === "Active"}>
                              <Circle className="h-3.5 w-3.5 mr-2 text-emerald-600" /> Set Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => handleSetStatus(e, p.id, "Completed")} disabled={p.status === "Completed"}>
                              <CheckCircle className="h-3.5 w-3.5 mr-2 text-blue-600" /> Set Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => handleSetStatus(e, p.id, "Inactive")} disabled={p.status === "Inactive"}>
                              <MinusCircle className="h-3.5 w-3.5 mr-2 text-amber-600" /> Set Inactive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={e => handleSetStatus(e, p.id, "Archived")}>
                              <Archive className="h-3.5 w-3.5 mr-2" /> Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={e => handleDelete(e, p.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}