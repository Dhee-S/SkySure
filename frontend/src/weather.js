const CITIES = {
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Coimbatore: { lat: 11.0168, lon: 76.9558 },
  Madurai: { lat: 9.9194, lon: 78.1193 },
  Tiruchirappalli: { lat: 10.7905, lon: 78.7047 },
  Salem: { lat: 11.6643, lon: 78.1460 },
  Vellore: { lat: 12.9165, lon: 79.1325 },
  Tirunelveli: { lat: 8.7139, lon: 77.7566 },
  Erode: { lat: 11.3410, lon: 77.7172 },
  Dindigul: { lat: 10.3694, lon: 77.9776 },
  Thanjavur: { lat: 10.7872, lon: 79.1378 },
};

const CACHE_KEY = 'gigguard_weather_cache';
const CACHE_DURATION = 10 * 60 * 1000;

export { CITIES };

export async function fetchWeatherForCity(cityName) {
  const city = CITIES[cityName] || CITIES.Chennai;
  const cacheKey = `${CACHE_KEY}_${cityName}`;
  const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}');
  
  if (cached.data && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { ...cached.data, source: 'cache' };
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation&forecast_days=1&timezone=auto`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('API error');
    
    const data = await response.json();
    const rainfallMm = data.current.precipitation || 0;
    
    const weather = {
      rainfallMm,
      temperatureC: data.current.temperature_2m || 30,
      humidity: data.current.relative_humidity_2m || 60,
      windKph: data.current.wind_speed_10m || 10,
      weatherCode: data.current.weather_code || 0,
      description: getWeatherDescription(data.current.weather_code || 0),
      severity: getSeverity(rainfallMm),
      city: cityName,
      lat: city.lat,
      lon: city.lon,
      source: 'api',
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(cacheKey, JSON.stringify({ data: weather, timestamp: Date.now() }));
    return weather;
  } catch (error) {
    console.warn(`Weather API failed for ${cityName}:`, error.message);
    return createSimulatedWeather(cityName);
  }
}

export async function fetchWeatherForRiders(riders) {
  const weatherMap = {};
  for (const rider of riders) {
    const city = rider.city || 'Chennai';
    if (!weatherMap[city]) {
      weatherMap[city] = await fetchWeatherForCity(city);
    }
  }
  return weatherMap;
}

export async function fetchHourlyForecast(cityName) {
  const city = CITIES[cityName] || CITIES.Chennai;
  
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&hourly=temperature_2m,precipitation,weather_code&forecast_days=1&timezone=auto`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('API error');
    
    const data = await response.json();
    const now = new Date();
    const currentHour = now.getHours();
    
    return data.hourly.time.slice(currentHour, currentHour + 6).map((time, i) => ({
      hour: new Date(time).getHours(),
      rainfallMm: data.hourly.precipitation[currentHour + i] || 0,
      temperatureC: data.hourly.temperature_2m[currentHour + i] || 30,
      description: getWeatherDescription(data.hourly.weather_code?.[currentHour + i] || 0),
    }));
  } catch (error) {
    return Array.from({ length: 6 }, (_, i) => ({
      hour: (new Date().getHours() + i + 1) % 24,
      rainfallMm: Math.random() * 15,
      temperatureC: 25 + Math.random() * 10,
      description: 'Partly Cloudy',
    }));
  }
}

function getWeatherDescription(code) {
  const codes = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Rime Fog',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Heavy Drizzle',
    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',
    80: 'Rain Showers',
    81: 'Heavy Showers',
    82: 'Violent Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Severe Thunderstorm',
  };
  return codes[code] || 'Unknown';
}

function getSeverity(rainfallMm) {
  if (rainfallMm === 0) return 'NONE';
  if (rainfallMm <= 5) return 'LOW';
  if (rainfallMm <= 12) return 'MEDIUM';
  if (rainfallMm <= 20) return 'HIGH';
  return 'CRITICAL';
}

function createSimulatedWeather(cityName) {
  const scenarios = [
    { rainfallMm: 12, temp: 26, humidity: 85, windKph: 28, description: 'Heavy Rain', severity: 'HIGH', visibility: 4 },
    { rainfallMm: 18, temp: 24, humidity: 90, windKph: 35, description: 'Heavy Rain', severity: 'HIGH', visibility: 3 },
    { rainfallMm: 8, temp: 27, humidity: 80, windKph: 22, description: 'Moderate Rain', severity: 'MEDIUM', visibility: 6 },
    { rainfallMm: 5, temp: 28, humidity: 75, windKph: 18, description: 'Light Rain', severity: 'LOW', visibility: 7 },
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  return {
    ...scenario,
    city: cityName,
    source: 'simulated',
    timestamp: new Date().toISOString(),
  };
}

export function getWeatherIcon(severity) {
  const icons = {
    NONE: '☀️',
    LOW: '🌤️',
    MEDIUM: '🌧️',
    HIGH: '⛈️',
    CRITICAL: '🌪️',
  };
  return icons[severity] || '☀️';
}

export function getWeatherColor(severity) {
  const colors = {
    NONE: '#f59e0b',
    LOW: '#10b981',
    MEDIUM: '#3b82f6',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  };
  return colors[severity] || '#64748b';
}
