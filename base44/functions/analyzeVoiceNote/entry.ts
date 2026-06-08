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
        const res = await base44.integrations.Core.TranscribeAudio({ audio_url: url });
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
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a landscaping project analyst. Analyze these voice notes from a site visit and extract a consolidated summary, key insights, recommended operations, and structured data for each operation.\n\nValid operation types: Walkway/Patio, Site Management & Daily Cleanup, Bed Preparation, Rough Grading & Hauling, Demolition & Removals, Bed Edging, Planting, Mulch, Drainage, Lawn Repair & Install, Boulders/Accents & Structures, Hardscape - Repair Existing, Maintenance, Pathway / Steps, Retaining Wall\n\nFor Rough Grading & Hauling operations, extract:\n- sub_type: One of "excavation_hand", "excavation_machine", "importation_hand", "importation_machine"\n- sf_length: Length in feet (number)\n- sf_width: Width in feet (number)\n- depth_inches: Depth in inches (number)\n- machine_type: "Vermeer" or "Dingo" (if applicable)\n- sod_vegetation_removed: "Yes" or "No"\n- disposal_needed: "Yes" or "No"\n\nLeave unknown fields blank or null.\n\nVoice Notes:\n${transcripts.map((t, i) => `Note ${i + 1}:\n${t}`).join('\n\n')}`,
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
                disposal_needed: { type: 'string', description: 'For Rough Grading: Yes or No' }
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