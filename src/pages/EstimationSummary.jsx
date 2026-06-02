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
  { label: "Site Management & Daily Cleanup (Non-Taxable)",           taxable: false, dataKey: "site_mgmt_data",     match: e => !!e.tax_status_nontaxable || e.tax_status === "Non-Taxable" },
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
  { label: "Site Management & Daily Cleanup (Taxable)",              taxable: true,  dataKey: "site_mgmt_data",     match: e => !!e.tax_status_taxable || e.tax_status === "Taxable" },
];

// Map a single entry to its human-readable key fields for display
function fmt(label, val) { return val ? `${label}: ${val}` : null; }
function entryDescription(dataKey, entry) {
  if (dataKey === "demolition_data") {
    const sub = entry.sub_type ? entry.sub_type.replace(/_/g, " ") : "";
    return [sub, fmt("SF", entry.sf), fmt("CY", entry.cy), fmt("LF", entry.lf), entry.item_notes ? `Notes: ${entry.item_notes}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "rough_grading_data") {
    const sub = entry.sub_type ? entry.sub_type.replace(/_/g, " ") : "";
    return [sub, fmt("SF", entry.sf), fmt("CY", entry.cy), fmt("CY (fluff)", entry.cy_fluff), entry.depth_in ? `Depth: ${entry.depth_in}"` : null, entry.notes ? `Notes: ${entry.notes}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "drainage_data") {
    const sub = entry.sub_type || entry.drainage_type || "";
    return [sub, fmt("LF", entry.lf), fmt("SF", entry.sf), fmt("Pipe Dia.", entry.pipe_diameter), fmt("Basin Qty", entry.basin_qty), entry.notes ? `Notes: ${entry.notes}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "patio_data") {
    const sub = entry.sub_type || entry.patio_type || "";
    return [sub, fmt("SF", entry.sf), fmt("Material", entry.material), fmt("Pattern", entry.pattern), fmt("Base Depth", entry.base_depth), entry.notes ? `Notes: ${entry.notes}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "site_mgmt_data") {
    const taxParts = [
      (entry.tax_status_nontaxable || entry.tax_status === "Non-Taxable") ? "Non-Taxable" : null,
      (entry.tax_status_taxable || entry.tax_status === "Taxable") ? "Taxable" : null,
    ].filter(Boolean);
    const tax = taxParts.length ? `Tax: ${taxParts.join(" & ")}` : null;
    // Collect notable items
    const items = [];
    if (entry.street_occupancy_permit) items.push("Street Permit");
    if (entry.job_box) items.push("Job Box");
    if (entry.jobsite_trailer) items.push("Jobsite Trailer");
    if (entry.porta_potty) items.push("Porta Potty");
    if (entry.ground_protection) items.push("Ground Protection");
    if (entry.tree_protection) items.push("Tree Protection");
    if (entry.silt_fence) items.push("Silt Fence");
    if (entry.erosion_logs) items.push("Erosion Logs");
    if (entry.parking_coordination) items.push(`Parking Coord. (${entry.parking_days || "?"}d)`);
    if (entry.moving_items) items.push(`Moving Items (${entry.moving_items_hours || "?"}hrs)`);
    if (entry.remove_reinstall) items.push("Remove & Reinstall");
    return [tax, items.join(", ")].filter(Boolean).join(" · ");
  }
  if (dataKey === "bed_prep_data") {
    const sub = entry.sub_type ? entry.sub_type.replace(/_/g, " ") : "";
    const cat = entry.category ? entry.category.replace(/_/g, " ") : "";
    return [cat, sub, fmt("SF", entry.sf), fmt("Depth", entry.depth), entry.risk_factor ? `Risk: ${entry.risk_factor}` : null, entry.notes ? `Notes: ${entry.notes}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "planting_data") {
    const cat = entry.plant_category || "";
    const sub = entry.sub_type || entry.plant_type || "";
    return [cat, sub,
      entry.count ? `Qty: ${entry.count}` : null,
      entry.size ? `Size: ${entry.size}` : null,
      entry.spacing ? `Spacing: ${entry.spacing}"` : null,
      entry.notes ? `Notes: ${entry.notes}` : null,
    ].filter(Boolean).join(" · ");
  }
  if (dataKey === "bed_edging_data") {
    const sub = entry.sub_type || entry.edge_type || "";
    return [sub, fmt("LF", entry.lf), fmt("Color", entry.color), fmt("Height", entry.height), entry.notes ? `Notes: ${entry.notes}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "mulch_data") {
    const sub = entry.sub_type || entry.mulch_type || "";
    return [sub, fmt("SF", entry.sf), fmt("CY", entry.cy), fmt("Depth", entry.depth), fmt("Color/Type", entry.color_type), entry.notes ? `Notes: ${entry.notes}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "lawn_data") {
    const sub = entry.sub_type || entry.lawn_type || "";
    return [sub, fmt("SF", entry.sf), fmt("Rolls", entry.rolls), fmt("Pallets", entry.pallets), fmt("Pins", entry.pins), entry.on_slope ? "On Slope" : null, entry.notes ? `Notes: ${entry.notes}` : null].filter(Boolean).join(" · ");
  }
  if (dataKey === "boulders_data") {
    const sub = entry.sub_type || "";
    if (sub === "Boulders / Accents") return [
      entry.count_24_30 ? `24-30": ${entry.count_24_30}` : null,
      entry.count_18_24 ? `18-24": ${entry.count_18_24}` : null,
      entry.count_12_18 ? `12-18": ${entry.count_12_18}` : null,
      entry.notes ? `Notes: ${entry.notes}` : null,
    ].filter(Boolean).join(" · ");
    if (sub === "Structures - Fence") return [fmt("LF", entry.lf), entry.height ? `Height: ${entry.height}ft` : null, fmt("Material", entry.material), entry.notes ? `Notes: ${entry.notes}` : null].filter(Boolean).join(" · ");
    if (sub === "Structures - Arbor") return [fmt("Count", entry.count), fmt("Material", entry.material), fmt("Size", entry.size), entry.notes ? `Notes: ${entry.notes}` : null].filter(Boolean).join(" · ");
    if (sub === "Raised Garden Bed") return [fmt("Qty", entry.quantity), fmt("SF", entry.total_sf), fmt("CY", entry.total_cy), fmt("Material", entry.material), entry.notes ? `Notes: ${entry.notes}` : null].filter(Boolean).join(" · ");
    return sub;
  }
  return entry.sub_type || entry.type || "";
}

// Aggregate totals from entries in a category bucket
function totalsFromEntries(dataKey, entries) {
  let sf = 0, cy = 0, lf = 0, rolls = 0, pallets = 0, pins = 0;
  let hasSF = false, hasCY = false, hasLF = false, hasRolls = false, hasPallets = false, hasPins = false;
  entries.forEach(e => {
    const sfVal = parseFloat(e.sf || e.treatment_sf || e.total_sf || 0);
    const cyVal = parseFloat(e.cy || e.cy_fluff || e.total_cy || 0);
    const lfVal = parseFloat(e.lf || 0);
    const rollsVal = parseFloat(e.rolls || 0);
    const palletsVal = parseFloat(e.pallets || 0);
    const pinsVal = parseFloat(e.pins || 0);
    if (sfVal) { sf += sfVal; hasSF = true; }
    if (cyVal) { cy += cyVal; hasCY = true; }
    if (lfVal) { lf += lfVal; hasLF = true; }
    if (rollsVal) { rolls += rollsVal; hasRolls = true; }
    if (palletsVal) { pallets += palletsVal; hasPallets = true; }
    if (pinsVal) { pins += pinsVal; hasPins = true; }
  });
  // For boulders, total by size
  let b2430 = 0, b1824 = 0, b1218 = 0;
  if (dataKey === "boulders_data") {
    entries.forEach(e => {
      b2430 += parseFloat(e.count_24_30 || 0);
      b1824 += parseFloat(e.count_18_24 || 0);
      b1218 += parseFloat(e.count_12_18 || 0);
    });
  }
  const parts = [];
  if (hasSF) parts.push(`${parseFloat(sf.toFixed(1))} SF`);
  if (hasCY) parts.push(`${parseFloat(cy.toFixed(2))} CY`);
  if (hasLF) parts.push(`${parseFloat(lf.toFixed(1))} LF`);
  if (hasRolls) parts.push(`${parseFloat(rolls.toFixed(0))} Rolls`);
  if (hasPallets) parts.push(`${parseFloat(pallets.toFixed(0))} Pallets`);
  if (hasPins) parts.push(`${parseFloat(pins.toFixed(0))} Pins`);
  if (dataKey === "boulders_data") {
    if (b2430) parts.push(`24-30": ${b2430}`);
    if (b1824) parts.push(`18-24": ${b1824}`);
    if (b1218) parts.push(`12-18": ${b1218}`);
  }
  return parts.join("  ·  ");
}

// Get a grouping key (human-readable sub-type label) for an entry
function getSubTypeKey(dataKey, entry) {
  if (dataKey === "demolition_data") return entry.sub_type ? entry.sub_type.replace(/_/g, " ") : "Other";
  if (dataKey === "rough_grading_data") return entry.sub_type ? entry.sub_type.replace(/_/g, " ") : "Other";
  if (dataKey === "drainage_data") return entry.sub_type || entry.drainage_type || "Other";
  if (dataKey === "patio_data") return entry.sub_type || entry.patio_type || "Other";
  if (dataKey === "site_mgmt_data") return "Site Management";
  if (dataKey === "bed_prep_data") {
    const cat = entry.category ? entry.category.replace(/_/g, " ") : "";
    const sub = entry.sub_type ? entry.sub_type.replace(/_/g, " ") : "";
    return [cat, sub].filter(Boolean).join(" — ") || "Other";
  }
  if (dataKey === "planting_data") return entry.plant_category || entry.sub_type || "Other";
  if (dataKey === "bed_edging_data") return entry.sub_type || entry.edge_type || "Other";
  if (dataKey === "mulch_data") return entry.sub_type || entry.mulch_type || "Other";
  if (dataKey === "lawn_data") return entry.sub_type || entry.lawn_type || "Other";
  if (dataKey === "boulders_data") return entry.sub_type || "Other";
  return "Other";
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
                      {(() => {
                        const subKeys = [...new Set(cat.rows.map(r => getSubTypeKey(cat.dataKey, r.entry)))];
                        return subKeys.length > 1 ? <span className="ml-2">· {subKeys.length} sub-types</span> : null;
                      })()}
                      {totals ? <span className="ml-2 font-medium text-foreground">{totals}</span> : null}
                    </p>
                  </div>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t bg-muted/20">
                    {/* Group by sub-type first, then by area within each sub-type */}
                    {(() => {
                      // Build: { subTypeKey → { entries: [{area,entry}], label } }
                      const subGroups = {};
                      cat.rows.forEach(({ area, entry }) => {
                        const key = getSubTypeKey(cat.dataKey, entry);
                        if (!subGroups[key]) subGroups[key] = { label: key, rows: [] };
                        subGroups[key].rows.push({ area, entry });
                      });
                      const subGroupEntries = Object.entries(subGroups);
                      const multipleSubTypes = subGroupEntries.length > 1;

                      return subGroupEntries.map(([subKey, { label, rows }]) => {
                        const subTotal = totalsFromEntries(cat.dataKey, rows.map(r => r.entry));
                        // Group rows by area within this sub-type
                        const byArea = rows.reduce((acc, { area, entry }) => {
                          if (!acc[area.id]) acc[area.id] = { area, entries: [] };
                          acc[area.id].entries.push(entry);
                          return acc;
                        }, {});

                        return (
                          <div key={subKey} className={multipleSubTypes ? "border-t first:border-t-0" : ""}>
                            {multipleSubTypes && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-muted/40">
                                <span className="text-xs font-bold text-foreground">{label}</span>
                                {subTotal && <span className="text-xs text-muted-foreground">— {subTotal}</span>}
                              </div>
                            )}
                            <div className="divide-y">
                              {Object.entries(byArea).map(([areaId, { area, entries }]) => {
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
                          </div>
                        );
                      });
                    })()}
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