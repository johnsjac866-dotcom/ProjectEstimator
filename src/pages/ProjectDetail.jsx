import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Projects as OfflineProjects, Areas as OfflineAreas } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, ArrowLeft, ChevronRight, Layers, MapPin, Trash2, Pencil, Check, X } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [areaName, setAreaName] = useState("");
  const [editingField, setEditingField] = useState(null); // 'name' | 'address'
  const [editValue, setEditValue] = useState("");
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editingAreaName, setEditingAreaName] = useState("");

  useEffect(() => { load(); }, [projectId]);

  const { pulling, refreshing } = usePullToRefresh(load);

  async function load() {
    const [p, a] = await Promise.all([
      OfflineProjects.get(projectId),
      OfflineAreas.getByProjectId(projectId),
    ]);
    setProject(p);

    // Deduplicate SM areas in case duplicates already exist
    const smAreas = a.filter(x => x.name === "Site Management & Daily Cleanup");
    let deduped = a;
    if (smAreas.length > 1) {
      // Keep first, delete the rest
      for (const dup of smAreas.slice(1)) {
        await OfflineAreas.delete(dup.id);
      }
      deduped = a.filter(x => x.name !== "Site Management & Daily Cleanup" || x.id === smAreas[0].id);
    }
    setAreas(deduped);
    setLoading(false);

    // Auto-create Site Management only once per project
    const smKey = `sm_created_${projectId}`;
    const hasSM = deduped.some(x => x.name === "Site Management & Daily Cleanup");
    if (hasSM) {
      localStorage.setItem(smKey, "1");
    } else if (!localStorage.getItem(smKey)) {
      localStorage.setItem(smKey, "1");
      await OfflineAreas.create({
        project_id: projectId,
        name: "Site Management & Daily Cleanup",
        operation_type: "Site Management & Daily Cleanup",
        status: "Not Started",
      });
      const updated = await OfflineAreas.getByProjectId(projectId);
      setAreas(updated);
    }
  }

  async function handleCreateArea() {
    await OfflineAreas.create({ project_id: projectId, name: areaName, status: "Not Started" });
    setAreaName("");
    setOpen(false);
    load();
  }

  function startEdit(field) {
    setEditingField(field);
    setEditValue(project[field] || "");
  }

  async function saveEdit() {
    await OfflineProjects.update(projectId, { [editingField]: editValue });
    setProject(p => ({ ...p, [editingField]: editValue }));
    setEditingField(null);
  }

  function startEditArea(e, area) {
    e.preventDefault();
    e.stopPropagation();
    setEditingAreaId(area.id);
    setEditingAreaName(area.name);
  }

  async function saveAreaName(e, id) {
    e.preventDefault();
    e.stopPropagation();
    if (!editingAreaName.trim()) return;
    await OfflineAreas.update(id, { name: editingAreaName });
    setAreas(prev => prev.map(a => a.id === id ? { ...a, name: editingAreaName } : a));
    setEditingAreaId(null);
  }

  async function handleDeleteArea(e, id) {
    e.preventDefault();
    e.stopPropagation();
    await OfflineAreas.delete(id);
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!project) return <div className="text-center py-20 text-muted-foreground">Project not found</div>;

  return (
    <div className="overscroll-none">
      <PullToRefreshIndicator pulling={pulling} refreshing={refreshing} />
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 py-2 pr-2">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div className="space-y-1">
          {/* Editable Name */}
          {editingField === "name" ? (
            <div className="flex items-center gap-2">
              <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} className="text-xl font-bold h-9 w-64" onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingField(null); }} />
              <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-700"><Check className="h-4 w-4" /></button>
              <button onClick={() => setEditingField(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <button onClick={() => startEdit("name")} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"><Pencil className="h-3.5 w-3.5" /></button>
            </div>
          )}
          {project.client_name && <p className="text-muted-foreground text-sm">{project.client_name}</p>}
          {/* Editable Address */}
          {editingField === "address" ? (
            <div className="flex items-center gap-2">
              <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} className="h-8 text-sm w-64" onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingField(null); }} />
              <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-700"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => setEditingField(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">{project.address || "Add address..."}</p>
              <button onClick={() => startEdit("address")} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"><Pencil className="h-3 w-3" /></button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/estimation-summary/${projectId}`)}>
            Estimation Summary
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/project-summary/${projectId}`)}>
            View Summary
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Area</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Area</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Area Name *</Label><Input value={areaName} onChange={e => setAreaName(e.target.value)} placeholder="e.g. Back Patio, Front Walkway" /></div>
              <Button onClick={handleCreateArea} disabled={!areaName} className="w-full">Add Area</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {areas.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Layers className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No areas yet. Add an area to start configuring operations.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map(a => (
            <Link key={a.id} to={`/area/${a.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    {editingAreaId === a.id ? (
                      <div className="flex items-center gap-1 flex-1" onClick={e => e.preventDefault()}>
                        <Input
                          autoFocus
                          value={editingAreaName}
                          onChange={e => setEditingAreaName(e.target.value)}
                          className="h-7 text-sm flex-1"
                          onKeyDown={e => {
                            if (e.key === "Enter") saveAreaName(e, a.id);
                            if (e.key === "Escape") { e.stopPropagation(); setEditingAreaId(null); }
                          }}
                        />
                        <button onClick={e => saveAreaName(e, a.id)} className="text-emerald-600 hover:text-emerald-700"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingAreaId(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <CardTitle className="text-base flex-1">{a.name}</CardTitle>
                    )}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {editingAreaId !== a.id && (
                        <button onClick={e => startEditArea(e, a)} className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={(e) => handleDeleteArea(e, a.id)} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {a.operation_type && <span className="text-sm text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{a.operation_type}</span>}
                  <span className={`inline-block ml-2 text-sm px-2 py-0.5 rounded-full ${a.status === "Complete" ? "bg-emerald-100 text-emerald-700" : a.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>{a.status || "Not Started"}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}