import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not configured');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Get audio data from request body (base64 encoded)
    const { audio } = req.body as { audio?: string };
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    
    // Create form data for OpenAI Whisper API
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const formParts: string[] = [];
    
    // Add file part
    formParts.push(`--${boundary}`);
    formParts.push('Content-Disposition: form-data; name="file"; filename="audio.webm"');
    formParts.push('Content-Type: audio/webm');
    formParts.push('');
    
    // Add model part
    const modelPart = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="model"',
      '',
      'whisper-1',
    ].join('\r\n');
    
    // Add language part
    const languagePart = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="language"',
      '',
      'en',
    ].join('\r\n');
    
    const endBoundary = `\r\n--${boundary}--`;
    
    // Combine all parts with audio buffer
    const preAudio = formParts.join('\r\n') + '\r\n';
    const postAudio = '\r\n' + modelPart + '\r\n' + languagePart + endBoundary;
    
    const preBuffer = Buffer.from(preAudio);
    const postBuffer = Buffer.from(postAudio);
    const fullBody = Buffer.concat([preBuffer, audioBuffer, postBuffer]);

    // Send to OpenAI Whisper API for transcription
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: fullBody,
    });

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text();
      console.error('Whisper API error:', error);
      return res.status(500).json({ error: 'Transcription failed' });
    }

    const transcription = await whisperResponse.json() as { text: string };
    const rawText = transcription.text;

    // Clean up the transcription with GPT to make it more natural
    const cleanupResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a text cleanup assistant. Clean up the following voice transcription to be more natural and readable for a scheduling context. Fix any obvious transcription errors, remove filler words (um, uh, like), and format it as a clear scheduling request. Keep it concise. Only return the cleaned text, nothing else.`
          },
          {
            role: 'user',
            content: rawText
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!cleanupResponse.ok) {
      // If cleanup fails, just return the raw transcription
      return res.status(200).json({ text: rawText });
    }

    const cleanupResult = await cleanupResponse.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const cleanedText = cleanupResult.choices[0]?.message?.content || rawText;

    return res.status(200).json({ text: cleanedText.trim() });
  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({ error: 'Failed to process audio' });
  }
}
