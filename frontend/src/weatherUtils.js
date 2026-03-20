import { CITIES, fetchWeatherForCity, fetchHourlyForecast } from './weather';

export { CITIES, fetchWeatherForCity, fetchHourlyForecast };

export function getWeatherIcon(severity) {
  switch (severity) {
    case 'CRITICAL': return '⚡';
    case 'HIGH': return '🌧️';
    case 'MEDIUM': return '💧';
    case 'LOW': return '🌤️';
    default: return '☀️';
  }
}

export function getWeatherIconSVG(severity) {
  return severity;
}

export function getWeatherColor(severity) {
  const colors = {
    NONE: '#64748b',
    LOW: '#10b981',
    MEDIUM: '#3b82f6',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  };
  return colors[severity] || '#64748b';
}

export function getWeatherBgColor(severity) {
  const colors = {
    NONE: 'rgba(100, 116, 139, 0.1)',
    LOW: 'rgba(16, 185, 129, 0.1)',
    MEDIUM: 'rgba(59, 130, 246, 0.1)',
    HIGH: 'rgba(249, 115, 22, 0.1)',
    CRITICAL: 'rgba(239, 68, 68, 0.1)',
  };
  return colors[severity] || 'rgba(100, 116, 139, 0.1)';
}
