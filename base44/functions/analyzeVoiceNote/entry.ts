import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dataUrls } = await req.json();
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

    // Analyze all transcripts together
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a landscaping project analyst. Analyze these voice notes from a site visit and extract a consolidated summary, key insights, recommended operations, and structured data for each operation.\n\nValid operation types: Walkway/Patio, Site Management & Daily Cleanup, Bed Preparation, Rough Grading & Hauling, Demolition & Removals, Bed Edging, Planting, Mulch, Drainage, Lawn Repair & Install, Boulders/Accents & Structures, Hardscape - Repair Existing, Maintenance, Pathway / Steps, Retaining Wall\n\nFor Rough Grading & Hauling operations, extract:\n- sub_type: One of "excavation_hand", "excavation_machine", "importation_hand", "importation_machine"\n- sf_length: Length in feet (number)\n- sf_width: Width in feet (number)\n- depth_inches: Depth in inches (number)\n- machine_type: "Vermeer" or "Dingo" (if applicable)\n- sod_vegetation_removed: "Yes" or "No"\n- disposal_needed: "Yes" or "No"\n\nFor Bed Preparation operations, extract:\n- bed_main_type: One of "till", "no_till", "lawn", "reprofiling"\n- bed_sub_type: One of "till_1in", "till_3in", "notill_hand", "notill_machine", "notill_deadsod", "lawn_none", "lawn_1in", "repro_hardscape", "repro_narrow", "repro_sloped", "repro_soil"\n  Choose based on context: if lawn prep with 1 inch amendments → "lawn_1in", no amendments → "lawn_none", till with 1" amendments → "till_1in", etc.\n- sf_length: Length in feet (number)\n- sf_width: Width in feet (number)\nFor TILL (till_1in, till_3in) also extract:\n- till_tilling_mode: "Hand" or "Machine"\n- till_hand_tiller_type: "16\\\" Hand Tiller" or "FG 110 Hand Tiller" (if hand)\n- till_hand_tiller_hours: Unit hours (number, if hand)\n- till_machine_type: "Dingo" or "Vermeer" (if machine)\n- till_hydraulic_tiller: "Yes" or "No" (if machine)\n- remove_rock_hours: Hours to remove rock/debris/roots (number)\n- fertilizer_hours: Hours for fertilizer (number)\n- chicken_crumbles: "Yes" or "No"\n- amend_amendment_type: "Topsoil" or "Compost"\n- finish_bed_hours: Hours to finish bed by hand (number)\nFor LAWN (lawn_none, lawn_1in) also extract:\n- lawn_tilling_mode: "Hand" or "Machine"\n- lawn_hand_tiller_type: "16\\\" Hand Tiller" or "FG 110 Hand Tiller" (if hand)\n- lawn_hand_tiller_hours: Unit hours (number, if hand)\n- lawn_machine_type: "Dingo" or "Vermeer" (if machine)\n- lawn_hydraulic_tiller: "Yes" or "No" (if machine)\n- fertilizer_hours: Hours for fertilizer (number)\n- finish_bed_hours: Hours to finish bed by hand (number)\n- amend_amendment_type: "Topsoil" or "Compost" (for lawn_1in only)\n- amend_amendment_depth_in: Amendment depth in inches (number, for lawn_1in only)\nFor NO TILL HAND (notill_hand) also extract:\n- slope_distance_hours: Additional time for slopes/distance/challenges (number)\nFor NO TILL MACHINE (notill_machine) also extract:\n- notill_machine_type: "Vermeer" or "Dingo"\nFor REPROFILING (repro_*) also extract:\n- repro_tilling: "Yes" or "No"\n- repro_till_tilling_mode: "Hand" or "Machine" (if tilling)\n- repro_till_hand_tiller_type: "16\\\" Hand Tiller" or "FG 110 Hand Tiller" (if hand)\n- repro_till_hand_tiller_hours: Unit hours (number, if hand)\n- repro_till_machine_type: "Dingo" or "Vermeer" (if machine)\n- repro_till_hydraulic_tiller: "Yes" or "No" (if machine)\n- remove_rock_hours: Hours to remove rock/debris/roots (number)\n- repro_amendments: "Yes" or "No"\n- repro_amend_amendment_type: "Topsoil" or "Compost" (if amendments)\n- repro_amend_amendment_depth_in: Amendment depth in inches (number, if amendments)\n- repro_chicken_crumbles: "Yes" or "No" (if amendments)\n- fertilizer_hours: Hours for fertilizer (number)\n- finish_bed_hours: Hours to finish bed by hand (number)

For Mulch operations, extract:
- mulch_type: "Organic" or "Stone"
- sf_length: Length in feet (number)
- sf_width: Width in feet (number)
- mulch_depth: Depth in inches (number, typically 2-4 for organic, 2-3 for stone)

For Lawn Repair & Install operations, extract:
- lawn_type: One of "Sod Installation", "Seed Install", "Top Dress Lawn"
  Choose "Seed Install" if the notes mention seeding, overseeding, or installing seed.
  Choose "Sod Installation" if the notes mention laying sod or sod rolls.
  Choose "Top Dress Lawn" if the notes mention top dressing or topdress.
- sf_length: Length in feet (number)
- sf_width: Width in feet (number)
- seed_type: One of "Madison Parks", "Tough Stuff", "Shady Place", "Carefree No Mow" (if mentioned)

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
                sub_type: { type: 'string', description: 'For Rough Grading: excavation_hand, excavation_machine, importation_hand, or importation_machine' },
                sf_length: { type: ['number', 'null'], description: 'For Rough Grading: Length in feet' },
                sf_width: { type: ['number', 'null'], description: 'For Rough Grading: Width in feet' },
                depth_inches: { type: ['number', 'null'], description: 'For Rough Grading: Depth in inches' },
                machine_type: { type: 'string', description: 'For Rough Grading: Vermeer or Dingo' },
                sod_vegetation_removed: { type: 'string', description: 'For Rough Grading: Yes or No' },
                disposal_needed: { type: 'string', description: 'For Rough Grading: Yes or No' },
                bed_main_type: { type: 'string', description: 'For Bed Preparation: till, no_till, lawn, or reprofiling' },
                bed_sub_type: { type: 'string', description: 'For Bed Preparation: till_1in, till_3in, notill_hand, notill_machine, notill_deadsod, lawn_none, lawn_1in, repro_hardscape, repro_narrow, repro_sloped, or repro_soil' },
                mulch_type: { type: 'string', description: 'For Mulch: Organic or Stone' },
                mulch_depth: { type: ['number', 'null'], description: 'For Mulch: depth in inches' },
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
                time_estimate: { type: ['number', 'null'], description: 'Time estimate in hours for this specific operation, extracted from any mention of hours, time, or duration in the voice notes (e.g. "2 hours", "about 3 hrs", "half a day = 4 hours"). Null if not mentioned.' }
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