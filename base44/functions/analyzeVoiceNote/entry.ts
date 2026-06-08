import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dataUrl } = await req.json();
    if (!dataUrl) return Response.json({ error: 'Missing dataUrl' }, { status: 400 });

    // Convert data URL to blob
    const [header, data] = dataUrl.split(',');
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/webm' });

    // Upload the blob
    const formData = new FormData();
    formData.append('file', blob, 'voice-note.webm');
    const uploadRes = await fetch('https://api.base44.io/files/upload', {
      method: 'POST',
      body: formData,
      headers: { 'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_TOKEN') || ''}` }
    });
    const uploadData = await uploadRes.json();
    const audioUrl = uploadData.url;

    // Transcribe
    const transcript = await base44.integrations.Core.TranscribeAudio({ audio_url: audioUrl });

    // Analyze
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a landscaping project analyst. Analyze this voice note from a site visit and extract key insights, action items, and observations. Be concise.\n\nTranscript:\n${transcript}`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Brief summary of the note' },
          key_items: { type: 'array', items: { type: 'string' }, description: 'Key observations or action items' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Relevant tags (e.g., "drainage", "planting")' }
        }
      }
    });

    return Response.json({ transcript, analysis });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});