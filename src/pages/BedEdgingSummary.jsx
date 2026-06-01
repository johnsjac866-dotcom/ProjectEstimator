import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-2 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function Note({ children }) {
  return <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 mt-2">⚠️ {children}</div>;
}

const OBSTRUCTION_NOTE = "Check for tree roots, pipes, or other obstructions within top three inches of soil";

export default function BedEdgingSummary() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [area, setArea] = useState(null);
  const [project, setProject] = useState(null);
  const [entry, setEntry] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const opId = urlParams.get("opId");

  useEffect(() => {
    (async () => {
      const a = await base44.entities.Area.get(areaId);
      setArea(a);
      const ops = parseOps(a.bed_edging_data);
      const found = opId ? ops.find(o => o.id === opId) : ops[ops.length - 1];
      setEntry(found || null);
      const p = await base44.entities.Project.get(a.project_id);
      setProject(p);
    })();
  }, [areaId, opId]);

  if (!area || !entry) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const { edge_type } = entry;

  return (
    <div className="max-w-lg">
      <Link to={`/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Area
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Bed Edging Summary</p>
          <h1 className="text-2xl font-bold tracking-tight">{edge_type}</h1>
          {project && <p className="text-sm text-muted-foreground mt-0.5">{project.name} · {area.name}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/bed-edging-wizard/${areaId}?opId=${entry.id}`)}>
          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
        </Button>
      </div>

      <div className="rounded-xl border p-4 space-y-0">
        <Row label="Edge Type" value={edge_type} />

        {edge_type === "Brick" && <>
          <Row label="Width" value={entry.brick_width} />
          <Row label="Linear Feet — Straight" value={entry.brick_lf_straight} />
          <Row label="Linear Feet — Curved" value={entry.brick_lf_curved} />
          <Row label="Color" value={entry.brick_color} />
          <Row label="Ends cut to reduce gaps?" value={entry.brick_ends_cut} />
          <Note>{OBSTRUCTION_NOTE}</Note>
        </>}

        {edge_type === "Metal" && <>
          <Row label="Metal Type" value={entry.metal_type} />
          <Row label="Linear Feet" value={entry.metal_lf} />
          <Row label="Corners" value={entry.metal_corners} />
          <Row label="Splicers" value={entry.metal_splicers} />
          <Note>{OBSTRUCTION_NOTE}</Note>
          <Note>Cannot do with rolling topography</Note>
        </>}

        {edge_type === "Bullet" && <>
          <Row label="Linear Feet" value={entry.bullet_lf} />
          <Row label="Color" value={entry.bullet_color} />
          <Note>{OBSTRUCTION_NOTE}</Note>
        </>}

        {edge_type === "Natural Edge" && <>
          <Row label="Method" value={entry.natural_method} />
          <Row label="Linear Feet" value={entry.natural_lf} />
        </>}

        {edge_type === "Poly" && <>
          <Row label="Linear Feet" value={entry.poly_lf} />
          <Row label="Corners — 90°" value={entry.poly_corners_90} />
          <Row label="Corners — 45°" value={entry.poly_corners_45} />
          <Row label="Splicers" value={entry.poly_splicers} />
          <Note>{OBSTRUCTION_NOTE}</Note>
        </>}

        {edge_type === "Snapped Limestone" && <>
          <Row label="Linear Feet" value={entry.snapped_lf} />
          <Row label="Ends cut to reduce gaps?" value={entry.snapped_ends_cut} />
          <Row label="Corners" value={entry.snapped_corners} />
          <Row label="Splicers" value={entry.snapped_splicers} />
          <Note>{OBSTRUCTION_NOTE}</Note>
        </>}

        {entry.notes && <Row label="Notes" value={entry.notes} />}
      </div>
    </div>
  );
}