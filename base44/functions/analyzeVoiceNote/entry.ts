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
      prompt: `You are a landscaping project analyst. Analyze these voice notes from a site visit and extract a consolidated summary, key insights, recommended operations, and structured data for each operation.\n\nValid operation types: Walkway/Patio, Site Management & Daily Cleanup, Bed Preparation, Rough Grading & Hauling, Demolition & Removals, Bed Edging, Planting, Mulch, Drainage, Lawn Repair & Install, Boulders/Accents & Structures, Hardscape - Repair Existing, Maintenance, Pathway / Steps, Retaining Wall\n\nFor Rough Grading & Hauling operations, extract:\n- sub_type: One of "excavation_hand", "excavation_machine", "importation_hand", "importation_machine"\n- sf_length: Length in feet (number)\n- sf_width: Width in feet (number)\n- depth_inches: Depth in inches (number)\n- machine_type: "Vermeer" or "Dingo" (if applicable)\n- sod_vegetation_removed: "Yes" or "No"\n- disposal_needed: "Yes" or "No"\n\nFor Bed Preparation operations, extract:\n- bed_main_type: One of "till", "no_till", "lawn", "reprofiling"\n- bed_sub_type: One of "till_1in", "till_3in", "notill_hand", "notill_machine", "notill_deadsod", "lawn_none", "lawn_1in", "repro_hardscape", "repro_narrow", "repro_sloped", "repro_soil"\n  Choose based on context: if lawn prep with 1 inch amendments → "lawn_1in", no amendments → "lawn_none", till with 1" amendments → "till_1in", etc.\n- sf_length: Length in feet (number)\n- sf_width: Width in feet (number)

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

For Bed Edging operations, extract:
- edge_type: One of "Brick", "Metal", "Bullet", "Natural Edge", "Poly", "Snapped Limestone"
- lf: Total linear feet (number) — can also be split as lf_straight + lf_curved for Brick
- lf_straight: For Brick only — straight linear feet (number)
- lf_curved: For Brick only — curved linear feet (number)
- brick_width: For Brick — "4 inch" or "8 inch"
- brick_color: For Brick — color description (e.g. "Natural", "Red", "Charcoal")
- brick_ends_cut: For Brick — "Yes" or "No"
- metal_type: For Metal — "Aluminum" or "Steel"
- metal_corners: For Metal — number of corners
- metal_splicers: For Metal — number of splicers
- bullet_color: For Bullet — color description
- natural_method: For Natural Edge — "Hand cut" or "Bed Edger"
- poly_corners_90: For Poly — number of 90-degree corners
- poly_corners_45: For Poly — number of 45-degree corners
- poly_splicers: For Poly — number of splicers
- snapped_ends_cut: For Snapped Limestone — "Yes" or "No"
- snapped_corners: For Snapped Limestone — number of corners
- snapped_splicers: For Snapped Limestone — number of splicers
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
                brick_color: { type: 'string', description: 'For Bed Edging Brick: color (e.g. Natural, Red, Charcoal)' },
                brick_ends_cut: { type: 'string', description: 'For Bed Edging Brick: "Yes" or "No"' },
                metal_type: { type: 'string', description: 'For Bed Edging Metal: "Aluminum" or "Steel"' },
                metal_corners: { type: ['number', 'null'], description: 'For Bed Edging Metal: number of corners' },
                metal_splicers: { type: ['number', 'null'], description: 'For Bed Edging Metal: number of splicers' },
                bullet_color: { type: 'string', description: 'For Bed Edging Bullet: color (e.g. Gray, Tan, Red)' },
                natural_method: { type: 'string', description: 'For Bed Edging Natural Edge: "Hand cut" or "Bed Edger"' },
                poly_corners_90: { type: ['number', 'null'], description: 'For Bed Edging Poly: number of 90-degree corners' },
                poly_corners_45: { type: ['number', 'null'], description: 'For Bed Edging Poly: number of 45-degree corners' },
                poly_splicers: { type: ['number', 'null'], description: 'For Bed Edging Poly: number of splicers' },
                snapped_ends_cut: { type: 'string', description: 'For Bed Edging Snapped Limestone: "Yes" or "No"' },
                snapped_corners: { type: ['number', 'null'], description: 'For Bed Edging Snapped Limestone: number of corners' },
                snapped_splicers: { type: ['number', 'null'], description: 'For Bed Edging Snapped Limestone: number of splicers' },
                bed_edger_needed: { type: 'string', description: 'For Bed Edging: "Yes" or "No"' },
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