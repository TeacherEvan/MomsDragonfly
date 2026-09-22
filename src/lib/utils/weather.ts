/** WMO weather code → human label + emoji (covers all Open-Meteo codes). */
export interface WeatherInfo {
  label: string;
  emoji: string;
}

const WMO: Record<number, WeatherInfo> = {
  0: { label: "Clear sky", emoji: "☀️" },
  1: { label: "Mainly clear", emoji: "🌤️" },
  2: { label: "Partly cloudy", emoji: "⛅" },
  3: { label: "Overcast", emoji: "☁️" },
  45: { label: "Fog", emoji: "🌫️" },
  48: { label: "Rime fog", emoji: "🌫️" },
  51: { label: "Light drizzle", emoji: "🌦️" },
  53: { label: "Drizzle", emoji: "🌦️" },
  55: { label: "Heavy drizzle", emoji: "🌧️" },
  56: { label: "Freezing drizzle", emoji: "🌧️" },
  57: { label: "Freezing drizzle", emoji: "🌧️" },
  61: { label: "Light rain", emoji: "🌦️" },
  63: { label: "Rain", emoji: "🌧️" },
  65: { label: "Heavy rain", emoji: "🌧️" },
  66: { label: "Freezing rain", emoji: "🌧️" },
  67: { label: "Freezing rain", emoji: "🌧️" },
  71: { label: "Light snow", emoji: "🌨️" },
  73: { label: "Snow", emoji: "🌨️" },
  75: { label: "Heavy snow", emoji: "❄️" },
  77: { label: "Snow grains", emoji: "❄️" },
  80: { label: "Light showers", emoji: "🌦️" },
  81: { label: "Showers", emoji: "🌧️" },
  82: { label: "Heavy showers", emoji: "⛈️" },
  85: { label: "Snow showers", emoji: "🌨️" },
  86: { label: "Snow showers", emoji: "🌨️" },
  95: { label: "Thunderstorm", emoji: "⛈️" },
  96: { label: "Thunderstorm, hail", emoji: "⛈️" },
  99: { label: "Thunderstorm, hail", emoji: "⛈️" },
};

export function weatherInfo(code: number): WeatherInfo {
  return WMO[code] ?? { label: "Weather", emoji: "🌡️" };
}