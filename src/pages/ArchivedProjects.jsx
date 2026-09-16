import { useState, useEffect } from "react";
import { supabaseEntity } from "@/lib/supabaseEntities";
import { Link, useNavigate } from "react-router-dom";

const ProjectSdk = supabaseEntity("projects");
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, ChevronRight, FileText, Trash2, ArchiveRestore, FolderOpen, Search, ArrowLeft } from "lucide-react";

export default function ArchivedProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await ProjectSdk.list("-created_date");
    setProjects(data.filter(p => p.status === "Archived"));
    setLoading(false);
  }

  async function handleUnarchive(e, p) {
    e.preventDefault();
    e.stopPropagation();
    await ProjectSdk.update(p.id, { status: "Active" });
    load();
  }

  async function handleDelete(e, projectId) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this project permanently? This cannot be undone.")) return;
    await ProjectSdk.delete(projectId);
    load();
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.client_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.address || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 py-2 pr-2">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Archived Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects.length} archived project{projects.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search archived projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>{search ? "No projects match your search." : "No archived projects."}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => (
            <div key={p.id} className="relative">
              <Link to={`/project/${p.id}`}>
                <Card className="hover:shadow-md active:shadow-sm transition-shadow cursor-pointer group opacity-80">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </div>
                    {p.client_name && <CardDescription>{p.client_name}</CardDescription>}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {p.address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{p.address}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Archived</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.preventDefault(); navigate(`/project-summary/${p.id}`); }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-2 rounded-md hover:bg-muted"
                        >
                          <FileText className="h-3.5 w-3.5" /> Summary
                        </button>
                        <button
                          onClick={(e) => handleUnarchive(e, p)}
                          className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors p-2 rounded-md hover:bg-primary/10"
                          title="Restore to Active"
                        >
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, p.id)}
                          className="flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors p-2 rounded-md hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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