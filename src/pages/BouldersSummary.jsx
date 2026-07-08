import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Flag, AlertTriangle } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

function SummaryRow({ label, value, isFlagged }) {
  const hasVal = value !== null && value !== undefined && value !== '';
  return (
    <div className={`flex justify-between py-1.5 border-b last:border-0 text-sm ${isFlagged ? 'bg-orange-50 rounded px-2 -mx-2' : ''}`}>
      <span className="text-muted-foreground flex items-center gap-1.5">
        {isFlagged && <Flag className="h-3 w-3 text-orange-500" fill="currentColor" />}
        {label}
      </span>
      <span className={`font-medium text-right max-w-[60%] ${!hasVal && isFlagged ? 'text-orange-600 italic' : !hasVal ? 'text-muted-foreground/50 italic' : ''}`}>
        {hasVal ? String(value) : isFlagged ? 'Missing — needs review' : '— not set'}
      </span>
    </div>
  );
}

export default function BouldersSummary() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const opId = new URLSearchParams(window.location.search).get("opId");
  const from = new URLSearchParams(window.location.search).get("from");
  const [area, setArea] = useState(null);
  const [project, setProject] = useState(null);
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    (async () => {
      const a = await OfflineAreas.get(areaId);
      setArea(a);
      const p = await OfflineProjects.get(a.project_id);
      setProject(p);
      const ops = parseOps(a.boulders_data);
      setEntry(ops.find(o => o.id === opId) || ops[0] || null);
    })();
  }, [areaId, opId]);

  if (!entry) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const subType = entry.sub_type || "";
  const flagSet = new Set(entry._flags || []);

  return (
    <div className="max-w-lg">
      <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Boulders/Accents & Structures</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{project?.name} — {area?.name}</p>
          <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">{subType}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/boulders-wizard/${areaId}?opId=${opId || entry.id}`)}>
          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
        </Button>
      </div>

      {flagSet.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-300 text-orange-800 text-sm mb-4">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">{flagSet.size} flagged item{flagSet.size !== 1 ? 's' : ''} need{flagSet.size === 1 ? 's' : ''} attention.</span>
          <span className="text-orange-600">Click Edit to go straight to the first flagged item.</span>
        </div>
      )}

      <div className="rounded-xl border p-4 space-y-0.5">
        <SummaryRow label="Time Estimate (hrs)" value={entry.time_estimate} isFlagged={flagSet.has('time_estimate')} />

        {subType === "Boulders / Accents" && (<>
          <SummaryRow label='Count 24" – 30"' value={entry.count_24_30} isFlagged={flagSet.has('count_24_30')} />
          <SummaryRow label='Count 18" – 24"' value={entry.count_18_24} isFlagged={flagSet.has('count_18_24')} />
          <SummaryRow label='Count 12" – 18"' value={entry.count_12_18} isFlagged={flagSet.has('count_12_18')} />
          <SummaryRow label="Color Preference" value={entry.color_preference} isFlagged={flagSet.has('color_preference')} />
          <SummaryRow label="Ball Cart Needed?" value={entry.ball_cart_needed} isFlagged={flagSet.has('ball_cart_needed')} />
          <SummaryRow label="Dump Trailer Needed?" value={entry.dump_trailer_needed} isFlagged={flagSet.has('dump_trailer_needed')} />
          <SummaryRow label="Machine Access" value={entry.machine_access} isFlagged={flagSet.has('machine_access')} />
          <SummaryRow label="Supplier" value={entry.delivery_supplier} isFlagged={flagSet.has('delivery_supplier')} />
          {entry.delivery_supplier === "Special Order" && (
            <SummaryRow label="Special Order Details" value={entry.delivery_special_order} isFlagged={flagSet.has('delivery_special_order')} />
          )}
          <SummaryRow label="Constraints / Hazards" value={entry.constraints} isFlagged={flagSet.has('constraints')} />
        </>)}

        {subType === "Structures - Fence" && (<>
          <SummaryRow label="Linear Feet" value={entry.lf ? `${entry.lf} LF` : null} isFlagged={flagSet.has('lf')} />
          <SummaryRow label="Height" value={entry.height ? `${entry.height} ft` : null} isFlagged={flagSet.has('height')} />
          <SummaryRow label="Gate Count" value={entry.gate_count} isFlagged={flagSet.has('gate_count')} />
          <SummaryRow label="Gate Width" value={entry.gate_width ? `${entry.gate_width} ft` : null} isFlagged={flagSet.has('gate_width')} />
          <SummaryRow label='Cedar 2x2" (count)' value={entry.fence_cedar_2x2} isFlagged={flagSet.has('fence_cedar_2x2')} />
          <SummaryRow label="4x4x8' Rough Sawn Cedar" value={entry.fence_cedar_4x4} isFlagged={flagSet.has('fence_cedar_4x4')} />
          <SummaryRow label="Fasteners" value={entry.fence_fasteners} isFlagged={flagSet.has('fence_fasteners')} />
          <SummaryRow label="Post Spacing" value={entry.post_spacing ? `${entry.post_spacing} ft` : null} isFlagged={flagSet.has('post_spacing')} />
          <SummaryRow label="Hand or Machine" value={entry.fence_dig_mode} isFlagged={flagSet.has('fence_dig_mode')} />
          {entry.fence_dig_mode === "Machine" && (
            <SummaryRow label="Machine Type" value={entry.fence_machine_type} isFlagged={flagSet.has('fence_machine_type')} />
          )}
          <SummaryRow label="Dig Post Holes (hrs)" value={entry.fence_dig_hours} isFlagged={flagSet.has('fence_dig_hours')} />
        </>)}

        {subType === "Structures - Arbor" && (<>
          <SummaryRow label="Count" value={entry.count} isFlagged={flagSet.has('count')} />
          <SummaryRow label="Length" value={entry.length ? `${entry.length} ft` : null} isFlagged={flagSet.has('length')} />
          <SummaryRow label="Height" value={entry.height ? `${entry.height} ft` : null} isFlagged={flagSet.has('height')} />
          <SummaryRow label="Width" value={entry.width ? `${entry.width} ft` : null} isFlagged={flagSet.has('width')} />
          <SummaryRow label="Footing Size / Depth" value={entry.footing} isFlagged={flagSet.has('footing')} />
          <SummaryRow label="Material" value={entry.material} isFlagged={flagSet.has('material')} />
          <SummaryRow label="Hand or Machine" value={entry.arbor_dig_mode} isFlagged={flagSet.has('arbor_dig_mode')} />
          {entry.arbor_dig_mode === "Machine" && (
            <SummaryRow label="Machine Type" value={entry.arbor_machine_type} isFlagged={flagSet.has('arbor_machine_type')} />
          )}
          <SummaryRow label="Dig Post Holes (hrs)" value={entry.arbor_dig_hours} isFlagged={flagSet.has('arbor_dig_hours')} />
          <SummaryRow label="Needs Level Pad?" value={entry.needs_level_pad} isFlagged={flagSet.has('needs_level_pad')} />
          <SummaryRow label="Remove Count" value={entry.remove_count} isFlagged={flagSet.has('remove_count')} />
        </>)}

        {subType === "Raised Garden Bed" && (<>
          <SummaryRow label="Material" value={entry.material} isFlagged={flagSet.has('material')} />
          <SummaryRow label="Quantity" value={entry.quantity} isFlagged={flagSet.has('quantity')} />
          <SummaryRow label="Length" value={entry.length ? `${entry.length} ft` : null} isFlagged={flagSet.has('length')} />
          <SummaryRow label="Width" value={entry.width ? `${entry.width} ft` : null} isFlagged={flagSet.has('width')} />
          <SummaryRow label="Total SF" value={entry.total_sf ? `${entry.total_sf} SF` : null} isFlagged={false} />
          <SummaryRow label="Soil Depth" value={entry.soil_depth ? `${entry.soil_depth} in` : null} isFlagged={flagSet.has('soil_depth')} />
          <SummaryRow label="Soil Volume" value={entry.total_cy ? `${entry.total_cy} CY` : null} isFlagged={false} />
          <SummaryRow label="Base Level?" value={entry.base_level} isFlagged={flagSet.has('base_level')} />
          <SummaryRow label="Machine Access" value={entry.machine_access} isFlagged={flagSet.has('machine_access')} />
        </>)}

        <SummaryRow label="Notes" value={entry.notes} isFlagged={flagSet.has('notes')} />
      </div>
    </div>
  );
}