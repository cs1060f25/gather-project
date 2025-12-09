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

  const { input, lat, lon } = req.query;

  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Missing input parameter' });
  }

  const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Places API key not configured' });
  }

  try {
    // Build params with location bias if provided
    const params: Record<string, string> = {
      input,
      key: apiKey,
      // Allow searching by establishment names, addresses, and regions
      types: 'establishment'
    };

    // Add location bias if coordinates provided (50km radius)
    if (lat && lon && typeof lat === 'string' && typeof lon === 'string') {
      params.location = `${lat},${lon}`;
      params.radius = '50000'; // 50km radius for location bias
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      new URLSearchParams(params)
    );

    if (!response.ok) {
      throw new Error(`Google API responded with ${response.status}`);
    }

    const data = await response.json();
    
    // If no results with establishment type, try without type restriction
    if ((!data.predictions || data.predictions.length === 0)) {
      const fallbackParams = { ...params };
      delete fallbackParams.types;
      
      const fallbackResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
        new URLSearchParams(fallbackParams)
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.predictions && fallbackData.predictions.length > 0) {
          return res.status(200).json({
            predictions: fallbackData.predictions.map((p: any) => ({
              description: p.description,
              placeId: p.place_id,
              mainText: p.structured_formatting?.main_text,
              secondaryText: p.structured_formatting?.secondary_text
            }))
          });
        }
      }
    }
    
    // Return simplified predictions with more details
    const predictions = (data.predictions || []).map((p: any) => ({
      description: p.description,
      placeId: p.place_id,
      mainText: p.structured_formatting?.main_text,
      secondaryText: p.structured_formatting?.secondary_text
    }));

    return res.status(200).json({ predictions });
  } catch (error) {
    console.error('Places API error:', error);
    return res.status(500).json({ error: 'Failed to fetch place suggestions' });
  }
}
