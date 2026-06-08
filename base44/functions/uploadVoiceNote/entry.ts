import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const areaId = formData.get('areaId');
    const duration = parseFloat(formData.get('duration')) || 0;

    if (!file || !areaId) {
      return Response.json({ error: 'Missing file or areaId' }, { status: 400 });
    }

    const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const audioUrl = uploadRes.file_url;
    
    if (!audioUrl) {
      return Response.json({ error: 'Upload failed - no file URL returned' }, { status: 500 });
    }

    const note = await base44.asServiceRole.entities.VoiceNote.create({
      area_id: areaId,
      audio_url: audioUrl,
      duration
    });

    return Response.json({ note });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});