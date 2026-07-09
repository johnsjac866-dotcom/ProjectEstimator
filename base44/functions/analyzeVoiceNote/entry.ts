import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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
        // Skip on error, continue with other notes
      }
    }

    if (transcripts.length === 0) {
      console.error('No transcripts generated from URLs:', dataUrls);
      return Response.json({ error: 'No transcripts generated' }, { status: 400 });
    }

    // Site Management focused analysis — only extract Site Management & Daily Cleanup fields
    if (operation_type === 'Site Management & Daily Cleanup') {
      const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a landscaping project analyst. Analyze these voice notes from a site visit and extract ALL site management and daily cleanup details.\n\nThe ONLY valid operation type is "Site Management & Daily Cleanup". Return exactly one operation of this type.\n\nExtract the following fields into sm_fields (use true/false for checkboxes, numbers for number fields, strings for text fields). Leave fields not mentioned as null (for checkboxes, use false if not mentioned):\n\nTAX STATUS:\n- tax_status_nontaxable (boolean): true if non-taxable\n- tax_status_taxable (boolean): true if taxable\n\nPARKING / STORAGE / SITE ORGANIZATION:\n- street_occupancy_permit (boolean): street occupancy permit needed\n- parking_spot_days (number, if street_occupancy_permit): days parking spot needed\n- trailer_dumpster_days (number, if street_occupancy_permit): days trailer/dumpster/material on street\n- no_parking_signs (boolean, if street_occupancy_permit): no parking signs needed\n- sidewalk_closed_signage_days (number, if street_occupancy_permit): days sidewalk closed signage needed\n- job_box (boolean): job box needed\n- jobsite_trailer (boolean): jobsite trailer needed\n- pallet_use (boolean): pallet use needed\n- porta_potty (boolean): porta potty needed\n\nACCESS NEEDS:\n- ground_protection (boolean): ground protection needed\n- plywood_ea (number, if ground_protection): plywood each count\n- rubber_access_mats_lf (number, if ground_protection): rubber access mats linear feet\n- tree_protection (boolean): tree protection / tie back needed\n- tree_protection_lf (number, if tree_protection): tree protection linear feet\n- foam_board (boolean): foam board padding needed\n- foam_board_ea (number, if foam_board): foam board each count\n- ramp_creation (boolean): ramp creation for machine access needed\n- ramp_creation_notes (text, if ramp_creation): ramp creation notes\n\nSTORMWATER MANAGEMENT:\n- downspout_extensions (boolean): downspout extensions needed\n- downspout_sections (number, if downspout_extensions): number of sections\n- downspout_lf (number, if downspout_extensions): linear feet total\n- silt_fence (boolean): silt fence needed\n- silt_fence_sections (number, if silt_fence): number of sections\n- silt_fence_lf (number, if silt_fence): linear feet total\n- erosion_logs (boolean): erosion logs needed\n- erosion_logs_sections (number, if erosion_logs): number of sections\n- erosion_logs_lf (number, if erosion_logs): linear feet total\n- tarps (boolean): tarps needed\n- tarps_16x24_qty (number, if tarps): 16x24 tarp quantity\n- tarps_8x12_qty (number, if tarps): 8x12 tarp quantity\n- tarps_other1_size (text, if tarps): other tarp size #1\n- tarps_other1_qty (number, if tarps): other tarp #1 quantity\n- tarps_other2_size (text, if tarps): other tarp size #2\n- tarps_other2_qty (number, if tarps): other tarp #2 quantity\n\nPARKING COORDINATION:\n- parking_coordination (boolean): parking coordination needed\n- parking_days (number, if parking_coordination): days on project\n- parking_hours (number, if parking_coordination): hours coordinating\n\nMOVING ITEMS:\n- moving_items (boolean): moving items multiple times needed\n- moving_items_hours (number, if moving_items): hours coordinating\n\nREMOVE AND REINSTALL:\n- remove_reinstall (boolean): remove and reinstall site elements needed\n- remove_reinstall_purchase (text, if remove_reinstall): time to purchase/deliver\n- remove_reinstall_install (text, if remove_reinstall): time to install\n- remove_reinstall_manage (text, if remove_reinstall): time to daily manage\n- remove_reinstall_remove (text, if remove_reinstall): time to remove/restock\n\nAlso extract:\n- time_estimate (number): total time estimate in hours\n- notes (string): any additional notes\n\nVoice Notes:\n${transcripts.map((t, i) => 'Note ' + (i + 1) + ':\n' + t).join('\n\n')}`,
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
                  sm_fields: { type: 'object', description: 'All extracted site management field key-value pairs' }
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

    // Analyze all transcripts together
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a landscaping project analyst. Analyze these voice notes from a site visit and extract a consolidated summary, key insights, recommended operations, and structured data for each operation.\n\nValid operation types: Walkway/Patio, Site Management & Daily Cleanup, Bed Preparation, Rough Grading & Hauling, Demolition & Removals, Bed Edging, Planting, Mulch, Drainage, Lawn Repair & Install, Boulders/Accents & Structures, Hardscape - Repair Existing, Maintenance, Pathway / Steps, Retaining Wall\n\nFor Rough Grading & Hauling operations, extract:\n- sub_type: One of "excavation_hand", "excavation_machine", "importation_hand", "importation_machine"\n  Choose "excavation_hand" if removing/exporting soil by hand (wheelbarrows, hand digging)\n  Choose "excavation_machine" if using a machine (Vermeer/Dingo) to excavate and export\n  Choose "importation_hand" if bringing in soil and spreading by hand\n  Choose "importation_machine" if bringing in soil and spreading with a machine\n- rg_fields: object with all extracted form field values:\n  Common (all types): time_estimate (hrs), sf_length (ft), sf_width (ft), depth_inches (in), notes\n  excavation_hand: distance_to_parking (ft), dump_trailer_needed ("Yes"/"No"), ramps_needed (count), sod_vegetation_removed ("Yes"/"No"), disposal_needed ("Yes"/"No"), disposal_location ("Mandt - 2079 Hwy MM, Fitchburg"/"Homburg - 5715 Milwaukee St, Madison" if disposal needed), store_on_site ("Yes"/"No"), grading_plan_required ("Yes"/"No")\n  excavation_machine: machine_type ("Vermeer"/"Dingo"), hydraulic_tiller ("Yes"/"No" if Dingo), rock_hound ("Yes"/"No" if Dingo), machine_access_width (ft), sod_vegetation_removed ("Yes"/"No"), disposal_needed ("Yes"/"No"), disposal_material_type ("Gravel"/"Rock"/"Sand"/"Topsoil"/"Clay" if disposal needed), disposal_dry_wet ("Dry"/"Wet" if disposal needed), disposal_fees (array of fee strings if disposal needed), surface_protection ("Yes"/"No"), utilities_checked ("Confirmed"/"Not Yet Checked"), grading_plan_required ("Yes"/"No")\n  importation_hand: time_estimate (hrs), carry_distance (ft), soil_types (array of "Fill Soil (for rough grading)"/"Garden Mix (topsoil/compost)"/"Topsoil (Unscreened for rough grading)"/"Coarse / Washed Sand"), dump_trailer_needed ("Yes"/"No"), ramps_needed (count), grading_plan_required ("Yes"/"No")\n  importation_machine: time_estimate (hrs), machine_type ("Vermeer"/"Dingo"), machine_access_width (ft), soil_types (array of types listed above), dump_trailer_needed ("Yes"/"No"), ramps_needed (count), surface_protection ("Yes"/"No"), utilities_checked ("Confirmed"/"Not Yet Checked"), grading_plan_required ("Yes"/"No")\n\nFor Bed Preparation operations, extract:\n- bed_main_type: One of "till", "no_till", "lawn", "reprofiling"\n- bed_sub_type: One of "till_1in", "till_3in", "notill_hand", "notill_machine", "notill_deadsod", "lawn_none", "lawn_1in", "repro_hardscape", "repro_narrow", "repro_sloped", "repro_soil"\n  Choose based on context: if lawn prep with 1 inch amendments → "lawn_1in", no amendments → "lawn_none", till with 1" amendments → "till_1in", etc.\n- sf_length: Length in feet (number)\n- sf_width: Width in feet (number)\nFor TILL (till_1in, till_3in) also extract:\n- till_tilling_mode: "Hand" or "Machine"\n- till_hand_tiller_type: "16\\\" Hand Tiller" or "FG 110 Hand Tiller" (if hand)\n- till_hand_tiller_hours: Unit hours (number, if hand)\n- till_machine_type: "Dingo" or "Vermeer" (if machine)\n- till_hydraulic_tiller: "Yes" or "No" (if machine)\n- remove_rock_hours: Hours to remove rock/debris/roots (number)\n- fertilizer_hours: Hours for fertilizer (number)\n- chicken_crumbles: "Yes" or "No"\n- amend_amendment_type: "Topsoil" or "Compost"\n- finish_bed_hours: Hours to finish bed by hand (number)\nFor LAWN (lawn_none, lawn_1in) also extract:\n- lawn_tilling_mode: "Hand" or "Machine"\n- lawn_hand_tiller_type: "16\\\" Hand Tiller" or "FG 110 Hand Tiller" (if hand)\n- lawn_hand_tiller_hours: Unit hours (number, if hand)\n- lawn_machine_type: "Dingo" or "Vermeer" (if machine)\n- lawn_hydraulic_tiller: "Yes" or "No" (if machine)\n- fertilizer_hours: Hours for fertilizer (number)\n- finish_bed_hours: Hours to finish bed by hand (number)\n- amend_amendment_type: "Topsoil" or "Compost" (for lawn_1in only)\n- amend_amendment_depth_in: Amendment depth in inches (number, for lawn_1in only)\nFor NO TILL HAND (notill_hand) also extract:\n- slope_distance_hours: Additional time for slopes/distance/challenges (number)\nFor NO TILL MACHINE (notill_machine) also extract:\n- notill_machine_type: "Vermeer" or "Dingo"\nFor REPROFILING (repro_*) also extract:\n- repro_tilling: "Yes" or "No"\n- repro_till_tilling_mode: "Hand" or "Machine" (if tilling)\n- repro_till_hand_tiller_type: "16\\\" Hand Tiller" or "FG 110 Hand Tiller" (if hand)\n- repro_till_hand_tiller_hours: Unit hours (number, if hand)\n- repro_till_machine_type: "Dingo" or "Vermeer" (if machine)\n- repro_till_hydraulic_tiller: "Yes" or "No" (if machine)\n- remove_rock_hours: Hours to remove rock/debris/roots (number)\n- repro_amendments: "Yes" or "No"\n- repro_amend_amendment_type: "Topsoil" or "Compost" (if amendments)\n- repro_amend_amendment_depth_in: Amendment depth in inches (number, if amendments)\n- repro_chicken_crumbles: "Yes" or "No" (if amendments)\n- fertilizer_hours: Hours for fertilizer (number)\n- finish_bed_hours: Hours to finish bed by hand (number)

For Mulch operations, extract:
- mulch_type: "Organic" or "Stone"
- mulch_fields: object with all extracted form field values:
  Common (all types): time_estimate (hrs), length (ft), width (ft), depth (in), bed_type, machine_access ("Vermeer"/"Dingo"/"None")
  Organic: install_type ("Refresh"/"Full Install"), organic_subtype ("Shredded Hardwood"/"Dyed"/"Red Cedar"), distance_to_truck (ft)
  Stone: fabric_needed ("Yes"/"No"), fabric_sf

For Lawn Repair & Install operations, extract:
- lawn_type: One of "Sod Installation", "Seed Install", "Top Dress Lawn"
  Choose "Seed Install" if the notes mention seeding, overseeding, or installing seed.
  Choose "Sod Installation" if the notes mention laying sod or sod rolls.
  Choose "Top Dress Lawn" if the notes mention top dressing or topdress.
- sf_length: Length in feet (number)
- sf_width: Width in feet (number)
- seed_type: One of "Madison Parks", "Tough Stuff", "Shady Place", "Carefree No Mow" (if mentioned)

For Planting operations, extract:
- planting_type: One of "Trees & Shrubs", "Perennials", "Bulbs", "Annuals"
- planting_fields: object with all extracted form field values:
  Common (all types): time_estimate (hrs), additional_time_rocky ("Yes"/"No"), additional_time_roots ("Yes"/"No"), notes
  Trees & Shrubs: trees (array of {type, count, size}), shrubs (array of {type, count, size}), mycorrhizae_tablets (count), hand_vs_machine ("Hand"/"Machine"), machine_type ("Vermeer"/"Dingo" if machine), ball_cart ("Yes"/"No"), tree_sling ("Yes"/"No"), tree_boom ("Yes"/"No"), ramps (count), stake_kit ("Yes"/"No"), cage ("Yes"/"No"), mulch_ring ("Yes"/"No"), haul_off_debris ("Yes"/"No"), watering_hours, watering_days, water_access ("Yes"/"No"), delivery_by ("By Aspen"/"By Others"), box_truck ("Yes"/"No"), flatbed ("Yes"/"No"), forklift ("Yes"/"No")
  Perennials: large_plants (array of {name, count}), large_spacing, small_plants (array of {name, count}), small_spacing, bed_condition ("Unprepared bed"/"Prepared bed"), mycorrhizae_tablets (count), watering_hours, water_access ("Yes"/"No")
  Bulbs: bulbs (array of {name, count}), mulched_soil ("Yes"/"No"), bulb_fertilizer ("Yes"/"No"), milwaukee_drill ("Yes"/"No"), drill_auger ("Yes"/"No"), bulb_plugger ("Yes"/"No"), cut_weed_barrier ("Yes"/"No"), watering_hours, water_access ("Yes"/"No")
  Annuals: annuals (array of {name, count}), watering_hours, water_access ("Yes"/"No")

For Bed Edging operations, extract ALL fields that are mentioned:
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
- bed_edger_needed: "Yes" or "No" (if mentioned)

For Demolition & Removals operations, extract:
- demo_group: "hardscape" or "vegetation"
- demo_sub_type: One of:
  Hardscape: "deck_timber_wall", "patio", "hand_removal_reuse" (brick/flag hand removal for reuse), "stone_retaining_wall"
  Vegetation: "woody_flush_cut", "woody_incl_stumps" (including stumps), "perennials_dig", "perennials_herbicide", "transplant_direct", "transplant_dig_hold" (hold above ground), "herbicide_cut_treat", "strip_sod", "landscape_edging", "stone_mulch", "weed_fabric", "wood_mulch", "misc_items"
- sf_length, sf_width: dimensions in feet (for deck_timber_wall, patio, strip_sod, stone_mulch, wood_mulch)
- depth_inches: depth in inches (for strip_sod, stone_mulch, wood_mulch)
- demo_fields: object with all other extracted form field values. Possible keys:
  machine_use ("Yes"/"No"), machine_type ("Dingo"/"Vermeer"), disposal_needed ("Yes"/"No"), disposal_location, disposal_method, dumpster_needed ("Yes"/"No"), distance_to_truck (ft), pallets_needed, road_gravel_tons, thickness (in), thickness_base (in), removal_of_base ("Yes"/"No"), hydraulic_tiller ("Yes"/"No"), skil_saw ("Yes"/"No"), recip_saw ("Yes"/"No"), existing_material, drainage_rock_below ("Yes"/"No"), drainage_rock_depth, drainage_rock_sf, remove_backfill_hrs, patio_material ("Concrete"/"Asphalt"/"Paver"/"Flagstone"), breaker_hammer ("Yes"/"No"), mandt_type, scope_quantity, pallet_count, reuse_storage_plan, lf, width, wall_height, remove_stone_hrs, reuse_vs_disposal ("Reuse"/"Disposal"), chainsaw ("Yes"/"No"), brush_chipper ("Yes"/"No"), stumps_excluded ("Yes"/"No"), time_to_cut, tons_material, loading_tarping_time, round_trip_disposal, time_remove_stump, bucket_stump_ripper ("Yes"/"No"), stump_mature_type, stump_mature_count, stump_large_type, stump_large_count, stump_medium_type, stump_medium_count, stump_small_type, stump_small_count, approx_time_dig, remove_vs_reuse ("Remove"/"Reuse"), dump_location, method ("Hand"/"Machine"), treatment_sf, client_approval ("Yes"/"Not Yet"), treatment_timing, nearby_plantings, plants_list, time_dig_hours, time_replant_hours, fill_holes_hours, watering_on_install ("Yes"/"No"), time_water_1x_hours, root_ball_difficulty, dig_pot_labor_hours, small_pots_count, hold_duration, storage_location, watering_system ("Yes"/"No"), watering_events, time_per_watering, travel_per_watering, replanting_plants ("Yes"/"No"), pm_travel_hours, sod_cutter ("Yes"/"No"), ramps_needed ("Yes"/"No"), obstacle_removal_hours, tilling ("Yes"/"No"), distance_from_truck, removal_labor_hours, edging_type_plastic ("Yes"/"No"), edging_type_brick ("Yes"/"No"), disposition ("Reuse"/"Reinstall"/"Dispose"), disposal_travel_hrs, equip_operator_hours, time_to_remove, trash_bags_fabric ("Yes"/"No"), removal_time, trash_bags_needed ("Yes"/"No"), inorganic_debris_bags ("Yes"/"No"), bags_needed, removal_type ("Full Removal"/"Partial Disturbance"), buried_condition, contamination ("Yes"/"No"), material_type, approx_time

For Boulders/Accents & Structures operations, extract:
- boulders_type: "Boulders / Accents", "Structures - Fence", "Structures - Arbor", or "Raised Garden Bed"
- boulders_fields: object with all extracted fields:
  Boulders: count_24_30, count_18_24, count_12_18 (counts by size range), color_preference, ball_cart_needed ("Yes"/"No"), dump_trailer_needed ("Yes"/"No"), machine_access ("Vermeer"/"Dingo"/"None"), delivery_supplier ("Midwest"/"Madison Block"/"Special Order"), delivery_special_order, constraints
  Fence: lf (linear feet), height (ft), gate_count, gate_width (ft), fence_cedar_2x2 (count), fence_cedar_4x4 (count), fence_fasteners (count), post_spacing (ft), fence_dig_mode ("Hand"/"Machine"), fence_machine_type ("Dingo"/"Vermeer"), fence_dig_hours
  Arbor: count, length (ft), height (ft), width (ft), footing, material, arbor_dig_mode ("Hand"/"Machine"), arbor_machine_type ("Dingo"/"Vermeer"), arbor_dig_hours, needs_level_pad ("Yes"/"No"), remove_count
  Raised Garden Bed: material ("Wood"/"Metal"), quantity, length (ft), width (ft), soil_depth (in), base_level ("Yes"/"No"), machine_access ("Vermeer"/"Dingo"/"None")

For Drainage operations, extract:
- drain_type: One of "Buried Downspout", "Buried Drain", "Buried Sump Line", "Curtain Drain", "French Drain", "Dry Stream Bed", "Impervious Membrane"
- drainage_fields: object with all extracted form field values:
  Common (all except Impervious Membrane): lf (linear feet), excavation_mode ("Machine"/"Hand"), excavation_machine_type ("Vermeer"/"Dingo" if machine), trencher_attachment ("Yes"/"No"), excavation_depth (in), soil_composition (array of "Rubble"/"Dirt"/"Sod"/"Stone"), spoil_type ("Remain on site"/"Hauled off"), disposal_site, sod_removal ("Yes"/"No"), obstruction_hours, zip_level ("Yes"/"No")
  Buried Downspout: pipe_size (in), existing_downspout ("Yes"/"No"), existing_lf, pvc_supplies_needed ("Yes"/"No"), pvc_supplies_count, pvc_fittings_needed ("Yes"/"No"), fit_90_long_turn, fit_90_tight, fit_22_5_elbow, fit_hub_45_elbow, fit_tee, fit_wye, fit_cleanout, downspout_connection_needed ("Yes"/"No"), downspout_connection_size, downspout_connection_count, catch_basin_needed ("Yes"/"No"), catch_basin_size, catch_basin_count, miter_drain ("Yes"/"No"), miter_drain_type ("Heavy duty"/"Light duty"), miter_drain_count, lawn_repair ("Yes"/"No")
  Buried Drain: pipe_size, existing_drain ("Yes"/"No"), existing_lf, catch_basin_needed, catch_basin_size, catch_basin_count, atrium_drain_needed ("Yes"/"No"), atrium_drain_count, pvc_supplies_needed, pvc_supplies_count, pvc_fittings_needed, [fitting counts], miter_drain, miter_drain_type, miter_drain_count, lawn_repair
  Buried Sump Line: pipe_size, existing_downspout, existing_lf, pvc_supplies_needed, pvc_supplies_count, pvc_fittings_needed, [fitting counts], freezedrain_needed ("Yes"/"No"), freezedrain_count, miter_drain, miter_drain_type, miter_drain_count, topsoil_needed ("Yes"/"No"), topsoil_cy, lawn_repair
  Curtain Drain: pipe_size, existing_drain, existing_lf, stone_needed ("Yes"/"No"), fabric_needed ("Yes"/"No"), fabric_sf, sod_disposal_method
  French Drain: pipe_size, existing_drain, existing_lf, corrugated_tile_needed ("Yes"/"No"), tile_perforated_sock_count, tile_solid_count, pvc_cleanout_needed ("Yes"/"No"), pvc_cleanout_count, misc_drainage_needed ("Yes"/"No"), misc_drainage_notes, coarse_sand_needed ("Yes"/"No"), coarse_sand_tons, drainage_rock_needed ("Yes"/"No"), drainage_rock_tons, stone_needed, fabric_needed, fabric_sf
  Dry Stream Bed: width (ft), stream_depth (in), existing_downspout, existing_lf, ball_cart_needed ("Yes"/"No"), boulders_needed ("Yes"/"No"), fieldstone_10_18, fieldstone_18_24, fieldstone_24_30, drainage_rock_needed ("Yes"/"No"), drainage_rock_cy, stone_type, stream_purpose ("Decorative"/"Functional")
  Impervious Membrane: rough_grading_needed ("Yes"/"No"), mem_length, mem_width, mem_depth, excavation_mode, excavation_machine_type, detail_excavation_hours, place_membrane_hours, roofing_membrane_needed ("Yes"/"No"), roofing_membrane_rolls, woven_fabric_needed ("Yes"/"No"), woven_fabric_sf, place_stone_hours, drainage_rock_needed ("Yes"/"No"), drainage_rock_tons, edging_needed ("Yes"/"No"), poly_plastic_needed ("Yes"/"No"), poly_plastic_rolls

For Lawn Repair & Install operations, extract:
- lawn_type: One of "Sod Installation", "Seed Install", "Top Dress Lawn"
- lawn_fields: object with all extracted form field values:
  Common (all types): time_estimate (hrs), length (ft), width (ft)
  Sod Installation: on_slope ("Yes"/"No"), sf_waste, diff_easy_hours, diff_avg_hours, diff_hard_hours, diff_very_hard_hours, sod_staples_needed ("Yes"/"No"), sod_staples_count, pallets_needed ("Yes"/"No"), pallets_count, watering_on_install ("Yes"/"No"), water_access ("Yes"/"No"), watering_time_hours, fertilizer ("Yes"/"No"), fertilizer_sf_override, distance_to_truck (ft), machine_access ("Dingo"/"Vermeer"/"None"), sod_type ("Bluegrass"/"Tall Fescue Blend")
  Seed Install: sf_seed, seed_type ("Madison Parks"/"Shady Place"/"Survivor"), seed_lbs, extra_seed ("Yes"/"No"), cover_method ("Mulch Pellet"/"Straw Netting"), mulch_bags, mulch_buckets, straw_mat_type ("Single Net 60"/"Curlex Doublenet"), straw_rolls, straw_sod_staples, temp_downspout_needed ("Yes"/"No"), temp_downspout_lf, water_access ("Yes"/"No"), fertilizer ("Yes"/"No"), bed_prep_needed ("Yes"/"No")
  Top Dress Lawn: top_dress_depth (in), material ("Compost"/"Soil Blend"), overseed ("Yes"/"No"), aerate ("Yes"/"No")

For ALL operation types, also extract:
- time_estimate: Time in hours mentioned for this operation. Look for phrases like "2 hours", "about 3 hrs", "half a day" (=4hrs), "a full day" (=8hrs), "45 minutes" (=0.75hrs). Null if no time is mentioned.

Leave unknown fields blank or null.\n\nVoice Notes:\n${transcripts.map((t, i) => `Note ${i + 1}:\n${t}`).join('\n\n')}`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Overall summary of all notes' },
          key_items: { type: 'array', items: { type: 'string' }, description: 'Key observations and action items prioritized across all notes' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Relevant tags for the area' },
          recommended_operations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                operation_type: { type: 'string', description: 'The operation type from the valid list' },
                description: { type: 'string', description: 'Brief description of what needs to be done' },
                priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Priority level' },
                estimated_quantity: { type: 'string', description: 'Estimated size/quantity if applicable' },
                materials: { type: 'array', items: { type: 'string' }, description: 'Materials needed' },
                notes: { type: 'string', description: 'Additional notes or specifications' },
                rg_fields: { type: 'object', description: 'For Rough Grading: all extracted form field key-value pairs (time_estimate, sf_length, sf_width, depth_inches, machine_type, hydraulic_tiller, rock_hound, machine_access_width, distance_to_parking, carry_distance, soil_types array, dump_trailer_needed, ramps_needed, sod_vegetation_removed, disposal_needed, disposal_location, disposal_material_type, disposal_dry_wet, disposal_fees array, store_on_site, surface_protection, utilities_checked, grading_plan_required, notes)' },
                bed_main_type: { type: 'string', description: 'For Bed Preparation: till, no_till, lawn, or reprofiling' },
                bed_sub_type: { type: 'string', description: 'For Bed Preparation: till_1in, till_3in, notill_hand, notill_machine, notill_deadsod, lawn_none, lawn_1in, repro_hardscape, repro_narrow, repro_sloped, or repro_soil' },
                mulch_type: { type: 'string', description: 'For Mulch: "Organic" or "Stone"' },
                mulch_fields: { type: 'object', description: 'For Mulch: all extracted form field key-value pairs' },
                lawn_type: { type: 'string', description: 'For Lawn Repair: "Sod Installation", "Seed Install", or "Top Dress Lawn"' },
                seed_type: { type: 'string', description: 'For Lawn Repair Seed Install: "Madison Parks", "Tough Stuff", "Shady Place", or "Carefree No Mow"' },
                edge_type: { type: 'string', description: 'For Bed Edging: "Brick", "Metal", "Bullet", "Natural Edge", "Poly", or "Snapped Limestone"' },
                lf: { type: ['number', 'null'], description: 'For Bed Edging: total linear feet' },
                lf_straight: { type: ['number', 'null'], description: 'For Bed Edging Brick: straight linear feet' },
                lf_curved: { type: ['number', 'null'], description: 'For Bed Edging Brick: curved linear feet' },
                brick_width: { type: 'string', description: 'For Bed Edging Brick: "4 inch" or "8 inch"' },
                brick_color: { type: 'string', description: 'For Bed Edging Brick: color' },
                brick_ends_cut: { type: 'string', description: 'For Bed Edging Brick: "Yes" or "No"' },
                brick_prep_hours: { type: ['number', 'null'], description: 'For Bed Edging Brick: prep area hours' },
                brick_sand_needed: { type: 'string', description: 'For Bed Edging Brick: "Yes" or "No"' },
                brick_cut_off_saw: { type: 'string', description: 'For Bed Edging Brick: "Yes" or "No"' },
                brick_disposal_hours: { type: ['number', 'null'], description: 'For Bed Edging Brick: disposal hours' },
                metal_type: { type: 'string', description: 'For Bed Edging Metal: "Aluminum" or "Steel"' },
                metal_lf: { type: ['number', 'null'], description: 'For Bed Edging Metal: linear feet' },
                metal_corners: { type: ['number', 'null'], description: 'For Bed Edging Metal: number of corners' },
                metal_splicers: { type: ['number', 'null'], description: 'For Bed Edging Metal: number of splicers' },
                metal_cut_off_saw: { type: 'string', description: 'For Bed Edging Metal: "Yes" or "No"' },
                metal_remove_sod_hours: { type: ['number', 'null'], description: 'For Bed Edging Metal: remove sod hours' },
                bullet_supplier: { type: 'string', description: 'For Bed Edging Bullet: "Menards" or "Rochester"' },
                bullet_lf: { type: ['number', 'null'], description: 'For Bed Edging Bullet: linear feet' },
                bullet_color: { type: 'string', description: 'For Bed Edging Bullet: color' },
                bullet_prep_hours: { type: ['number', 'null'], description: 'For Bed Edging Bullet: prep area hours' },
                bullet_permeable_chips: { type: 'string', description: 'For Bed Edging Bullet: "Yes" or "No"' },
                bullet_cut_off_saw: { type: 'string', description: 'For Bed Edging Bullet: "Yes" or "No"' },
                bullet_disposal_hours: { type: ['number', 'null'], description: 'For Bed Edging Bullet: disposal hours' },
                natural_method: { type: 'string', description: 'For Bed Edging Natural Edge: "Hand cut" or "Bed Edger"' },
                natural_lf: { type: ['number', 'null'], description: 'For Bed Edging Natural Edge: linear feet' },
                poly_lf: { type: ['number', 'null'], description: 'For Bed Edging Poly: linear feet' },
                poly_angular_connectors: { type: ['number', 'null'], description: 'For Bed Edging Poly: angular connectors' },
                poly_remove_sod_hours: { type: ['number', 'null'], description: 'For Bed Edging Poly: remove sod hours' },
                snapped_lf: { type: ['number', 'null'], description: 'For Bed Edging Snapped Limestone: linear feet' },
                snapped_ends_cut: { type: 'string', description: 'For Bed Edging Snapped Limestone: "Yes" or "No"' },
                snapped_sand_needed: { type: 'string', description: 'For Bed Edging Snapped Limestone: "Yes" or "No"' },
                snapped_prep_hours: { type: ['number', 'null'], description: 'For Bed Edging Snapped Limestone: prep area hours' },
                snapped_cut_off_saw: { type: 'string', description: 'For Bed Edging Snapped Limestone: "Yes" or "No"' },
                bed_edger_needed: { type: 'string', description: 'For Bed Edging: "Yes" or "No"' },
                till_tilling_mode: { type: 'string', description: 'For Bed Prep Till: "Hand" or "Machine"' },
                till_hand_tiller_type: { type: 'string', description: 'For Bed Prep Till Hand: tiller type' },
                till_hand_tiller_hours: { type: ['number', 'null'], description: 'For Bed Prep Till Hand: unit hours' },
                till_machine_type: { type: 'string', description: 'For Bed Prep Till Machine: "Dingo" or "Vermeer"' },
                till_hydraulic_tiller: { type: 'string', description: 'For Bed Prep Till Machine: "Yes" or "No"' },
                remove_rock_hours: { type: ['number', 'null'], description: 'For Bed Prep: remove rock/debris/roots hours' },
                fertilizer_hours: { type: ['number', 'null'], description: 'For Bed Prep: fertilizer hours' },
                chicken_crumbles: { type: 'string', description: 'For Bed Prep Till: "Yes" or "No"' },
                amend_amendment_type: { type: 'string', description: 'For Bed Prep Till/Lawn: "Topsoil" or "Compost"' },
                amend_amendment_depth_in: { type: ['number', 'null'], description: 'For Bed Prep Lawn with amendments: depth in inches' },
                finish_bed_hours: { type: ['number', 'null'], description: 'For Bed Prep: finish bed by hand hours' },
                lawn_tilling_mode: { type: 'string', description: 'For Bed Prep Lawn: "Hand" or "Machine"' },
                lawn_hand_tiller_type: { type: 'string', description: 'For Bed Prep Lawn Hand: tiller type' },
                lawn_hand_tiller_hours: { type: ['number', 'null'], description: 'For Bed Prep Lawn Hand: unit hours' },
                lawn_machine_type: { type: 'string', description: 'For Bed Prep Lawn Machine: "Dingo" or "Vermeer"' },
                lawn_hydraulic_tiller: { type: 'string', description: 'For Bed Prep Lawn Machine: "Yes" or "No"' },
                slope_distance_hours: { type: ['number', 'null'], description: 'For Bed Prep No-Till Hand: additional time hours' },
                notill_machine_type: { type: 'string', description: 'For Bed Prep No-Till Machine: "Vermeer" or "Dingo"' },
                repro_tilling: { type: 'string', description: 'For Bed Prep Reprofiling: "Yes" or "No"' },
                repro_till_tilling_mode: { type: 'string', description: 'For Bed Prep Reprofiling tilling: "Hand" or "Machine"' },
                repro_till_hand_tiller_type: { type: 'string', description: 'For Bed Prep Reprofiling Hand: tiller type' },
                repro_till_hand_tiller_hours: { type: ['number', 'null'], description: 'For Bed Prep Reprofiling Hand: unit hours' },
                repro_till_machine_type: { type: 'string', description: 'For Bed Prep Reprofiling Machine: "Dingo" or "Vermeer"' },
                repro_till_hydraulic_tiller: { type: 'string', description: 'For Bed Prep Reprofiling Machine: "Yes" or "No"' },
                repro_amendments: { type: 'string', description: 'For Bed Prep Reprofiling: "Yes" or "No"' },
                repro_amend_amendment_type: { type: 'string', description: 'For Bed Prep Reprofiling amendments: "Topsoil" or "Compost"' },
                repro_amend_amendment_depth_in: { type: ['number', 'null'], description: 'For Bed Prep Reprofiling amendments: depth in inches' },
                repro_chicken_crumbles: { type: 'string', description: 'For Bed Prep Reprofiling: "Yes" or "No"' },
                time_estimate: { type: ['number', 'null'], description: 'Time estimate in hours for this specific operation, extracted from any mention of hours, time, or duration in the voice notes (e.g. "2 hours", "about 3 hrs", "half a day = 4 hours"). Null if not mentioned.' },
                demo_group: { type: 'string', description: 'For Demolition: "hardscape" or "vegetation"' },
                demo_sub_type: { type: 'string', description: 'For Demolition: sub-type identifier' },
                demo_fields: { type: 'object', description: 'For Demolition: all extracted form field key-value pairs' },
                boulders_type: { type: 'string', description: 'For Boulders: "Boulders / Accents", "Structures - Fence", "Structures - Arbor", or "Raised Garden Bed"' },
                boulders_fields: { type: 'object', description: 'For Boulders: all extracted form field key-value pairs' },
                drain_type: { type: 'string', description: 'For Drainage: "Buried Downspout", "Buried Drain", "Buried Sump Line", "Curtain Drain", "French Drain", "Dry Stream Bed", or "Impervious Membrane"' },
                drainage_fields: { type: 'object', description: 'For Drainage: all extracted form field key-value pairs' },
                lawn_type: { type: 'string', description: 'For Lawn Repair: "Sod Installation", "Seed Install", or "Top Dress Lawn"' },
                lawn_fields: { type: 'object', description: 'For Lawn Repair: all extracted form field key-value pairs' },
                planting_type: { type: 'string', description: 'For Planting: "Trees & Shrubs", "Perennials", "Bulbs", or "Annuals"' },
                planting_fields: { type: 'object', description: 'For Planting: all extracted form field key-value pairs including arrays of plant objects' }
              },
              required: ['operation_type', 'description']
            },
            description: 'Operations recommended based on voice notes'
          }
        }
      }
    });

    return Response.json({ analysis });
  } catch (error) {
    console.error('Analyze voice note error:', error);
    return Response.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
});