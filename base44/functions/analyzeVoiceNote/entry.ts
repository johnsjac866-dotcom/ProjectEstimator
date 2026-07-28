import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Prompt sections for each operation type ──────────────────────────────────
const PROMPT_RG = `For Rough Grading & Hauling operations, extract:
- sub_type: One of "excavation_hand", "excavation_machine", "importation_hand", "importation_machine"
  Choose "excavation_hand" if removing/exporting soil by hand (wheelbarrows, hand digging)
  Choose "excavation_machine" if using a machine (Vermeer/Dingo) to excavate and export
  Choose "importation_hand" if bringing in soil and spreading by hand
  Choose "importation_machine" if bringing in soil and spreading with a machine
- rg_fields: object with all extracted form field values:
  Common (all types): time_estimate (hrs), sf_length (ft), sf_width (ft), depth_inches (in), notes
  excavation_hand: distance_to_parking (ft), dump_trailer_needed ("Yes"/"No"), ramps_needed (count), sod_vegetation_removed ("Yes"/"No"), disposal_needed ("Yes"/"No"), disposal_location ("Mandt - 2079 Hwy MM, Fitchburg"/"Homburg - 5715 Milwaukee St, Madison" if disposal needed), store_on_site ("Yes"/"No"), grading_plan_required ("Yes"/"No")
  excavation_machine: machine_type ("Vermeer"/"Dingo"), hydraulic_tiller ("Yes"/"No" if Dingo), rock_hound ("Yes"/"No" if Dingo), machine_access_width (ft), sod_vegetation_removed ("Yes"/"No"), disposal_needed ("Yes"/"No"), disposal_material_type ("Gravel"/"Rock"/"Sand"/"Topsoil"/"Clay" if disposal needed), disposal_dry_wet ("Dry"/"Wet" if disposal needed), disposal_fees (array of fee strings if disposal needed), surface_protection ("Yes"/"No"), utilities_checked ("Confirmed"/"Not Yet Checked"), grading_plan_required ("Yes"/"No")
  importation_hand: time_estimate (hrs), carry_distance (ft), soil_types (array of "Fill Soil (for rough grading)"/"Garden Mix (topsoil/compost)"/"Topsoil (Unscreened for rough grading)"/"Coarse / Washed Sand"), dump_trailer_needed ("Yes"/"No"), ramps_needed (count), grading_plan_required ("Yes"/"No")
  importation_machine: time_estimate (hrs), machine_type ("Vermeer"/"Dingo"), machine_access_width (ft), soil_types (array of types listed above), dump_trailer_needed ("Yes"/"No"), ramps_needed (count), surface_protection ("Yes"/"No"), utilities_checked ("Confirmed"/"Not Yet Checked"), grading_plan_required ("Yes"/"No")`;

const PROMPT_BED_PREP = `For Bed Preparation operations, extract:
- bed_main_type: One of "till", "no_till", "lawn", "reprofiling"
- bed_sub_type: One of "till_1in", "till_3in", "notill_hand", "notill_machine", "notill_deadsod", "lawn_none", "lawn_1in", "repro_hardscape", "repro_narrow", "repro_sloped", "repro_soil"
  Choose based on context: if lawn prep with 1 inch amendments -> "lawn_1in", no amendments -> "lawn_none", till with 1" amendments -> "till_1in", etc.
- sf_length: Length in feet (number)
- sf_width: Width in feet (number)
For TILL (till_1in, till_3in) also extract:
- till_tilling_mode: "Hand" or "Machine"
- till_hand_tiller_type: "16 Hand Tiller" or "FG 110 Hand Tiller" (if hand)
- till_hand_tiller_hours: Unit hours (number, if hand)
- till_machine_type: "Dingo" or "Vermeer" (if machine)
- till_hydraulic_tiller: "Yes" or "No" (if machine)
- remove_rock_hours: Hours to remove rock/debris/roots (number)
- fertilizer_hours: Hours for fertilizer (number)
- chicken_crumbles: "Yes" or "No"
- amend_amendment_type: "Topsoil" or "Compost"
- finish_bed_hours: Hours to finish bed by hand (number)
For LAWN (lawn_none, lawn_1in) also extract:
- lawn_tilling_mode: "Hand" or "Machine"
- lawn_hand_tiller_type: "16 Hand Tiller" or "FG 110 Hand Tiller" (if hand)
- lawn_hand_tiller_hours: Unit hours (number, if hand)
- lawn_machine_type: "Dingo" or "Vermeer" (if machine)
- lawn_hydraulic_tiller: "Yes" or "No" (if machine)
- fertilizer_hours: Hours for fertilizer (number)
- finish_bed_hours: Hours to finish bed by hand (number)
- amend_amendment_type: "Topsoil" or "Compost" (for lawn_1in only)
- amend_amendment_depth_in: Amendment depth in inches (number, for lawn_1in only)
For NO TILL HAND (notill_hand) also extract:
- slope_distance_hours: Additional time for slopes/distance/challenges (number)
For NO TILL MACHINE (notill_machine) also extract:
- notill_machine_type: "Vermeer" or "Dingo"
For REPROFILING (repro_*) also extract:
- repro_tilling: "Yes" or "No"
- repro_till_tilling_mode: "Hand" or "Machine" (if tilling)
- repro_till_hand_tiller_type: "16 Hand Tiller" or "FG 110 Hand Tiller" (if hand)
- repro_till_hand_tiller_hours: Unit hours (number, if hand)
- repro_till_machine_type: "Dingo" or "Vermeer" (if machine)
- repro_till_hydraulic_tiller: "Yes" or "No" (if machine)
- remove_rock_hours: Hours to remove rock/debris/roots (number)
- repro_amendments: "Yes" or "No"
- repro_amend_amendment_type: "Topsoil" or "Compost" (if amendments)
- repro_amend_amendment_depth_in: Amendment depth in inches (number, if amendments)
- repro_chicken_crumbles: "Yes" or "No" (if amendments)
- fertilizer_hours: Hours for fertilizer (number)
- finish_bed_hours: Hours to finish bed by hand (number)`;

const PROMPT_MULCH = `For Mulch operations, extract:
- mulch_type: "Organic" or "Stone"
- mulch_fields: object with all extracted form field values:
  Common (all types): time_estimate (hrs), length (ft), width (ft), depth (in), bed_type, machine_access ("Vermeer"/"Dingo"/"None")
  Organic: install_type ("Refresh"/"Full Install"), organic_subtype ("Shredded Hardwood"/"Dyed"/"Red Cedar"), distance_to_truck (ft)
  Stone: fabric_needed ("Yes"/"No"), fabric_sf`;

const PROMPT_PLANTING = `For Planting operations, extract:
- planting_type: One of "Trees & Shrubs", "Perennials", "Bulbs", "Annuals"
- planting_fields: object with all extracted form field values:
  Common (all types): time_estimate (hrs), additional_time_rocky ("Yes"/"No"), additional_time_roots ("Yes"/"No"), notes
  Trees & Shrubs: trees (array of {type, count, size}), shrubs (array of {type, count, size}), mycorrhizae_tablets (count), hand_vs_machine ("Hand"/"Machine"), machine_type ("Vermeer"/"Dingo" if machine), ball_cart ("Yes"/"No"), tree_sling ("Yes"/"No"), tree_boom ("Yes"/"No"), ramps (count), stake_kit ("Yes"/"No"), cage ("Yes"/"No"), mulch_ring ("Yes"/"No"), haul_off_debris ("Yes"/"No"), watering_hours, watering_days, water_access ("Yes"/"No"), delivery_by ("By Aspen"/"By Others"), box_truck ("Yes"/"No"), flatbed ("Yes"/"No"), forklift ("Yes"/"No")
  Perennials: large_plants (array of {name, count}), large_spacing, small_plants (array of {name, count}), small_spacing, bed_condition ("Unprepared bed"/"Prepared bed"), mycorrhizae_tablets (count), watering_hours, water_access ("Yes"/"No")
  Bulbs: bulbs (array of {name, count}), mulched_soil ("Yes"/"No"), bulb_fertilizer ("Yes"/"No"), milwaukee_drill ("Yes"/"No"), drill_auger ("Yes"/"No"), bulb_plugger ("Yes"/"No"), cut_weed_barrier ("Yes"/"No"), watering_hours, water_access ("Yes"/"No")
  Annuals: annuals (array of {name, count}), watering_hours, water_access ("Yes"/"No")`;

const PROMPT_BED_EDGING = `For Bed Edging operations, extract ALL fields that are mentioned:
- edge_type: One of "Brick", "Metal", "Bullet", "Natural Edge", "Poly", "Snapped Limestone"
- lf: Total linear feet (number)
BRICK fields:
- lf_straight: Straight linear feet (number)
- lf_curved: Curved linear feet (number)
- brick_width: "4 inch" or "8 inch"
- brick_color: color description (e.g. "Natural", "Red", "Charcoal")
- brick_ends_cut: "Yes" or "No"
- brick_prep_hours: Hours to prep area for brick (number)
- brick_sand_needed: "Yes" or "No"
- brick_cut_off_saw: "Yes" or "No"
- brick_disposal_hours: Hours for disposal of debris/extra brick (number)
METAL fields:
- metal_type: "Aluminum" or "Steel"
- metal_lf: Linear feet (number)
- metal_corners: number of corners (number)
- metal_splicers: number of splicers (number)
- metal_cut_off_saw: "Yes" or "No"
- metal_remove_sod_hours: Hours to remove sod behind edge (number)
BULLET fields:
- bullet_supplier: "Menards" or "Rochester"
- bullet_lf: Linear feet (number)
- bullet_color: color description
- bullet_prep_hours: Hours to prep area (number)
- bullet_permeable_chips: "Yes" or "No"
- bullet_cut_off_saw: "Yes" or "No"
- bullet_disposal_hours: Hours for disposal (number)
NATURAL EDGE fields:
- natural_method: "Hand cut" or "Bed Edger"
- natural_lf: Linear feet (number)
POLY fields:
- poly_lf: Linear feet (number)
- poly_angular_connectors: Number of angular connectors (number)
- poly_remove_sod_hours: Hours to remove sod/soil (number)
SNAPPED LIMESTONE fields:
- snapped_lf: Linear feet (number)
- snapped_ends_cut: "Yes" or "No"
- snapped_sand_needed: "Yes" or "No"
- snapped_prep_hours: Hours to prep area (number)
- snapped_cut_off_saw: "Yes" or "No"
ALL Bed Edging:
- bed_edger_needed: "Yes" or "No" (if mentioned)`;

const PROMPT_BOULDERS = `For Boulders/Accents & Structures operations, extract:
- boulders_type: "Boulders / Accents", "Structures - Fence", "Structures - Arbor", or "Raised Garden Bed"
- boulders_fields: object with all extracted fields:
  Boulders: count_24_30, count_18_24, count_12_18 (counts by size range), color_preference, ball_cart_needed ("Yes"/"No"), dump_trailer_needed ("Yes"/"No"), machine_access ("Vermeer"/"Dingo"/"None"), delivery_supplier ("Midwest"/"Madison Block"/"Special Order"), delivery_special_order, constraints
  Fence: lf (linear feet), height (ft), gate_count, gate_width (ft), fence_cedar_2x2 (count), fence_cedar_4x4 (count), fence_fasteners (count), post_spacing (ft), fence_dig_mode ("Hand"/"Machine"), fence_machine_type ("Dingo"/"Vermeer"), fence_dig_hours
  Arbor: count, length (ft), height (ft), width (ft), footing, material, arbor_dig_mode ("Hand"/"Machine"), arbor_machine_type ("Dingo"/"Vermeer"), arbor_dig_hours, needs_level_pad ("Yes"/"No"), remove_count
  Raised Garden Bed: material ("Wood"/"Metal"), quantity, length (ft), width (ft), soil_depth (in), base_level ("Yes"/"No"), machine_access ("Vermeer"/"Dingo"/"None")`;

const PROMPT_LAWN = `For Lawn Repair & Install operations, extract:
- lawn_type: One of "Sod Installation", "Seed Install", "Top Dress Lawn"
  Choose "Seed Install" if the notes mention seeding, overseeding, or installing seed.
  Choose "Sod Installation" if the notes mention laying sod or sod rolls.
  Choose "Top Dress Lawn" if the notes mention top dressing or topdress.
- sf_length: Length in feet (number)
- sf_width: Width in feet (number)
- seed_type: One of "Madison Parks", "Tough Stuff", "Shady Place", "Carefree No Mow" (if mentioned)
- lawn_fields: object with all extracted form field values:
  Common (all types): time_estimate (hrs), length (ft), width (ft)
  Sod Installation: on_slope ("Yes"/"No"), sf_waste, diff_easy_hours, diff_avg_hours, diff_hard_hours, diff_very_hard_hours, sod_staples_needed ("Yes"/"No"), sod_staples_count, pallets_needed ("Yes"/"No"), pallets_count, watering_on_install ("Yes"/"No"), water_access ("Yes"/"No"), watering_time_hours, fertilizer ("Yes"/"No"), fertilizer_sf_override, distance_to_truck (ft), machine_access ("Dingo"/"Vermeer"/"None"), sod_type ("Bluegrass"/"Tall Fescue Blend")
  Seed Install: sf_seed, seed_type ("Madison Parks"/"Shady Place"/"Survivor"), seed_lbs, extra_seed ("Yes"/"No"), cover_method ("Mulch Pellet"/"Straw Netting"), mulch_bags, mulch_buckets, straw_mat_type ("Single Net 60"/"Curlex Doublenet"), straw_rolls, straw_sod_staples, temp_downspout_needed ("Yes"/"No"), temp_downspout_lf, water_access ("Yes"/"No"), fertilizer ("Yes"/"No"), bed_prep_needed ("Yes"/"No")
  Top Dress Lawn: top_dress_depth (in), material ("Compost"/"Soil Blend"), overseed ("Yes"/"No"), aerate ("Yes"/"No")`;

const PROMPT_DEMO = `For Demolition & Removals operations, ONLY create an operation if the voice notes describe tearing out, removing, or demolishing EXISTING hardscape (patios, walls, decks, edging) or vegetation (trees, shrubs, sod, perennials). Do NOT create a Demolition operation for new excavation, grading, or soil removal — that is "Rough Grading & Hauling".

Extract:
- demo_group: "hardscape" or "vegetation"
- demo_sub_type: One of:
  Hardscape: "deck_timber_wall", "patio", "hand_removal_reuse" (brick/flag hand removal for reuse), "stone_retaining_wall"
  Vegetation: "woody_flush_cut", "woody_incl_stumps" (including stumps), "perennials_dig", "perennials_herbicide", "transplant_direct", "transplant_dig_hold" (hold above ground), "herbicide_cut_treat", "strip_sod", "landscape_edging", "stone_mulch", "weed_fabric", "wood_mulch", "misc_items"
- sf_length, sf_width: dimensions in feet (for deck_timber_wall, patio, strip_sod, stone_mulch, wood_mulch)
- depth_inches: depth in inches (for strip_sod, stone_mulch, wood_mulch)
- demo_fields: object with all other extracted form field values. Possible keys:
  machine_use ("Yes"/"No"), machine_type ("Dingo"/"Vermeer"), disposal_needed ("Yes"/"No"), disposal_location, disposal_method, dumpster_needed ("Yes"/"No"), distance_to_truck (ft), pallets_needed, road_gravel_tons, thickness (in), thickness_base (in), removal_of_base ("Yes"/"No"), hydraulic_tiller ("Yes"/"No"), skil_saw ("Yes"/"No"), recip_saw ("Yes"/"No"), existing_material, drainage_rock_below ("Yes"/"No"), drainage_rock_depth, drainage_rock_sf, remove_backfill_hrs, patio_material ("Concrete"/"Asphalt"/"Paver"/"Flagstone"), breaker_hammer ("Yes"/"No"), mandt_type, scope_quantity, pallet_count, reuse_storage_plan, lf, width, wall_height, remove_stone_hrs, reuse_vs_disposal ("Reuse"/"Disposal"), chainsaw ("Yes"/"No"), brush_chipper ("Yes"/"No"), stumps_excluded ("Yes"/"No"), time_to_cut, tons_material, loading_tarping_time, round_trip_disposal, time_remove_stump, bucket_stump_ripper ("Yes"/"No"), stump_mature_type, stump_mature_count, stump_large_type, stump_large_count, stump_medium_type, stump_medium_count, stump_small_type, stump_small_count, approx_time_dig, remove_vs_reuse ("Remove"/"Reuse"), dump_location, method ("Hand"/"Machine"), treatment_sf, client_approval ("Yes"/"Not Yet"), treatment_timing, nearby_plantings, plants_list, time_dig_hours, time_replant_hours, fill_holes_hours, watering_on_install ("Yes"/"No"), time_water_1x_hours, root_ball_difficulty, dig_pot_labor_hours, small_pots_count, hold_duration, storage_location, watering_system ("Yes"/"No"), watering_events, time_per_watering, travel_per_watering, replanting_plants ("Yes"/"No"), pm_travel_hours, sod_cutter ("Yes"/"No"), ramps_needed ("Yes"/"No"), obstacle_removal_hours, tilling ("Yes"/"No"), distance_from_truck, removal_labor_hours, edging_type_plastic ("Yes"/"No"), edging_type_brick ("Yes"/"No"), disposition ("Reuse"/"Reinstall"/"Dispose"), disposal_travel_hrs, equip_operator_hours, time_to_remove, trash_bags_fabric ("Yes"/"No"), removal_time, trash_bags_needed ("Yes"/"No"), inorganic_debris_bags ("Yes"/"No"), bags_needed, removal_type ("Full Removal"/"Partial Disturbance"), buried_condition, contamination ("Yes"/"No"), material_type, approx_time`;

const PROMPT_DRAINAGE = `For Drainage operations, ONLY create an operation if the voice notes describe installing drainage systems (buried downspouts, French drains, curtain drains, dry stream beds, catch basins, impervious membranes). Do NOT create a Drainage operation for excavation, grading, or soil removal — that is "Rough Grading & Hauling".

Extract:
- drain_type: One of "Buried Downspout", "Buried Drain", "Buried Sump Line", "Curtain Drain", "French Drain", "Dry Stream Bed", "Impervious Membrane"
- drainage_fields: object with all extracted form field values:
  Common (all except Impervious Membrane): lf (linear feet), excavation_mode ("Machine"/"Hand"), excavation_machine_type ("Vermeer"/"Dingo" if machine), trencher_attachment ("Yes"/"No"), excavation_depth (in), soil_composition (array of "Rubble"/"Dirt"/"Sod"/"Stone"), spoil_type ("Remain on site"/"Hauled off"), disposal_site, sod_removal ("Yes"/"No"), obstruction_hours, zip_level ("Yes"/"No")
  Buried Downspout: pipe_size (in), existing_downspout ("Yes"/"No"), existing_lf, pvc_supplies_needed ("Yes"/"No"), pvc_supplies_count, pvc_fittings_needed ("Yes"/"No"), fit_90_long_turn, fit_90_tight, fit_22_5_elbow, fit_hub_45_elbow, fit_tee, fit_wye, fit_cleanout, downspout_connection_needed ("Yes"/"No"), downspout_connection_size, downspout_connection_count, catch_basin_needed ("Yes"/"No"), catch_basin_size, catch_basin_count, miter_drain ("Yes"/"No"), miter_drain_type ("Heavy duty"/"Light duty"), miter_drain_count, lawn_repair ("Yes"/"No")
  Buried Drain: pipe_size, existing_drain ("Yes"/"No"), existing_lf, catch_basin_needed, catch_basin_size, catch_basin_count, atrium_drain_needed ("Yes"/"No"), atrium_drain_count, pvc_supplies_needed, pvc_supplies_count, pvc_fittings_needed, [fitting counts], miter_drain, miter_drain_type, miter_drain_count, lawn_repair
  Buried Sump Line: pipe_size, existing_downspout, existing_lf, pvc_supplies_needed, pvc_supplies_count, pvc_fittings_needed, [fitting counts], freezedrain_needed ("Yes"/"No"), freezedrain_count, miter_drain, miter_drain_type, miter_drain_count, topsoil_needed ("Yes"/"No"), topsoil_cy, lawn_repair
  Curtain Drain: pipe_size, existing_drain, existing_lf, stone_needed ("Yes"/"No"), fabric_needed ("Yes"/"No"), fabric_sf, sod_disposal_method
  French Drain: pipe_size, existing_drain, existing_lf, corrugated_tile_needed ("Yes"/"No"), tile_perforated_sock_count, tile_solid_count, pvc_cleanout_needed ("Yes"/"No"), pvc_cleanout_count, misc_drainage_needed ("Yes"/"No"), misc_drainage_notes, coarse_sand_needed ("Yes"/"No"), coarse_sand_tons, drainage_rock_needed ("Yes"/"No"), drainage_rock_tons, stone_needed, fabric_needed, fabric_sf
  Dry Stream Bed: width (ft), stream_depth (in), existing_downspout, existing_lf, ball_cart_needed ("Yes"/"No"), boulders_needed ("Yes"/"No"), fieldstone_10_18, fieldstone_18_24, fieldstone_24_30, drainage_rock_needed ("Yes"/"No"), drainage_rock_cy, stone_type, stream_purpose ("Decorative"/"Functional")
  Impervious Membrane: rough_grading_needed ("Yes"/"No"), mem_length, mem_width, mem_depth, excavation_mode, excavation_machine_type, detail_excavation_hours, place_membrane_hours, roofing_membrane_needed ("Yes"/"No"), roofing_membrane_rolls, woven_fabric_needed ("Yes"/"No"), woven_fabric_sf, place_stone_hours, drainage_rock_needed ("Yes"/"No"), drainage_rock_tons, edging_needed ("Yes"/"No"), poly_plastic_needed ("Yes"/"No"), poly_plastic_rolls`;

// ── Router prompt & schema ───────────────────────────────────────────────────
const ROUTER_PROMPT = (notesText) => `You are a landscaping project analyst. Analyze these voice notes and determine EXACTLY which operational categories are explicitly described as required work.

Valid operation categories:
- "Rough Grading & Hauling"
- "Bed Preparation"
- "Mulch"
- "Planting"
- "Bed Edging"
- "Boulders/Accents & Structures"
- "Lawn Repair & Install"
- "Demolition & Removals"
- "Drainage"

RULES:
- ONLY include an operation if the voice notes clearly and specifically describe that work being done.
- If excavation, grading, or soil hauling is mentioned, that is "Rough Grading & Hauling" — do NOT also include Demolition or Drainage for it.
- Demolition is for tearing out/removing EXISTING hardscape or vegetation only.
- Drainage is for installing drainage systems (buried downspouts, French drains, etc.) only.
- When in doubt, do NOT include the operation.

Also extract shared site context that may apply across multiple operations:
- machine_used: What machine (if any) is mentioned for the project? ("Dingo", "Vermeer", "Hand", or null if not mentioned)
- disposal_site: What disposal location is mentioned? (or null if not mentioned)
- general_notes: A 1-2 sentence summary of overall site conditions and scope.

Voice Notes:
${notesText}`;

const ROUTER_SCHEMA = {
  type: 'object',
  properties: {
    detected_operations: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of operation types that are clearly described in the notes'
    },
    global_context: {
      type: 'object',
      properties: {
        machine_used: { type: ['string', 'null'] },
        disposal_site: { type: ['string', 'null'] },
        general_notes: { type: 'string' }
      }
    }
  },
  required: ['detected_operations', 'global_context']
};

// ── Prompt footer (shared by all workers) ────────────────────────────────────
const PROMPT_FOOTER = (notesText, globalContext, targetOps) => `
GLOBAL SITE CONTEXT (extracted from the notes — use these values when relevant and not contradicted by the specific notes):
${JSON.stringify(globalContext || {}, null, 2)}

For ALL operation types, also extract:
- time_estimate: Time in hours mentioned for this operation. Look for phrases like "2 hours", "about 3 hrs", "half a day" (=4hrs), "a full day" (=8hrs), "45 minutes" (=0.75hrs). Null if no time is mentioned.

CRITICAL — MISSING DATA POLICY:
- If the information is NOT explicitly spoken in the transcript, you MUST return null.
- Do NOT infer, assume, or default any values.
- Do NOT use 0, "No", "None", false, or empty strings as defaults for missing information.
- If a field is required by the schema but unknown, return null so the UI can apply a "needs review" flag.
- For boolean/Yes-No fields: use true/"Yes" ONLY if explicitly confirmed, false/"No" ONLY if explicitly denied, and null if not mentioned.
- For number fields: return the stated number, or null if not mentioned. NEVER return 0 as a placeholder.

IMPORTANT RULES:
- ONLY create operations for these types: ${targetOps.join(', ')}
- ONLY create an operation if the voice notes clearly and specifically describe that operation type. When in doubt, do not create the operation.
- Keep the summary to 1-2 concise sentences. Do not repeat information.
- List each key item only once. Be concise — no duplicate or near-duplicate items.

Leave unknown fields null — never guess.

Voice Notes:
${notesText}`;

// ── Worker group configuration ───────────────────────────────────────────────
// Each group maps a set of operation types to its prompt builder and response schema.
// Only groups containing at least one router-detected operation will be invoked.

// ── Schemas for each worker group ────────────────────────────────────────────
const SCHEMA_A = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    key_items: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
    recommended_operations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        properties: {
          operation_type: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          time_estimate: { type: ['number', 'null'] }
        },
        required: ['operation_type', 'description']
      }
    }
  }
};

const SCHEMA_BP = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    key_items: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
    recommended_operations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        properties: {
          operation_type: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          time_estimate: { type: ['number', 'null'] }
        },
        required: ['operation_type', 'description']
      }
    }
  }
};

const SCHEMA_B = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    key_items: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
    recommended_operations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        properties: {
          operation_type: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          time_estimate: { type: ['number', 'null'] }
        },
        required: ['operation_type', 'description']
      }
    }
  }
};

const SCHEMA_C = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    key_items: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
    recommended_operations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        properties: {
          operation_type: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          time_estimate: { type: ['number', 'null'] }
        },
        required: ['operation_type', 'description']
      }
    }
  }
};

const WORKER_GROUPS = [
  {
    name: 'A',
    operations: ['Rough Grading & Hauling', 'Bed Preparation', 'Mulch', 'Bed Edging'],
    buildPrompt: (notesText, ctx, ops) =>
      `You are a landscaping project analyst. Analyze these voice notes and extract a consolidated summary, key insights, recommended operations, and structured data for each operation.\n\nONLY extract these operation types: ${ops.join(', ')}\n\n${PROMPT_RG}\n\n${PROMPT_BED_PREP}\n\n${PROMPT_MULCH}\n\n${PROMPT_BED_EDGING}${PROMPT_FOOTER(notesText, ctx, ops)}`,
    schema: SCHEMA_A
  },
  {
    name: 'BP',
    operations: ['Boulders/Accents & Structures', 'Planting'],
    buildPrompt: (notesText, ctx, ops) =>
      `You are a landscaping project analyst. Analyze these voice notes and extract a consolidated summary, key insights, recommended operations, and structured data for each operation.\n\nONLY extract these operation types: ${ops.join(', ')}\n\n${PROMPT_BOULDERS}\n\n${PROMPT_PLANTING}${PROMPT_FOOTER(notesText, ctx, ops)}`,
    schema: SCHEMA_BP
  },
  {
    name: 'B',
    operations: ['Lawn Repair & Install', 'Demolition & Removals'],
    buildPrompt: (notesText, ctx, ops) =>
      `You are a landscaping project analyst. Analyze these voice notes and extract a consolidated summary, key insights, recommended operations, and structured data for each operation.\n\nONLY extract these operation types: ${ops.join(', ')}\n\n${PROMPT_LAWN}\n\n${PROMPT_DEMO}${PROMPT_FOOTER(notesText, ctx, ops)}`,
    schema: SCHEMA_B
  },
  {
    name: 'C',
    operations: ['Drainage'],
    buildPrompt: (notesText, ctx, ops) =>
      `You are a landscaping project analyst. Analyze these voice notes and extract a consolidated summary, key insights, recommended operations, and structured data for each operation.\n\nONLY extract these operation types: ${ops.join(', ')}\n\n${PROMPT_DRAINAGE}${PROMPT_FOOTER(notesText, ctx, ops)}`,
    schema: SCHEMA_C
  }
];

// ── Deduplication helpers ────────────────────────────────────────────────────
function normalizeText(text) {
  return (text || '').toLowerCase().trim()
    .replace(/(\d)x(\d)/g, '$1 $2')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

function tokenize(text) {
  const normalized = normalizeText(text);
  return normalized.split(' ').filter(w => {
    if (/\d/.test(w)) return true;
    return w.length > 2;
  });
}

function wordOverlap(a, b) {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wordsA = new Set(tokenize(a));
  const wordsB = new Set(tokenize(b));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  return intersection.length / Math.max(wordsA.size, wordsB.size);
}

function dedupeKeyItems(items) {
  const result = [];
  for (const item of items) {
    if (!item || !item.trim()) continue;
    if (!result.some(r => wordOverlap(r, item) > 0.5)) {
      result.push(item.trim());
    }
  }
  return result;
}

function dedupeTags(tags) {
  const seen = new Set();
  const result = [];
  for (const tag of tags) {
    if (!tag || !tag.trim()) continue;
    const normalized = normalizeText(tag);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(tag.trim());
    }
  }
  return result;
}

function countNonEmptyFields(op) {
  let count = 0;
  for (const [key, val] of Object.entries(op)) {
    if (['operation_type', 'description', 'priority', 'estimated_quantity', 'materials', 'notes'].includes(key)) continue;
    if (val === null || val === undefined || val === '') continue;
    if (typeof val === 'object') {
      const subVals = Object.values(val).filter(v => v !== null && v !== undefined && v !== '');
      count += subVals.length;
    } else {
      count++;
    }
  }
  return count;
}

function dedupeOperations(ops) {
  const result = [];
  for (const op of ops) {
    if (!op || !op.operation_type) continue;
    const dupIndex = result.findIndex(r => wordOverlap(r.description || '', op.description || '') > 0.55);
    if (dupIndex === -1) {
      result.push(op);
    } else {
      const existing = result[dupIndex];
      if (countNonEmptyFields(op) > countNonEmptyFields(existing)) {
        result[dupIndex] = op;
      }
    }
  }
  return result;
}

// ── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dataUrls, operation_type } = await req.json();
    if (!dataUrls || !Array.isArray(dataUrls)) return Response.json({ error: 'Missing dataUrls array' }, { status: 400 });

    // Transcribe all audio files
    const transcripts = [];
    for (const url of dataUrls) {
      try {
        const res = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: url });
        transcripts.push(res.transcript || res);
      } catch (err) {
        console.error('Transcription error:', err.message);
      }
    }

    if (transcripts.length === 0) {
      console.error('No transcripts generated from URLs:', dataUrls);
      return Response.json({ error: 'No transcripts generated' }, { status: 400 });
    }

    const notesText = transcripts.map((t, i) => 'Note ' + (i + 1) + ':\n' + t).join('\n\n');

    // Site Management focused analysis — only extract Site Management & Daily Cleanup fields
    if (operation_type === 'Site Management & Daily Cleanup') {
      const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a landscaping project analyst. Analyze these voice notes from a site visit and extract ALL site management and daily cleanup details into structured fields.\n\nThe ONLY valid operation type is "Site Management & Daily Cleanup". Return exactly one operation of this type.\n\nFor every field below, extract the value from the voice notes. Use true/false for checkbox fields, numbers for number fields, strings for text fields. If a field is NOT mentioned in the voice notes, use null. For checkboxes, use false if not mentioned.\n\nTAX STATUS:\n- tax_status_nontaxable: true if non-taxable\n- tax_status_taxable: true if taxable\n\nPARKING / STORAGE / SITE ORGANIZATION:\n- street_occupancy_permit: true if street occupancy permit needed\n- parking_spot_days: days parking spot needed (number)\n- trailer_dumpster_days: days trailer/dumpster/material on street (number)\n- no_parking_signs: true if no parking signs needed\n- sidewalk_closed_signage_days: days sidewalk closed signage needed (number)\n- job_box: true if job box needed\n- jobsite_trailer: true if jobsite trailer needed\n- pallet_use: true if pallet use needed\n- porta_potty: true if porta potty needed\n\nACCESS NEEDS:\n- ground_protection: true if ground protection needed\n- plywood_ea: plywood each count (number)\n- rubber_access_mats_lf: rubber access mats linear feet (number)\n- tree_protection: true if tree protection / tie back needed\n- tree_protection_lf: tree protection linear feet (number)\n- foam_board: true if foam board padding needed\n- foam_board_ea: foam board each count (number)\n- ramp_creation: true if ramp creation for machine access needed\n- ramp_creation_notes: ramp creation notes (string)\n\nSTORMWATER MANAGEMENT:\n- downspout_extensions: true if downspout extensions needed\n- downspout_sections: number of sections (number)\n- downspout_lf: linear feet total (number)\n- silt_fence: true if silt fence needed\n- silt_fence_sections: number of sections (number)\n- silt_fence_lf: linear feet total (number)\n- erosion_logs: true if erosion logs needed\n- erosion_logs_sections: number of sections (number)\n- erosion_logs_lf: linear feet total (number)\n- tarps: true if tarps needed\n- tarps_16x24_qty: 16x24 tarp quantity (number)\n- tarps_8x12_qty: 8x12 tarp quantity (number)\n- tarps_other1_size: other tarp size #1 (string)\n- tarps_other1_qty: other tarp #1 quantity (number)\n- tarps_other2_size: other tarp size #2 (string)\n- tarps_other2_qty: other tarp #2 quantity (number)\n\nPARKING COORDINATION:\n- parking_coordination: true if parking coordination needed\n- parking_days: days on project (number)\n- parking_hours: hours coordinating (number)\n\nMOVING ITEMS:\n- moving_items: true if moving items multiple times needed\n- moving_items_hours: hours coordinating (number)\n\nREMOVE AND REINSTALL:\n- remove_reinstall: true if remove and reinstall site elements needed\n- remove_reinstall_purchase: time to purchase/deliver (string)\n- remove_reinstall_install: time to install (string)\n- remove_reinstall_manage: time to daily manage (string)\n- remove_reinstall_remove: time to remove/restock (string)\n\nAlso extract:\n- time_estimate: total time estimate in hours (number)\n- notes: any additional notes (string)\n\nVoice Notes:\n${notesText}`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Overall summary of all notes' },
            key_items: { type: 'array', items: { type: 'string' }, description: 'Key observations and action items' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Relevant tags' },
            recommended_operations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  operation_type: { type: 'string', description: 'Must be "Site Management & Daily Cleanup"' },
                  description: { type: 'string', description: 'Brief description of site management needs' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  time_estimate: { type: ['number', 'null'], description: 'Time estimate in hours' },
                  tax_status_nontaxable: { type: 'boolean', description: 'Non-taxable' },
                  tax_status_taxable: { type: 'boolean', description: 'Taxable' },
                  street_occupancy_permit: { type: 'boolean', description: 'Street occupancy permit needed' },
                  parking_spot_days: { type: ['number', 'null'], description: 'Days parking spot needed' },
                  trailer_dumpster_days: { type: ['number', 'null'], description: 'Days trailer/dumpster on street' },
                  no_parking_signs: { type: 'boolean', description: 'No parking signs needed' },
                  sidewalk_closed_signage_days: { type: ['number', 'null'], description: 'Days sidewalk closed signage' },
                  job_box: { type: 'boolean', description: 'Job box needed' },
                  jobsite_trailer: { type: 'boolean', description: 'Jobsite trailer needed' },
                  pallet_use: { type: 'boolean', description: 'Pallet use needed' },
                  porta_potty: { type: 'boolean', description: 'Porta potty needed' },
                  ground_protection: { type: 'boolean', description: 'Ground protection needed' },
                  plywood_ea: { type: ['number', 'null'], description: 'Plywood each count' },
                  rubber_access_mats_lf: { type: ['number', 'null'], description: 'Rubber access mats LF' },
                  tree_protection: { type: 'boolean', description: 'Tree protection / tie back needed' },
                  tree_protection_lf: { type: ['number', 'null'], description: 'Tree protection LF' },
                  foam_board: { type: 'boolean', description: 'Foam board padding needed' },
                  foam_board_ea: { type: ['number', 'null'], description: 'Foam board each count' },
                  ramp_creation: { type: 'boolean', description: 'Ramp creation for machine access needed' },
                  ramp_creation_notes: { type: 'string', description: 'Ramp creation notes' },
                  downspout_extensions: { type: 'boolean', description: 'Downspout extensions needed' },
                  downspout_sections: { type: ['number', 'null'], description: 'Downspout extensions sections' },
                  downspout_lf: { type: ['number', 'null'], description: 'Downspout extensions LF total' },
                  silt_fence: { type: 'boolean', description: 'Silt fence needed' },
                  silt_fence_sections: { type: ['number', 'null'], description: 'Silt fence sections' },
                  silt_fence_lf: { type: ['number', 'null'], description: 'Silt fence LF total' },
                  erosion_logs: { type: 'boolean', description: 'Erosion logs needed' },
                  erosion_logs_sections: { type: ['number', 'null'], description: 'Erosion logs sections' },
                  erosion_logs_lf: { type: ['number', 'null'], description: 'Erosion logs LF total' },
                  tarps: { type: 'boolean', description: 'Tarps needed' },
                  tarps_16x24_qty: { type: ['number', 'null'], description: '16x24 tarp quantity' },
                  tarps_8x12_qty: { type: ['number', 'null'], description: '8x12 tarp quantity' },
                  tarps_other1_size: { type: 'string', description: 'Other tarp size #1' },
                  tarps_other1_qty: { type: ['number', 'null'], description: 'Other tarp #1 quantity' },
                  tarps_other2_size: { type: 'string', description: 'Other tarp size #2' },
                  tarps_other2_qty: { type: ['number', 'null'], description: 'Other tarp #2 quantity' },
                  parking_coordination: { type: 'boolean', description: 'Parking coordination needed' },
                  parking_days: { type: ['number', 'null'], description: 'Days on project' },
                  parking_hours: { type: ['number', 'null'], description: 'Hours coordinating' },
                  moving_items: { type: 'boolean', description: 'Moving items multiple times needed' },
                  moving_items_hours: { type: ['number', 'null'], description: 'Hours coordinating moving items' },
                  remove_reinstall: { type: 'boolean', description: 'Remove and reinstall site elements needed' },
                  remove_reinstall_purchase: { type: 'string', description: 'Time to purchase/deliver' },
                  remove_reinstall_install: { type: 'string', description: 'Time to install' },
                  remove_reinstall_manage: { type: 'string', description: 'Time to daily manage' },
                  remove_reinstall_remove: { type: 'string', description: 'Time to remove/restock' },
                  notes: { type: 'string', description: 'Additional notes' }
                },
                required: ['operation_type', 'description']
              },
              description: 'Site management operations'
            }
          }
        }
      });
      return Response.json({ analysis });
    }

    // ── ROUTER PHASE ──────────────────────────────────────────────────────────
    // Single LLM call to detect which operations are present and extract shared context.
    const routerResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: ROUTER_PROMPT(notesText),
      response_json_schema: ROUTER_SCHEMA
    });

    const detectedOps = (routerResult?.detected_operations || []).filter(Boolean);
    const globalContext = routerResult?.global_context || {};

    // If no operations detected, return an early empty analysis.
    if (detectedOps.length === 0) {
      return Response.json({
        analysis: {
          summary: globalContext.general_notes || 'No operations detected in voice notes.',
          key_items: [],
          tags: [],
          recommended_operations: []
        }
      });
    }

    // ── WORKER PHASE ──────────────────────────────────────────────────────────
    // Determine which worker groups have at least one detected operation,
    // then run each needed group sequentially with global context injected.
    const neededGroups = WORKER_GROUPS.filter(group =>
      group.operations.some(op => detectedOps.some(d => wordOverlap(d, op) > 0.7 || d === op))
    );

    const workerResults = [];
    for (const group of neededGroups) {
      // Only tell the worker about the operations within this group that were detected.
      const opsForGroup = group.operations.filter(op =>
        detectedOps.some(d => wordOverlap(d, op) > 0.7 || d === op)
      );

      try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: group.buildPrompt(notesText, globalContext, opsForGroup),
          response_json_schema: group.schema
        });
        workerResults.push(result);
      } catch (err) {
        console.error(`Worker ${group.name} failed:`, err.message);
      }
    }

    if (workerResults.length === 0) {
      return Response.json({ error: 'All worker analysis calls failed' }, { status: 500 });
    }

    // ── MERGE PHASE ───────────────────────────────────────────────────────────
    // Since each worker covers a distinct set of operations, concatenate summaries
    // (they no longer overlap). Still dedupe key_items, tags, and operations.
    const allSummaries = workerResults.map(r => r?.summary).filter(Boolean);
    const combinedSummary = allSummaries.join(' ') || globalContext.general_notes || '';

    const analysis = {
      summary: combinedSummary,
      key_items: dedupeKeyItems(workerResults.flatMap(r => r?.key_items || [])),
      tags: dedupeTags(workerResults.flatMap(r => r?.tags || [])),
      recommended_operations: dedupeOperations(workerResults.flatMap(r => r?.recommended_operations || []))
    };

    return Response.json({ analysis });
  } catch (error) {
    console.error('Analyze voice note error:', error);
    return Response.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
});