import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { fetchWeatherForCity } from '../weather';

export default function ClientLayout() {
  const [weather, setWeather] = useState(null);
  const location = useLocation();

  const refreshWeather = () => {
    fetchWeatherForCity('Chennai').then(setWeather).catch(() => null);
  };

  useEffect(() => {
    fetchWeatherForCity('Chennai').then(setWeather).catch(() => null);
  }, []);

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Outlet context={{ weather, refreshWeather }} />
      </main>
    </div>
  );
}
