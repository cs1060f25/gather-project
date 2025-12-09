import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input } = req.query;

  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Missing input parameter' });
  }

  const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Places API key not configured' });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      new URLSearchParams({
        input,
        key: apiKey,
        types: 'establishment|geocode'
      })
    );

    if (!response.ok) {
      throw new Error(`Google API responded with ${response.status}`);
    }

    const data = await response.json();
    
    // Return simplified predictions
    const predictions = (data.predictions || []).map((p: any) => ({
      description: p.description,
      placeId: p.place_id
    }));

    return res.status(200).json({ predictions });
  } catch (error) {
    console.error('Places API error:', error);
    return res.status(500).json({ error: 'Failed to fetch place suggestions' });
  }
}
