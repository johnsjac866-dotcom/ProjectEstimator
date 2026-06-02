import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, MapPin, ChevronDown, ChevronRight } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

// ─── Ordered estimation categories ────────────────────────────────────────────
// Each category: { label, taxable, dataKey, match(entry) → bool }
// "match" maps an operation entry to this category bucket.

const CATEGORY_ORDER = [
  // ── NON-TAXABLE ──
  { label: "Hardscape - Demolition & Removals",                       taxable: false, dataKey: "demolition_data",    match: e => e.group === "hardscape" },
  { label: "Rough Grading - Excavation & Hauling",                    taxable: false, dataKey: "rough_grading_data", match: e => ["excavation_hand","excavation_machine"].includes(e.sub_type) },
  { label: "Rough Grading - Soil Importation and Spreading",          taxable: false, dataKey: "rough_grading_data", match: e => ["importation_hand","importation_machine"].includes(e.sub_type) },
  { label: "Drainage",                                                 taxable: false, dataKey: "drainage_data",      match: () => true },
  { label: "Walkway / Patio",                                         taxable: false, dataKey: "patio_data",         match: () => true },
  { label: "Structures - Fencing/Arbors/Gazebos/Pavilions, Etc",     taxable: false, dataKey: "boulders_data",      match: e => ["Structures - Fence","Structures - Arbor"].includes(e.sub_type) },
  { label: "Site Management & Daily Cleanup (Non-Taxable)",           taxable: false, dataKey: "site_mgmt_data",     match: () => true },
  // ── TAXABLE ──
  { label: "Demolition & Removals - Vegetation & Softscape Items",   taxable: true,  dataKey: "demolition_data",    match: e => e.group === "vegetation" },
  { label: "Bed Preparation - Planting Bed",                         taxable: true,  dataKey: "bed_prep_data",      match: e => ["till","no_till","reprofiling"].includes(e.main_type) },
  { label: "Bed Preparation - Lawn",                                  taxable: true,  dataKey: "bed_prep_data",      match: e => e.main_type === "lawn" },
  { label: "Planting - Trees and Shrubs",                            taxable: true,  dataKey: "planting_data",      match: e => e.plant_category === "Trees & Shrubs" },
  { label: "Planting - Boulders / Accents",                          taxable: true,  dataKey: "boulders_data",      match: e => e.sub_type === "Boulders / Accents" },
  { label: "Bed Edging",                                              taxable: true,  dataKey: "bed_edging_data",    match: () => true },
  { label: "Raised Vegetable Bed(s)",                                taxable: true,  dataKey: "boulders_data",      match: e => e.sub_type === "Raised Garden Bed" },
  { label: "Mulch",                                                   taxable: true,  dataKey: "mulch_data",         match: () => true },
  { label: "Planting - Perennials",                                  taxable: true,  dataKey: "planting_data",      match: e => e.plant_category === "Perennials" },
  { label: "Planting - Bulbs",                                       taxable: true,  dataKey: "planting_data",      match: e => e.plant_category === "Bulbs" },
  { label: "Lawn Repair & Install",                                  taxable: true,  dataKey: "lawn_data",          match: () => true },
  { label: "Site Management & Daily Cleanup (Taxable)",              taxable: true,  dataKey: "site_mgmt_data",     match: () => false }, // placeholder for future
];

// Map a single entry to its human-readable key fields for display
function entryDescription(dataKey, entry) {
  if (dataKey === "demolition_data") {
    const subLabel = entry.sub_type ? entry.sub_type.replace(/_/g, " ") : "";
    return [
      subLabel,
      entry.sf ? `SF: ${entry.sf}` : null,
      entry.lf ? `LF: ${entry.lf}` : null,
    ].filter(Boolean).join(" · ");
  }
  if (dataKey === "rough_grading_data") {
    return [
      entry.sub_type ? entry.sub_type.replace(/_/g, " ") : "",
      entry.sf ? `SF: ${entry.sf}` : null,
      entry.cy ? `CY: ${entry.cy}` : null,
      entry.cy_fluff ? `CY (fluff): ${entry.cy_fluff}` : null,
    ].filter(Boolean).join(" · ");
  }
  if (dataKey === "drainage_data") {
    return [entry.sub_type || entry.drainage_type || "", entry.lf ? `LF: ${entry.lf}` : null, entry.sf ? `SF: ${entry.sf}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "patio_data") {
    return [entry.sub_type || entry.patio_type || "", entry.sf ? `SF: ${entry.sf}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "site_mgmt_data") {
    return entry.sub_type || entry.type || "";
  }
  if (dataKey === "bed_prep_data") {
    const subLabel = entry.sub_type ? entry.sub_type.replace(/_/g, " ") : "";
    return [subLabel, entry.sf ? `SF: ${entry.sf}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "planting_data") {
    return [entry.plant_category || "", entry.sub_type || ""].filter(Boolean).join(" · ");
  }
  if (dataKey === "bed_edging_data") {
    return [entry.sub_type || entry.edge_type || "", entry.lf ? `LF: ${entry.lf}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "mulch_data") {
    return [entry.sub_type || entry.mulch_type || "", entry.sf ? `SF: ${entry.sf}` : null, entry.cy ? `CY: ${entry.cy}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "lawn_data") {
    return [entry.sub_type || entry.lawn_type || "", entry.sf ? `SF: ${entry.sf}` : null, entry.rolls ? `Rolls: ${entry.rolls}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "boulders_data") {
    const sub = entry.sub_type || "";
    if (sub === "Boulders / Accents") return [`24-30": ${entry.count_24_30 || 0}`, `18-24": ${entry.count_18_24 || 0}`, `12-18": ${entry.count_12_18 || 0}`].join(" · ");
    if (sub === "Structures - Fence") return [`LF: ${entry.lf || "—"}`, `Height: ${entry.height || "—"}ft`].join(" · ");
    if (sub === "Structures - Arbor") return [`Count: ${entry.count || "—"}`, `Material: ${entry.material || "—"}`].join(" · ");
    if (sub === "Raised Garden Bed") return [`Qty: ${entry.quantity || "—"}`, entry.total_sf ? `SF: ${entry.total_sf}` : null, entry.total_cy ? `CY: ${entry.total_cy}` : null].filter(Boolean).join(" · ");
    return sub;
  }
  return entry.sub_type || entry.type || "";
}

// Aggregate SF/CY/LF totals from entries in a category bucket
function totalsFromEntries(dataKey, entries) {
  let sf = 0, cy = 0, lf = 0;
  let hasSF = false, hasCY = false, hasLF = false;
  entries.forEach(e => {
    const sfVal = parseFloat(e.sf || e.treatment_sf || e.total_sf || 0);
    const cyVal = parseFloat(e.cy || e.cy_fluff || e.total_cy || 0);
    const lfVal = parseFloat(e.lf || 0);
    if (sfVal) { sf += sfVal; hasSF = true; }
    if (cyVal) { cy += cyVal; hasCY = true; }
    if (lfVal) { lf += lfVal; hasLF = true; }
  });
  const parts = [];
  if (hasSF) parts.push(`${sf.toFixed(1)} SF`);
  if (hasCY) parts.push(`${cy.toFixed(2)} CY`);
  if (hasLF) parts.push(`${lf.toFixed(1)} LF`);
  return parts.join("  ·  ");
}

export default function EstimationSummary() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    (async () => {
      const [p, a] = await Promise.all([
        base44.entities.Project.get(projectId),
        base44.entities.Area.filter({ project_id: projectId }),
      ]);
      setProject(p);
      setAreas(a);
      setLoading(false);
    })();
  }, [projectId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!project) return <div className="text-center py-20 text-muted-foreground">Project not found</div>;

  // Build category → [{area, entry}] map
  const buckets = CATEGORY_ORDER.map(cat => {
    const rows = [];
    areas.forEach(area => {
      const ops = parseOps(area[cat.dataKey]);
      ops.forEach(entry => {
        if (cat.match(entry)) rows.push({ area, entry });
      });
    });
    return { ...cat, rows };
  }).filter(cat => cat.rows.length > 0);

  const nonTaxable = buckets.filter(b => !b.taxable);
  const taxable = buckets.filter(b => b.taxable);

  function toggleCat(label) {
    setExpanded(e => ({ ...e, [label]: !e[label] }));
  }

  function renderSection(title, sectionBuckets, headerColor) {
    if (sectionBuckets.length === 0) return null;
    return (
      <div className="mb-8">
        <div className={`flex items-center gap-3 mb-3`}>
          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${headerColor}`}>{title}</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-2">
          {sectionBuckets.map(cat => {
            const isOpen = expanded[cat.label];
            const totals = totalsFromEntries(cat.dataKey, cat.rows.map(r => r.entry));
            return (
              <div key={cat.label} className="border rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => toggleCat(cat.label)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{cat.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat.rows.length} entr{cat.rows.length !== 1 ? "ies" : "y"}
                      {totals ? <span className="ml-2 font-medium text-foreground">{totals}</span> : null}
                    </p>
                  </div>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t divide-y bg-muted/20">
                    {/* Group by area */}
                    {Object.entries(
                      cat.rows.reduce((acc, { area, entry }) => {
                        if (!acc[area.id]) acc[area.id] = { area, entries: [] };
                        acc[area.id].entries.push(entry);
                        return acc;
                      }, {})
                    ).map(([areaId, { area, entries }]) => {
                      const areaTotal = totalsFromEntries(cat.dataKey, entries);
                      return (
                        <div key={areaId} className="px-4 py-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            {area.name}
                            {areaTotal ? <span className="ml-2 normal-case font-medium text-foreground">{areaTotal}</span> : null}
                          </p>
                          <div className="space-y-1 ml-2">
                            {entries.map((entry, idx) => (
                              <div key={entry.id || idx} className="text-xs bg-background rounded-lg px-3 py-1.5 border text-muted-foreground">
                                {entryDescription(cat.dataKey, entry) || `Entry #${idx + 1}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/project/${projectId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </Link>

      <div className="mb-8 pb-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight">{project.name} — Estimation Summary</h1>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
          {project.client_name && <span>{project.client_name}</span>}
          {project.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.address}</span>}
          <span>{areas.length} area{areas.length !== 1 ? "s" : ""} · {buckets.reduce((s, b) => s + b.rows.length, 0)} total entries</span>
        </div>
      </div>

      {buckets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <p className="font-medium">No operations configured yet</p>
          <p className="text-sm mt-1">Configure operations in each area to see the estimation summary</p>
        </div>
      ) : (
        <>
          {renderSection("Non-Taxable", nonTaxable, "bg-slate-100 text-slate-700")}
          {renderSection("Taxable", taxable, "bg-amber-100 text-amber-700")}
        </>
      )}
    </div>
  );
}