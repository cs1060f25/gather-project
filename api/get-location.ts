import type { VercelRequest, VercelResponse } from '@vercel/node';

// Get user's location from IP address without requiring browser permissions
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get IP from Vercel headers (most accurate) or fallback
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = typeof forwardedFor === 'string' 
      ? forwardedFor.split(',')[0].trim()
      : req.headers['x-real-ip'] as string || '8.8.8.8';

    // Use ip-api.com (free, no API key needed, 45 requests/minute)
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,lat,lon,timezone`);
    
    if (!geoResponse.ok) {
      throw new Error('Geo lookup failed');
    }

    const geoData = await geoResponse.json();

    if (geoData.status === 'success') {
      return res.status(200).json({
        city: geoData.city,
        region: geoData.regionName,
        country: geoData.country,
        lat: geoData.lat,
        lon: geoData.lon,
        timezone: geoData.timezone,
        locationString: `${geoData.city}, ${geoData.regionName}, ${geoData.country}`
      });
    }

    // Fallback to default (Cambridge, MA area for Harvard)
    return res.status(200).json({
      city: 'Cambridge',
      region: 'Massachusetts',
      country: 'United States',
      lat: 42.3736,
      lon: -71.1097,
      timezone: 'America/New_York',
      locationString: 'Cambridge, Massachusetts, United States'
    });
  } catch (error) {
    console.error('Error getting location:', error);
    
    // Return default location on error
    return res.status(200).json({
      city: 'Cambridge',
      region: 'Massachusetts',
      country: 'United States',
      lat: 42.3736,
      lon: -71.1097,
      timezone: 'America/New_York',
      locationString: 'Cambridge, Massachusetts, United States'
    });
  }
}
