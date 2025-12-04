import { useState, useEffect } from 'react';

interface WeatherData {
    location: string;
    temperature: number;
    condition: string;
    time: string;
    date: string;
}

// Get time and date formatting
const getTimeAndDate = () => {
    const now = new Date();
    const militaryTime = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });
    const dayName = now.toLocaleDateString('en-US', { weekday: 'short' });
    const date = now.getDate();
    const monthName = now.toLocaleDateString('en-US', { month: 'short' });
    const formattedDate = `${dayName} ${monthName} ${date}`;
    return { militaryTime, formattedDate };
};

// US state name to abbreviation
const getStateAbbr = (state: string): string => {
    const states: { [key: string]: string } = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
        'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
        'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
        'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
        'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
        'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
        'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
        'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
        'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
        'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    return states[state] || '';
};

export const LocalInfo = ({ minimal = false }: { minimal?: boolean }) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeatherData = async (latitude: number, longitude: number, city: string, region: string) => {
            try {
                // Get weather using Open-Meteo
                const weatherResponse = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=auto`
                );
                const weatherData = await weatherResponse.json();

                const { militaryTime, formattedDate } = getTimeAndDate();

                // Map weather codes
                const weatherCode = weatherData.current?.weathercode ?? 0;
                const conditionMap: { [key: number]: string } = {
                    0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
                    45: 'Foggy', 48: 'Foggy', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
                    61: 'Rain', 63: 'Rain', 65: 'Heavy Rain', 71: 'Snow', 73: 'Snow',
                    75: 'Heavy Snow', 80: 'Showers', 81: 'Showers', 82: 'Heavy Showers',
                    95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
                };

                setWeather({
                    location: region ? `${city}, ${region}` : city,
                    temperature: Math.round(weatherData.current?.temperature_2m ?? 70),
                    condition: conditionMap[weatherCode] || 'Clear',
                    time: militaryTime,
                    date: formattedDate
                });
                setLoading(false);
            } catch (error) {
                console.error('Weather fetch error:', error);
                const { militaryTime, formattedDate } = getTimeAndDate();
                setWeather({
                    location: region ? `${city}, ${region}` : city,
                    temperature: 70,
                    condition: 'Clear',
                    time: militaryTime,
                    date: formattedDate
                });
                setLoading(false);
            }
        };

        const getLocation = async () => {
            // Use IP-based geolocation (no permission needed)
            try {
                // Try ip-api.com first (more reliable, no rate limiting issues)
                const geoResponse = await fetch('http://ip-api.com/json/?fields=status,city,regionName,lat,lon');
                const geoData = await geoResponse.json();
                
                if (geoData.status === 'success') {
                    const region = getStateAbbr(geoData.regionName) || geoData.regionName;
                    fetchWeatherData(
                        geoData.lat,
                        geoData.lon,
                        geoData.city || 'Unknown',
                        region
                    );
                } else {
                    throw new Error('IP API failed');
                }
            } catch {
                // Fallback to ipapi.co
                try {
                    const geoResponse = await fetch('https://ipapi.co/json/');
                    const geoData = await geoResponse.json();
                    if (geoData.error) throw new Error('IP API error');
                    fetchWeatherData(
                        geoData.latitude,
                        geoData.longitude,
                        geoData.city || 'Unknown',
                        geoData.region_code || ''
                    );
                } catch {
                    // Ultimate fallback - just show time/date
                    const { militaryTime, formattedDate } = getTimeAndDate();
                    setWeather({
                        location: 'Location unavailable',
                        temperature: 70,
                        condition: 'Clear',
                        time: militaryTime,
                        date: formattedDate
                    });
                    setLoading(false);
                }
            }
        };

        getLocation();

        // Update time every minute
        const timeInterval = setInterval(() => {
            setWeather(prev => {
                if (!prev) return prev;
                const now = new Date();
                const militaryTime = now.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                });
                return { ...prev, time: militaryTime };
            });
        }, 60000);

        return () => clearInterval(timeInterval);
    }, []);

    if (loading || !weather) {
        return (
            <div className="info-text">Loading...</div>
        );
    }

    if (minimal) {
        return (
            <div className="local-info-minimal">
                <span>{weather.temperature}°</span>
                <span className="location-minimal">{weather.location.split(',')[0]}</span>
            </div>
        );
    }

    return (
        <>
            <div>{weather.date} • {weather.time}</div>
            <div>{weather.location}</div>
            <div>{weather.temperature}° • {weather.condition}</div>
        </>
    );
};
