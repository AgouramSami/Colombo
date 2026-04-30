'use client';

import type { LatLngBoundsExpression, Layer, Map as LeafletMap, Polyline } from 'leaflet';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import {
  addNoteAction,
  addTrainingAction,
  deleteNoteAction,
  deleteTrainingAction,
} from './actions';
import type { CareerEntry, ParentPigeon, PigeonNote, Training } from './page';

type Tab = 'career' | 'pedigree' | 'trainings' | 'notes';

export function PigeonDetailTabs({
  career,
  trainings: initialTrainings,
  notes: initialNotes,
  fatherPigeon,
  motherPigeon,
  fatherMatricule,
  motherMatricule,
  matricule,
}: {
  career: CareerEntry[];
  trainings: Training[];
  notes: PigeonNote[];
  fatherPigeon: ParentPigeon;
  motherPigeon: ParentPigeon;
  fatherMatricule: string | null;
  motherMatricule: string | null;
  matricule: string;
}) {
  const [tab, setTab] = useState<Tab>('career');

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'career', label: 'Carrière', count: career.length },
    { id: 'pedigree', label: 'Pedigree' },
    { id: 'trainings', label: 'Entraînements', count: initialTrainings.length || undefined },
    { id: 'notes', label: 'Notes', count: initialNotes.length || undefined },
  ];

  return (
    <>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid var(--cb-line)',
          marginBottom: 22,
          overflowX: 'auto',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="cb-btn"
            style={{
              minHeight: 52,
              padding: '0 18px',
              borderRadius: 0,
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--cb-accent)' : '2px solid transparent',
              background: 'transparent',
              color: tab === t.id ? 'var(--cb-ink)' : 'var(--cb-ink-3)',
              fontWeight: tab === t.id ? 700 : 500,
              marginBottom: -1,
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="cb-muted" style={{ fontWeight: 500, marginLeft: 6 }}>
                · {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'career' && <CareerTab career={career} />}
      {tab === 'pedigree' && (
        <PedigreeTab
          fatherPigeon={fatherPigeon}
          motherPigeon={motherPigeon}
          fatherMatricule={fatherMatricule}
          motherMatricule={motherMatricule}
        />
      )}
      {tab === 'trainings' && (
        <TrainingsTab initialTrainings={initialTrainings} matricule={matricule} />
      )}
      {tab === 'notes' && <NotesTab initialNotes={initialNotes} matricule={matricule} />}
    </>
  );
}

// --------------- Career tab (unchanged) ---------------

function CareerTab({ career }: { career: CareerEntry[] }) {
  if (career.length === 0) {
    return (
      <div className="cb-card" style={{ padding: 48, textAlign: 'center' }}>
        <p className="cb-muted" style={{ fontSize: '1.125rem' }}>
          Aucun résultat de concours enregistré pour ce pigeon.
        </p>
        <p className="cb-faint" style={{ marginTop: 8 }}>
          Les résultats seront importés automatiquement depuis Francolomb.
        </p>
      </div>
    );
  }

  const velocities = career.map((r) => r.velocity).filter((v) => v > 0);
  const minV = Math.min(...velocities);
  const maxV = Math.max(...velocities);
  const range = maxV - minV || 1;
  const avgV = velocities.reduce((sum, v) => sum + v, 0) / Math.max(velocities.length, 1);
  const top10Rate = Math.round((career.filter((r) => r.place <= 10).length / career.length) * 100);
  const bestPlace = Math.min(...career.map((r) => r.place));

  const chartPts = [...career].reverse().map((r, i, arr) => ({
    x: 30 + (i / Math.max(arr.length - 1, 1)) * 760,
    y: 20 + (1 - (r.velocity - minV) / range) * 160,
    r,
  }));

  const linePath = chartPts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L${chartPts[chartPts.length - 1]?.x ?? 0} 180 L${chartPts[0]?.x ?? 0} 180 Z`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        <CareerKpi label="Concours" value={career.length} />
        <CareerKpi
          label="Meilleure place"
          value={`${bestPlace}${bestPlace === 1 ? 'er' : 'e'}`}
          accent={bestPlace <= 3}
        />
        <CareerKpi label="Vitesse moyenne" value={`${Math.round(avgV)} m/min`} />
        <CareerKpi label="Top 10" value={`${top10Rate}%`} accent={top10Rate >= 25} />
      </div>

      <div className="cb-card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 className="cb-section-title" style={{ margin: 0 }}>
            Évolution de la vitesse
          </h3>
          <span className="cb-muted" style={{ fontSize: 14 }}>
            Saison · {career.length} concours
          </span>
        </div>
        <div className="cb-career-legend" style={{ marginBottom: 8 }}>
          <span className="cb-faint" style={{ fontSize: 12 }}>
            Min: {Math.round(minV)} m/min
          </span>
          <span className="cb-faint" style={{ fontSize: 12 }}>
            Max: {Math.round(maxV)} m/min
          </span>
        </div>
        <svg viewBox="0 0 800 200" style={{ width: '100%', height: 220 }} aria-hidden="true">
          <title>Évolution de la vitesse</title>
          <defs>
            <linearGradient id="careergrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9a3412" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#9a3412" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1="30"
              x2="790"
              y1={20 + t * 160}
              y2={20 + t * 160}
              stroke="#e7dcc5"
              strokeWidth="1"
            />
          ))}
          <path d={areaPath} fill="url(#careergrad)" />
          <path d={linePath} stroke="#9a3412" strokeWidth="2.5" fill="none" />
          {chartPts.map((p) => (
            <circle
              key={`${p.x}-${p.y}`}
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#fbf6ec"
              stroke="#9a3412"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      <div className="cb-card" style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--cb-line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 className="cb-section-title" style={{ margin: 0 }}>
            Historique détaillé
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            className="cb-career-table"
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, minWidth: 760 }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--cb-bg-sunken)',
                  color: 'var(--cb-ink-3)',
                  textAlign: 'left',
                }}
              >
                {['Date', 'Concours', 'Dist.', 'Place', 'Vitesse', '%'].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: `12px ${i === 0 ? '22px' : '16px'}`,
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      textAlign: i >= 2 ? 'right' : 'left',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {career.map((r) => (
                <tr
                  key={`${r.race}-${r.date}`}
                  style={{ borderTop: '1px solid var(--cb-line-2)', height: 54 }}
                >
                  <td style={{ padding: '10px 22px' }}>
                    {r.date
                      ? new Date(r.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{r.race}</div>
                    <div className="cb-muted" style={{ fontSize: 12 }}>
                      {r.category}
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }} className="cb-tabular">
                    {r.distanceKm ? `${r.distanceKm} km` : '—'}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <span
                      className="cb-display cb-tabular"
                      style={{
                        fontSize: '1.125rem',
                        color: r.place <= 3 ? 'var(--cb-accent)' : 'var(--cb-ink)',
                      }}
                    >
                      {r.place}
                    </span>
                    {(r.pigeonsReleased ?? r.engaged) && (
                      <span className="cb-muted" style={{ fontSize: 13 }}>
                        /{r.pigeonsReleased ?? r.engaged}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }} className="cb-tabular">
                    {r.velocity.toFixed(1)}
                  </td>
                  <td style={{ padding: '10px 22px', textAlign: 'right' }} className="cb-tabular">
                    {r.pct !== null ? (
                      <span
                        style={{
                          color:
                            r.pct <= 2
                              ? 'var(--cb-positive)'
                              : r.pct <= 5
                                ? 'var(--cb-ink-2)'
                                : 'var(--cb-ink-4)',
                          fontWeight: 600,
                        }}
                      >
                        {r.pct}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        .cb-career-legend {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }
        @media (max-width: 680px) {
          .cb-career-table th,
          .cb-career-table td {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}

function CareerKpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="cb-card" style={{ padding: '12px 14px', background: 'var(--cb-bg-elev)' }}>
      <div
        className="cb-faint"
        style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}
      >
        {label}
      </div>
      <div
        className="cb-display cb-tabular"
        style={{
          fontSize: '1.3rem',
          marginTop: 4,
          color: accent ? 'var(--cb-accent)' : 'var(--cb-ink)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// --------------- Pedigree tab ---------------

function PedigreeTab({
  fatherPigeon,
  motherPigeon,
  fatherMatricule,
  motherMatricule,
}: {
  fatherPigeon: ParentPigeon;
  motherPigeon: ParentPigeon;
  fatherMatricule: string | null;
  motherMatricule: string | null;
}) {
  return (
    <div className="cb-card" style={{ padding: 28 }}>
      <h3 className="cb-section-title">Filiation</h3>
      <p className="cb-muted" style={{ marginTop: 0, marginBottom: 24 }}>
        Cliquez sur un parent pour ouvrir sa fiche.
      </p>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 700 }}
        className="cb-pedigree-grid"
      >
        <PedigreeNode pigeon={fatherPigeon} label="Père" fallbackMatricule={fatherMatricule} />
        <PedigreeNode pigeon={motherPigeon} label="Mère" fallbackMatricule={motherMatricule} />
      </div>

      <style>{`
        @media (max-width: 560px) {
          .cb-pedigree-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function PedigreeNode({
  pigeon,
  label,
  fallbackMatricule,
}: {
  pigeon: ParentPigeon;
  label: string;
  fallbackMatricule: string | null;
}) {
  const displayMatricule =
    pigeon?.displayMatricule ?? fallbackMatricule?.replaceAll('-', ' ') ?? null;

  if (!displayMatricule) {
    return (
      <div
        className="cb-card"
        style={{
          padding: 16,
          background: 'var(--cb-bg-sunken)',
          borderStyle: 'dashed',
          opacity: 0.6,
        }}
      >
        <div className="cb-muted" style={{ fontSize: 12, fontWeight: 600 }}>
          {label}
        </div>
        <div className="cb-faint" style={{ fontSize: 14, marginTop: 4 }}>
          Non renseigné
        </div>
      </div>
    );
  }

  const content = (
    <>
      <div className="cb-muted" style={{ fontSize: 12, fontWeight: 600 }}>
        {label}
      </div>
      <div className="cb-matricule" style={{ fontWeight: 700, marginTop: 4 }}>
        {displayMatricule}
      </div>
      {pigeon?.name && (
        <div
          style={{
            fontFamily: 'var(--cb-font-display)',
            fontWeight: 600,
            fontSize: '1.125rem',
            marginTop: 4,
          }}
        >
          « {pigeon.name} »
        </div>
      )}
      {pigeon?.color && (
        <div className="cb-muted" style={{ fontSize: 13, marginTop: 4 }}>
          {pigeon.color}
        </div>
      )}
    </>
  );

  if (pigeon?.matricule) {
    return (
      <a
        href={`/pigeonnier/${pigeon.matricule}`}
        className="cb-card"
        style={{
          padding: 16,
          display: 'block',
          textDecoration: 'none',
          background: pigeon.isFemale
            ? 'color-mix(in oklab, #c2185b 8%, var(--cb-bg-elev))'
            : 'color-mix(in oklab, var(--cb-accent) 6%, var(--cb-bg-elev))',
          border: '1px solid var(--cb-line)',
          cursor: 'pointer',
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <div className="cb-card" style={{ padding: 16 }}>
      {content}
    </div>
  );
}

type GeoPoint = { lat: number; lon: number };
type PlaceSuggestion = { label: string; point: GeoPoint; kind: 'place' };
type GeoSuggestion = { label: string; kind: 'geo' };
type LocationSuggestion = PlaceSuggestion | GeoSuggestion;
const FRANCE_BOUNDS: LatLngBoundsExpression = [
  [41.2, -5.5],
  [51.3, 9.8],
];
const FRANCE_BOUNDS_TUPLE: [[number, number], [number, number]] = [
  [41.2, -5.5],
  [51.3, 9.8],
];

function TrainingAssistCard({
  releasePoint,
  arrivalPoint,
  onReleasePointChange,
  onArrivalPointChange,
  onDistanceDetected,
  onWeatherDetected,
}: {
  releasePoint: string;
  arrivalPoint: string;
  onReleasePointChange: (value: string) => void;
  onArrivalPointChange: (value: string) => void;
  onDistanceDetected: (distanceKm: number) => void;
  onWeatherDetected: (summary: string) => void;
}) {
  const [me, setMe] = useState<GeoPoint | null>(null);
  const [startPoint, setStartPoint] = useState<GeoPoint | null>(null);
  const [endPoint, setEndPoint] = useState<GeoPoint | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [weatherLine, setWeatherLine] = useState<string>('');
  const [releaseSuggestions, setReleaseSuggestions] = useState<PlaceSuggestion[]>([]);
  const [arrivalSuggestions, setArrivalSuggestions] = useState<LocationSuggestion[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'geo' | 'target' | null>(null);
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<Layer | null>(null);
  const lineRef = useRef<Polyline | null>(null);
  const arrivalBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geoSuggestion = useCallback(
    (): GeoSuggestion => ({ label: '📍 Ma position actuelle', kind: 'geo' }),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let handleResize: (() => void) | null = null;
    const initMap = async () => {
      if (!mapElRef.current || mapRef.current) return;
      const L = await import('leaflet');
      if (cancelled || !mapElRef.current) return;
      const map = L.map(mapElRef.current, {
        zoomControl: true,
        maxBounds: FRANCE_BOUNDS,
        maxBoundsViscosity: 1,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap France, OpenStreetMap contributors',
      }).addTo(map);
      map.fitBounds(FRANCE_BOUNDS, { animate: false });
      setTimeout(() => map.invalidateSize(), 0);
      handleResize = () => {
        map.invalidateSize();
      };
      window.addEventListener('resize', handleResize);
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapElRef.current);
      mapRef.current = map;
    };
    void initMap();
    return () => {
      cancelled = true;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapRef.current) {
        if (handleResize) {
          window.removeEventListener('resize', handleResize);
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    const draw = async () => {
      const L = await import('leaflet');
      if (cancelled || !mapRef.current) return;

      if (layerRef.current) {
        mapRef.current.removeLayer(layerRef.current);
      }
      if (lineRef.current) {
        mapRef.current.removeLayer(lineRef.current);
      }

      const group = L.layerGroup();
      if (startPoint) {
        L.circleMarker([startPoint.lat, startPoint.lon], {
          radius: 7,
          color: '#9a3412',
          weight: 2,
          fillOpacity: 0.25,
        })
          .bindPopup('Lieu de lâcher')
          .addTo(group);
      }

      if (endPoint) {
        L.circleMarker([endPoint.lat, endPoint.lon], {
          radius: 7,
          color: '#0f766e',
          weight: 2,
          fillOpacity: 0.25,
        })
          .bindPopup('Lieu d’arrivée')
          .addTo(group);
      }

      if (startPoint && endPoint) {
        lineRef.current = L.polyline(
          [
            [startPoint.lat, startPoint.lon],
            [endPoint.lat, endPoint.lon],
          ],
          { color: '#9a3412', weight: 2 },
        ).addTo(mapRef.current);
      }

      group.addTo(mapRef.current);
      layerRef.current = group;

      const bounds =
        startPoint && endPoint
          ? L.latLngBounds([
              [startPoint.lat, startPoint.lon],
              [endPoint.lat, endPoint.lon],
            ])
          : startPoint
            ? L.latLngBounds([
                [startPoint.lat, startPoint.lon],
                [startPoint.lat, startPoint.lon],
              ])
            : endPoint
              ? L.latLngBounds([
                  [endPoint.lat, endPoint.lon],
                  [endPoint.lat, endPoint.lon],
                ])
              : L.latLngBounds(FRANCE_BOUNDS_TUPLE);
      mapRef.current.fitBounds(bounds.pad(0.35), {
        animate: false,
        maxZoom: startPoint && endPoint ? 10 : 12,
      });
    };
    void draw();
    return () => {
      cancelled = true;
    };
  }, [startPoint, endPoint]);

  useEffect(() => {
    if (startPoint && endPoint) {
      const km = haversineKm(startPoint, endPoint);
      setDistance(km);
      onDistanceDetected(km);
    } else {
      setDistance(null);
    }
  }, [startPoint, endPoint, onDistanceDetected]);

  const detectMyPositionAsArrival = () => {
    setError('');
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLoading('geo');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const point = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setMe(point);
        setEndPoint(point);
        onArrivalPointChange('Ma position actuelle');
        setArrivalSuggestions([]);
        setLoading(null);
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m`;
          const resp = await fetch(url, { cache: 'no-store' });
          const data = await resp.json();
          const current = data?.current;
          if (current) {
            const summary = `${Math.round(current.temperature_2m)}°C · vent ${Math.round(current.wind_speed_10m)} km/h (${Math.round(current.wind_direction_10m)}°)`;
            setWeatherLine(summary);
            onWeatherDetected(summary);
          }
        } catch {
          // non bloquant
        }
      },
      () => {
        setError("Impossible d'obtenir votre position.");
        setLoading(null);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const geocodeAddress = useCallback(async (value: string): Promise<PlaceSuggestion[]> => {
    const q = encodeURIComponent(`${value.trim()}, France`);
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=fr&q=${q}`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      },
    );
    const data = (await resp.json()) as Array<{ display_name: string; lat: string; lon: string }>;
    return data.map((d) => ({
      label: d.display_name,
      point: { lat: Number(d.lat), lon: Number(d.lon) },
      kind: 'place',
    }));
  }, []);

  useEffect(() => {
    const value = releasePoint.trim();
    if (value.length < 3) {
      setReleaseSuggestions([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const suggestions = await geocodeAddress(value);
        if (active) setReleaseSuggestions(suggestions);
      } catch {
        if (active) setReleaseSuggestions([]);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [releasePoint, geocodeAddress]);

  useEffect(() => {
    const value = arrivalPoint.trim();
    if (value.length < 3 || value === 'Ma position actuelle') {
      setArrivalSuggestions([geoSuggestion()]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const suggestions = await geocodeAddress(value);
        if (active) setArrivalSuggestions([geoSuggestion(), ...suggestions]);
      } catch {
        if (active) setArrivalSuggestions([geoSuggestion()]);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [arrivalPoint, geocodeAddress, geoSuggestion]);

  const locateReleasePoint = async () => {
    setError('');
    if (!releasePoint.trim()) {
      setError('Renseignez un lieu de lâcher.');
      return;
    }
    setLoading('target');
    try {
      const data = await geocodeAddress(releasePoint);
      const firstSuggestion = data.at(0);
      if (!firstSuggestion) {
        setError('Lieu introuvable. Essayez avec plus de détails.');
        setLoading(null);
        return;
      }
      onReleasePointChange(firstSuggestion.label);
      setStartPoint(firstSuggestion.point);
      setReleaseSuggestions([]);
      if (arrivalPoint.trim() === 'Ma position actuelle' && me) {
        setEndPoint(me);
      }
    } catch {
      setError('Erreur de localisation du lieu.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="cb-card"
      style={{
        padding: 16,
        marginBottom: 16,
        background: 'linear-gradient(180deg, var(--cb-bg-elev) 0%, var(--cb-bg) 100%)',
      }}
    >
      <h4 className="cb-section-title" style={{ margin: 0 }}>
        Assistant vol d&apos;oiseau
      </h4>
      <p className="cb-muted" style={{ marginTop: 6, marginBottom: 12, fontSize: 14 }}>
        Géolocalisez-vous, récupérez la météo locale, puis calculez la distance à vol d&apos;oiseau
        du lieu de lâcher.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 10 }}>
        <div style={{ position: 'relative' }}>
          <label className="cb-label" htmlFor="assist-start">
            Lieu de lâcher
          </label>
          <input
            id="assist-start"
            className="cb-input"
            placeholder="Ex : Issoudun"
            value={releasePoint}
            onChange={(e) => {
              onReleasePointChange(e.target.value);
              setStartPoint(null);
            }}
          />
          {releaseSuggestions.length > 0 && (
            <div className="cb-assist-suggestions">
              {releaseSuggestions.map((s) => (
                <button
                  type="button"
                  key={`${s.point.lat}-${s.point.lon}`}
                  className="cb-assist-suggestion"
                  onClick={() => {
                    onReleasePointChange(s.label);
                    setStartPoint(s.point);
                    setReleaseSuggestions([]);
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <label className="cb-label" htmlFor="assist-end">
            Lieu d&apos;arrivée
          </label>
          <input
            id="assist-end"
            className="cb-input"
            placeholder="Ex : Mon pigeonnier"
            value={arrivalPoint}
            onFocus={() => {
              if (arrivalBlurTimerRef.current) clearTimeout(arrivalBlurTimerRef.current);
              if (arrivalSuggestions.length === 0) setArrivalSuggestions([geoSuggestion()]);
            }}
            onBlur={() => {
              arrivalBlurTimerRef.current = setTimeout(() => {
                setArrivalSuggestions([]);
              }, 120);
            }}
            onChange={(e) => {
              onArrivalPointChange(e.target.value);
              if (e.target.value.trim() !== 'Ma position actuelle') setEndPoint(null);
            }}
          />
          {arrivalSuggestions.length > 0 && (
            <div className="cb-assist-suggestions">
              {arrivalSuggestions.map((s) => (
                <button
                  type="button"
                  key={`${s.kind}-${s.label}`}
                  className="cb-assist-suggestion"
                  onClick={() => {
                    if (s.kind === 'geo') {
                      detectMyPositionAsArrival();
                    } else {
                      onArrivalPointChange(s.label);
                      setEndPoint(s.point);
                      setArrivalSuggestions([]);
                    }
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button
          type="button"
          className="cb-btn cb-btn--ghost"
          onClick={locateReleasePoint}
          disabled={loading === 'target'}
        >
          {loading === 'target' ? 'Recherche lieu...' : 'Calculer la distance'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {weatherLine && (
          <span
            className="cb-badge"
            style={{ background: 'var(--cb-bg-sunken)', color: 'var(--cb-ink-2)' }}
          >
            Météo locale: {weatherLine}
          </span>
        )}
        {distance !== null && (
          <span
            className="cb-badge"
            style={{ background: 'var(--cb-accent-soft)', color: 'var(--cb-accent-soft-ink)' }}
          >
            Distance vol d&apos;oiseau: {distance} km
          </span>
        )}
      </div>
      {error && (
        <p role="alert" style={{ color: 'var(--cb-danger)', marginBottom: 8 }}>
          {error}
        </p>
      )}

      <div
        className="cb-faint"
        style={{
          fontSize: 12,
          marginBottom: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Carte France</span>
        <span>Zoom +/− pour affiner</span>
      </div>
      <div
        ref={mapElRef}
        className="cb-training-map"
        style={{ width: '100%', height: 300, borderRadius: 12, border: '1px solid var(--cb-line)' }}
      />
      <style>{`
        .cb-training-map {
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          position: relative;
          isolation: isolate;
        }
        .cb-training-map .leaflet-container {
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
        }
        .cb-assist-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 40;
          background: var(--cb-bg-elev);
          border: 1px solid var(--cb-line);
          border-radius: 10px;
          margin-top: 4px;
          max-height: 180px;
          overflow-y: auto;
          box-shadow: 0 10px 24px rgba(0,0,0,.08);
        }
        .cb-assist-suggestion {
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
          padding: 10px 12px;
          cursor: pointer;
          font-size: 14px;
          color: var(--cb-ink);
        }
        .cb-assist-suggestion:hover {
          background: var(--cb-bg-sunken);
        }
      `}</style>
    </div>
  );
}

function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return Math.round(R * c);
}

// --------------- Trainings tab ---------------

function TrainingsTab({
  initialTrainings,
  matricule,
}: {
  initialTrainings: Training[];
  matricule: string;
}) {
  const [trainings, setTrainings] = useState(initialTrainings);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [releasePoint, setReleasePoint] = useState('');
  const [arrivalPoint, setArrivalPoint] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [weather, setWeather] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      const result = await addTrainingAction(matricule, formData);
      if (result.ok) {
        setShowForm(false);
        setError('');
        setReleasePoint('');
        setArrivalPoint('');
        setDistanceKm('');
        setWeather('');
        form.reset();
      } else {
        setError(result.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteTrainingAction(matricule, id);
      if (result.ok) {
        setTrainings((prev) => prev.filter((t) => t.id !== id));
      }
    });
  };

  return (
    <div>
      <TrainingAssistCard
        releasePoint={releasePoint}
        arrivalPoint={arrivalPoint}
        onReleasePointChange={setReleasePoint}
        onArrivalPointChange={setArrivalPoint}
        onDistanceDetected={(km) => setDistanceKm(String(km))}
        onWeatherDetected={setWeather}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 className="cb-section-title" style={{ margin: 0 }}>
          Carnet d&apos;entraînement
        </h3>
        <button
          type="button"
          className="cb-btn cb-btn--primary"
          onClick={() => setShowForm((v) => !v)}
        >
          <PlusIcon /> Noter un entraînement
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="cb-card cb-fade-up"
          style={{ padding: 22, marginBottom: 16 }}
        >
          <h4
            style={{
              fontFamily: 'var(--cb-font-display)',
              fontSize: '1.25rem',
              marginTop: 0,
              marginBottom: 16,
            }}
          >
            Nouvel entraînement
          </h4>
          {error && (
            <p role="alert" style={{ color: 'var(--cb-danger)', marginBottom: 12 }}>
              {error}
            </p>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
            }}
          >
            <div>
              <label className="cb-label" htmlFor="t-date">
                Date
              </label>
              <input
                id="t-date"
                name="training_date"
                type="date"
                className="cb-input"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div>
              <label className="cb-label" htmlFor="t-point">
                Lieu de lâcher
              </label>
              <input
                id="t-point"
                name="release_point"
                className="cb-input"
                placeholder="Ex : Salon-de-Provence"
                value={releasePoint}
                onChange={(e) => setReleasePoint(e.target.value)}
              />
            </div>
            <div>
              <label className="cb-label" htmlFor="t-dist">
                Distance (km)
              </label>
              <input
                id="t-dist"
                name="distance_km"
                className="cb-input"
                type="number"
                min="1"
                placeholder="30"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
              />
            </div>
            <div>
              <label className="cb-label" htmlFor="t-return">
                Temps de retour
              </label>
              <input id="t-return" name="return_time" className="cb-input" placeholder="01:22:00" />
            </div>
            <div>
              <label className="cb-label" htmlFor="t-weather">
                Météo
              </label>
              <input
                id="t-weather"
                name="weather"
                className="cb-input"
                placeholder="Ensoleillé, vent N"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label className="cb-label" htmlFor="t-notes">
              Observations
            </label>
            <textarea
              id="t-notes"
              name="notes"
              className="cb-input"
              rows={2}
              placeholder="Comportement, conditions particulières..."
            />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="submit" className="cb-btn cb-btn--primary" disabled={isPending}>
              {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              className="cb-btn cb-btn--ghost"
              onClick={() => setShowForm(false)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {trainings.length === 0 && !showForm ? (
        <div className="cb-card" style={{ padding: 40, textAlign: 'center' }}>
          <p className="cb-muted" style={{ fontSize: '1.0625rem' }}>
            Aucun entraînement enregistré pour ce pigeon.
          </p>
          <button
            type="button"
            className="cb-btn cb-btn--soft"
            style={{ marginTop: 16 }}
            onClick={() => setShowForm(true)}
          >
            <PlusIcon /> Ajouter le premier
          </button>
        </div>
      ) : (
        <div className="cb-card" style={{ overflow: 'hidden' }}>
          {trainings.map((t, i) => (
            <div
              key={t.id}
              style={{
                padding: '18px 22px',
                borderTop: i === 0 ? 'none' : '1px solid var(--cb-line-2)',
                display: 'grid',
                gridTemplateColumns: '110px 1fr auto',
                gap: 18,
                alignItems: 'start',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>
                  {new Date(t.training_date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </div>
                {t.return_time && (
                  <div className="cb-muted" style={{ fontSize: 13 }}>
                    retour {t.return_time.slice(0, 5)}
                  </div>
                )}
              </div>
              <div>
                {t.release_point && (
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {t.release_point}
                    {t.distance_km && (
                      <span className="cb-muted" style={{ fontWeight: 400, marginLeft: 6 }}>
                        · {t.distance_km} km
                      </span>
                    )}
                  </div>
                )}
                {t.weather && (
                  <div className="cb-muted" style={{ fontSize: 14 }}>
                    {t.weather}
                  </div>
                )}
                {t.notes && <div style={{ fontSize: 15, marginTop: 4 }}>{t.notes}</div>}
              </div>
              <button
                type="button"
                className="cb-btn cb-btn--ghost"
                style={{ minHeight: 36, padding: '0 10px' }}
                onClick={() => handleDelete(t.id)}
                disabled={isPending}
                aria-label="Supprimer"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------- Notes tab ---------------

function NotesTab({
  initialNotes,
  matricule,
}: {
  initialNotes: PigeonNote[];
  matricule: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bodyVal = text;
    startTransition(async () => {
      const result = await addNoteAction(matricule, formData);
      if (result.ok) {
        setNotes((prev) => [
          { id: crypto.randomUUID(), body: bodyVal, created_at: new Date().toISOString() },
          ...prev,
        ]);
        setText('');
        setError('');
      } else {
        setError(result.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteNoteAction(matricule, id);
      if (result.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    });
  };

  return (
    <div>
      <form onSubmit={handleAdd}>
        <div className="cb-card" style={{ padding: 22, marginBottom: 20 }}>
          <label className="cb-label" htmlFor="note-body">
            Ajouter une note
          </label>
          <textarea
            id="note-body"
            name="body"
            className="cb-input"
            rows={3}
            placeholder="Ex : traité vermifuge, accouplement, observation de santé..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {error && (
            <p role="alert" style={{ color: 'var(--cb-danger)', marginTop: 8 }}>
              {error}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              type="submit"
              className="cb-btn cb-btn--primary"
              disabled={!text.trim() || isPending}
            >
              {isPending ? 'Enregistrement...' : 'Enregistrer la note'}
            </button>
          </div>
        </div>
      </form>

      {notes.length === 0 ? (
        <div className="cb-card" style={{ padding: 32, textAlign: 'center' }}>
          <p className="cb-muted" style={{ fontSize: '1.0625rem' }}>
            Aucune note pour ce pigeon. Utilisez ce carnet pour suivre sa santé, ses soins et vos
            observations.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notes.map((n) => (
            <div key={n.id} className="cb-card" style={{ padding: 18, display: 'flex', gap: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--cb-accent-soft)',
                  color: 'var(--cb-accent-soft-ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <NoteIcon />
              </div>
              <div style={{ flex: 1 }}>
                <div className="cb-muted" style={{ fontSize: 13, marginBottom: 4 }}>
                  {new Date(n.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                <div style={{ fontSize: 16, whiteSpace: 'pre-wrap' }}>{n.body}</div>
              </div>
              <button
                type="button"
                className="cb-btn cb-btn--ghost"
                style={{ minHeight: 36, padding: '0 10px', color: 'var(--cb-ink-4)' }}
                onClick={() => handleDelete(n.id)}
                disabled={isPending}
                aria-label="Supprimer"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------- Icons ---------------

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Ajouter</title>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Supprimer</title>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Note</title>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
