'use client';

import { useEffect, useState } from 'react';

type WeatherData = {
  temperature_2m: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
};

export function WeatherCard({ className }: { className?: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(localStorage.getItem('cb-geo-allowed') === '1');
  }, []);

  useEffect(() => {
    if (!allowed) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,wind_speed_10m,wind_direction_10m`,
        )
          .then((r) => r.json())
          .then((data: { current: WeatherData }) => {
            setWeather(data.current);
            setLoading(false);
          })
          .catch(() => {
            setError(true);
            setLoading(false);
          });
      },
      () => {
        setError(true);
        setLoading(false);
      },
    );
  }, [allowed]);

  function handleAllow() {
    localStorage.setItem('cb-geo-allowed', '1');
    setAllowed(true);
  }

  return (
    <div
      className={`cb-card ${className ?? ''}`}
      style={{
        padding: '16px 20px',
        background: 'var(--cb-bg-elev)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{ color: 'var(--cb-ink-3)' }}>
        <CloudIcon />
      </div>
      <div style={{ flex: 1 }}>
        <div className="cb-eyebrow" style={{ marginBottom: 4 }}>
          Météo locale
        </div>
        {loading && (
          <div className="cb-muted" style={{ fontSize: 14 }}>
            Chargement...
          </div>
        )}
        {error && (
          <div className="cb-faint" style={{ fontSize: 14 }}>
            Météo indisponible
          </div>
        )}
        {weather && !loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span className="cb-display cb-tabular" style={{ fontSize: '1.375rem' }}>
              {Math.round(weather.temperature_2m)}
              <span className="cb-muted" style={{ fontSize: 13 }}>
                &nbsp;°C
              </span>
            </span>
            <span className="cb-muted" style={{ fontSize: 13 }}>
              Vent {Math.round(weather.wind_speed_10m)} km/h ({weather.wind_direction_10m}°)
            </span>
          </div>
        )}
        {!allowed && !loading && !weather && (
          <button
            type="button"
            onClick={handleAllow}
            className="cb-btn cb-btn--ghost"
            style={{ minHeight: 36, padding: '0 12px', fontSize: 13, marginTop: 2 }}
          >
            Autoriser la géolocalisation
          </button>
        )}
      </div>
    </div>
  );
}

function CloudIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Météo</title>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
    </svg>
  );
}
