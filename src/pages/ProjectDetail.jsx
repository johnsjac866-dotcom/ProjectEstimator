import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, ArrowLeft, ChevronRight, Layers, MapPin, Trash2, Pencil, Check, X } from "lucide-react";

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

  useEffect(() => { load(); }, [projectId]);

  async function load() {
    const [p, a] = await Promise.all([
      base44.entities.Project.get(projectId),
      base44.entities.Area.filter({ project_id: projectId }),
    ]);
    setProject(p);
    // Auto-create Site Management area if it doesn't exist
    const hasSM = a.some(x => x.name === "Site Management & Daily Cleanup");
    if (!hasSM) {
      await base44.entities.Area.create({
        project_id: projectId,
        name: "Site Management & Daily Cleanup",
        operation_type: "Site Management & Daily Cleanup",
        status: "Not Started",
      });
      const updated = await base44.entities.Area.filter({ project_id: projectId });
      setAreas(updated);
    } else {
      setAreas(a);
    }
    setLoading(false);
  }

  async function handleCreateArea() {
    await base44.entities.Area.create({ project_id: projectId, name: areaName, status: "Not Started" });
    setAreaName("");
    setOpen(false);
    load();
  }

  function startEdit(field) {
    setEditingField(field);
    setEditValue(project[field] || "");
  }

  async function saveEdit() {
    await base44.entities.Project.update(projectId, { [editingField]: editValue });
    setProject(p => ({ ...p, [editingField]: editValue }));
    setEditingField(null);
  }

  async function handleDeleteArea(e, id) {
    e.preventDefault();
    e.stopPropagation();
    await base44.entities.Area.delete(id);
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!project) return <div className="text-center py-20 text-muted-foreground">Project not found</div>;

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>
      <div className="flex items-start justify-between mb-6">
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
              <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} className="h-7 text-xs w-64" onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingField(null); }} />
              <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-700"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => setEditingField(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <p className="text-muted-foreground text-xs">{project.address || "Add address..."}</p>
              <button onClick={() => startEdit("address")} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"><Pencil className="h-3 w-3" /></button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/estimation-summary/${projectId}`)}>
            Estimation Summary
          </Button>
          <Button variant="outline" onClick={() => navigate(`/project-summary/${projectId}`)}>
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
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{a.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => handleDeleteArea(e, a.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {a.operation_type && <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{a.operation_type}</span>}
                  <span className={`inline-block ml-2 text-xs px-2 py-0.5 rounded-full ${a.status === "Complete" ? "bg-emerald-100 text-emerald-700" : a.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>{a.status || "Not Started"}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}