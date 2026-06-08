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
        transcripts.push(res.transcript || '');
      } catch (err) {
        console.error('Transcribe error for', url, ':', err.message);
      }
    }

    if (transcripts.length === 0) return Response.json({ error: 'No transcripts generated' }, { status: 400 });

    // Analyze all transcripts together
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a landscaping project analyst. Analyze these voice notes from a site visit and extract a consolidated summary, key insights, recommended operations, and structured data for each operation.\n\nValid operation types: Walkway/Patio, Site Management & Daily Cleanup, Bed Preparation, Rough Grading & Hauling, Demolition & Removals, Bed Edging, Planting, Mulch, Drainage, Lawn Repair & Install, Boulders/Accents & Structures, Hardscape - Repair Existing, Maintenance, Pathway / Steps, Retaining Wall\n\nVoice Notes:\n${transcripts.map((t, i) => `Note ${i + 1}:\n${t}`).join('\n\n')}`,
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
                notes: { type: 'string', description: 'Additional notes or specifications' }
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
    return Response.json({ error: error.message }, { status: 500 });
  }
});