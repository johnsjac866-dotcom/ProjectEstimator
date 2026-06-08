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
    for (const dataUrl of dataUrls) {
      try {
        const [header, data] = dataUrl.split(',');
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'audio/webm' });

        const formData = new FormData();
        formData.append('file', blob, 'voice-note.webm');
        const uploadRes = await fetch('https://api.base44.io/files/upload', {
          method: 'POST',
          body: formData,
          headers: { 'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_TOKEN') || ''}` }
        });
        const uploadData = await uploadRes.json();
        const audioUrl = uploadData.url;

        const transcript = await base44.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
        transcripts.push(transcript);
      } catch {
        // Skip on error, continue with other notes
      }
    }

    if (transcripts.length === 0) return Response.json({ error: 'No transcripts generated' }, { status: 400 });

    // Analyze all transcripts together
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a landscaping project analyst. Analyze these voice notes from a site visit and extract a consolidated summary with key insights, action items, and observations. Identify patterns and priorities across all notes.\n\nVoice Notes:\n${transcripts.map((t, i) => `Note ${i + 1}:\n${t}`).join('\n\n')}`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Overall summary of all notes' },
          key_items: { type: 'array', items: { type: 'string' }, description: 'Key observations and action items prioritized across all notes' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Relevant tags for the area (e.g., "drainage", "planting", "urgent")' }
        }
      }
    });

    return Response.json({ analysis });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});