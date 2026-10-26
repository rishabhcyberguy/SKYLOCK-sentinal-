import React, { useState, useEffect, useRef } from 'react';
import { isValidIp } from '../utils/airspaceRules';

interface LocationIntelProps {
  isStandalone?: boolean;
}

export const LocationIntel: React.FC<LocationIntelProps> = ({ isStandalone = false }) => {
  const [deviceCoords, setDeviceCoords] = useState<string>('DEVICE POSITION / WAITING FOR FIX');
  const [networkIp, setNetworkIp] = useState<string>('--');
  const [networkProvider, setNetworkProvider] = useState<string>('Querying providers…');
  const [reverseLocation, setReverseLocation] = useState<string>('Awaiting lookup');
  const [reverseSource, setReverseSource] = useState<string>('OpenStreetMap / Nominatim');
  const [locationAccuracy, setLocationAccuracy] = useState<string>('--');
  const [locationSource, setLocationSource] = useState<string>('No active sensor');
  const [locationCoordinates, setLocationCoordinates] = useState<string>('--');
  const [coordinateSource, setCoordinateSource] = useState<string>('Awaiting a location fix');
  const [locationStatus, setLocationStatus] = useState<{ text: string; color: string }>({
    text: 'Waiting for a location source.',
    color: 'amber',
  });

  const [inputIp, setInputIp] = useState<string>('');
  const [streetMapUrl, setStreetMapUrl] = useState<string | null>(null);
  const [satelliteMapUrl, setSatelliteMapUrl] = useState<string | null>(null);
  const [openMapHref, setOpenMapHref] = useState<string>('#');
  const [openSatelliteHref, setOpenSatelliteHref] = useState<string>('#');
  const [isWatchingGps, setIsWatchingGps] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);

  const updateMaps = (lat: number, lon: number) => {
    // Esri World Street Map export tile
    const street = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/export?bbox=${lon - 0.05},${lat - 0.03},${lon + 0.05},${lat + 0.03}&bboxSR=4326&imageSR=4326&size=640,360&f=image`;
    // Esri World Imagery export tile
    const sat = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${lon - 0.05},${lat - 0.03},${lon + 0.05},${lat + 0.03}&bboxSR=4326&imageSR=4326&size=640,360&f=image`;
    const openStreet = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=14/${lat}/${lon}`;

    setStreetMapUrl(street);
    setSatelliteMapUrl(sat);
    setOpenMapHref(openStreet);
    setOpenSatelliteHref(sat);
    setLocationCoordinates(`${lat.toFixed(5)}° N, ${lon.toFixed(5)}° E`);
  };

  const reverseGeocode = async (lat: number, lon: number, sourceLabel: string) => {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      if (resp.ok) {
        const data = await resp.json();
        setReverseLocation(data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        setReverseSource(sourceLabel);
      }
    } catch (_) {
      setReverseLocation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      setReverseSource(sourceLabel);
    }
  };

  const refreshIpLocation = async (targetIp?: string) => {
    setLocationStatus({ text: 'Resolving IP geolocation…', color: 'amber' });
    const encodedIp = targetIp ? `${encodeURIComponent(targetIp)}/` : '';

    try {
      const [ipapiRes, geojsRes] = await Promise.allSettled([
        fetch(`https://ipapi.co/${encodedIp}json/`).then((r) => (r.ok ? r.json() : null)),
        fetch(`https://get.geojs.io/v1/ip/geo/${targetIp ? `${encodeURIComponent(targetIp)}.json` : 'geo.json'}`).then((r) =>
          r.ok ? r.json() : null
        ),
      ]);

      const ipapi = ipapiRes.status === 'fulfilled' ? ipapiRes.value : null;
      const geojs = geojsRes.status === 'fulfilled' ? geojsRes.value : null;
      const usable = ipapi || (Array.isArray(geojs) ? geojs[0] : geojs);

      if (!usable) {
        setLocationStatus({ text: 'Provider did not respond. Local simulation active.', color: 'red' });
        return;
      }

      const ip = usable.ip || targetIp || 'Resolved';
      const city = usable.city || 'Unknown';
      const country = usable.country_name || usable.country || '';
      const lat = Number(usable.latitude);
      const lon = Number(usable.longitude);
      const provider = ipapi ? 'ipapi.co' : 'GeoJS';

      setNetworkIp(ip);
      setNetworkProvider(`${provider} · ${city}, ${country}`);
      setLocationSource(`${city}, ${country} · network signal`);
      setLocationAccuracy('City-level estimate (approximate)');
      setDeviceCoords(`${lat.toFixed(4)}° / ${lon.toFixed(4)}° · IP SIGNAL`);
      setCoordinateSource(`IP geolocation estimate via ${provider}`);

      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        updateMaps(lat, lon);
        reverseGeocode(lat, lon, `OpenStreetMap / Nominatim · ${provider}`);
      }

      setLocationStatus({ text: `Resolved coordinates for ${ip} via ${provider}.`, color: 'green' });
    } catch (_) {
      setLocationStatus({ text: 'Network request paused in offline mode.', color: 'amber' });
    }
  };

  const startDeviceGps = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus({ text: 'Browser Geolocation API not supported.', color: 'red' });
      return;
    }

    if (isWatchingGps && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatchingGps(false);
      setLocationStatus({ text: 'Device GPS tracking stopped.', color: 'amber' });
      return;
    }

    setLocationStatus({ text: 'Requesting device GPS sensor…', color: 'amber' });
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setIsWatchingGps(true);
        setDeviceCoords(`${latitude.toFixed(6)}° N, ${longitude.toFixed(6)}° E · GPS FIX`);
        setLocationAccuracy(`±${Math.round(accuracy)} meters (high-precision)`);
        setLocationSource('Browser GPS Hardware Sensor');
        setCoordinateSource('Hardware Geolocation API');
        updateMaps(latitude, longitude);
        reverseGeocode(latitude, longitude, 'OpenStreetMap / Nominatim · Live GPS');
        setLocationStatus({ text: `Live GPS fix established (±${Math.round(accuracy)}m).`, color: 'green' });
      },
      (err) => {
        setLocationStatus({ text: `GPS sensor error: ${err.message}`, color: 'red' });
        setIsWatchingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    watchIdRef.current = id;
  };

  useEffect(() => {
    refreshIpLocation();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleIpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidIp(inputIp)) {
      setLocationStatus({ text: 'Please enter a valid IPv4 or IPv6 address.', color: 'red' });
      return;
    }
    refreshIpLocation(inputIp.trim());
  };

  return (
    <section className="location-intel panel" id="location-section">
      <div className="location-visual">
        <div className="location-rings">
          <span></span>
          <span></span>
          <span></span>
          <b>⌖</b>
        </div>
        <div className="location-sweep"></div>
        <div className="location-coordinate" id="device-coordinates">
          {deviceCoords}
        </div>
      </div>

      <div className="location-copy">
        <div className="location-header-bar flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-[#1b5961]/50">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#00ff66]/15 border border-[#00ff66]/60 text-[#00ff66] text-xs font-mono font-bold">
              ⌖
            </span>
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#00ff66] uppercase">
              ORBITAL / GEO-INT CLUSTER
            </span>
            <span className="text-[10px] font-mono text-[#8aa0a8] px-2 py-0.5 rounded bg-[#04141b] border border-[#1b5961] hidden sm:inline-block">
              WGS-84 DATUM
            </span>
          </div>

          {!isStandalone && (
            <a
              href="?view=location-intel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#072433] hover:bg-[#00a7bd]/30 border border-[#00a7bd] text-[#72dbc2] hover:text-white text-xs font-mono font-bold tracking-wider transition-all shadow-[0_0_14px_rgba(0,167,189,0.35)] cursor-pointer"
              title="Open Location Intelligence in dedicated full-page view"
            >
              <span>⛶ OPEN IN NEW PAGE</span>
              <span className="text-[#00ff66] font-black">↗</span>
            </a>
          )}
        </div>

        {/* BOLD & ENHANCED TITLE - Enlarged with prominent defense typography */}
        <div className="location-title-block my-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.25rem] font-black font-mono tracking-widest text-[#f7f7f3] leading-none m-0">
            OPEN LOCATION INTELLIGENCE
          </h1>
          <p className="text-[#8aa0a8] text-xs font-mono mt-2 font-bold tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff66] inline-block shadow-[0_0_8px_#00ff66]"></span>
            GLOBAL GEOSPATIAL AIRSPACE CORRELATION & SATELLITE RF RECONNAISSANCE
          </p>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-[#f7f7f3] mt-3 mb-1.5 leading-snug">
          Precision signal geolocation & emitter coordinates.
        </h2>
        <p className="text-xs sm:text-sm text-[#a0b0b8] leading-relaxed max-w-2xl mb-4">
          Combine browser GPS with free network-location providers and OpenStreetMap reverse geocoding. Selected coordinates center high-resolution satellite imagery.
        </p>
        <div className="location-actions flex flex-wrap gap-3 mb-4">
          <button
            className={`location-button ${isWatchingGps ? 'bg-[#d65458] text-white' : 'primary'} !px-4 !py-2.5 !text-xs !font-bold`}
            id="device-location-button"
            type="button"
            onClick={startDeviceGps}
          >
            ⌖ {isWatchingGps ? 'STOP GPS TRACKING' : 'START DEVICE TRACKING'}
          </button>
          <button
            className="location-button !px-4 !py-2.5 !text-xs !font-bold"
            id="ip-location-button"
            type="button"
            onClick={() => refreshIpLocation()}
          >
            ↻ REFRESH IP SIGNAL
          </button>
        </div>

        <form className="ip-lookup-form" id="ip-lookup-form" onSubmit={handleIpSubmit}>
          <label htmlFor="ip-address-input" className="!text-[9px] !font-bold !tracking-wider">USE A DIFFERENT IP ADDRESS</label>
          <div className="ip-lookup-row flex gap-2">
            <input
              className="ip-lookup-input flex-1 !text-xs !py-2.5 !px-3"
              id="ip-address-input"
              type="text"
              placeholder="e.g. 8.8.8.8 or IPv6"
              value={inputIp}
              onChange={(e) => setInputIp(e.target.value)}
            />
            <button className="location-button !px-4 !py-2.5 !text-xs !font-bold" id="ip-lookup-button" type="submit">
              LOOK UP IP
            </button>
          </div>
          <small className="ip-lookup-help !text-[9px]" id="ip-lookup-help">
            The IP is sent to ipapi.co/GeoJS for an estimate; coordinates center the radar and map providers.
          </small>
        </form>

        <div className="location-status flex items-center gap-2 mt-3 text-xs" id="location-status">
          <span className={`status-dot ${locationStatus.color}`}></span>
          <span>{locationStatus.text}</span>
        </div>
      </div>

      <div className="location-data">
        <div className="location-data-row">
          <span>NETWORK IP</span>
          <strong id="network-ip">{networkIp}</strong>
          <small id="network-provider">{networkProvider}</small>
        </div>
        <div className="location-data-row">
          <span>REVERSE LOCATION</span>
          <strong id="reverse-location">{reverseLocation}</strong>
          <small id="reverse-source">{reverseSource}</small>
        </div>
        <div className="location-data-row">
          <span>ACCURACY / SOURCE</span>
          <strong id="location-accuracy">{locationAccuracy}</strong>
          <small id="location-source">{locationSource}</small>
        </div>
        <div className="location-data-row">
          <span>COORDINATES / WGS84</span>
          <strong id="location-coordinates">{locationCoordinates}</strong>
          <small id="location-coordinate-source">{coordinateSource}</small>
        </div>

        <div className="location-map-previews" aria-label="Maps centered on the selected coordinates">
          <figure className="location-map-card">
            <figcaption className="location-map-title">
              <span>LOCAL MAP</span>
              <span className="location-map-open-label">OPEN MAP ↗</span>
            </figcaption>
            <a
              className="location-map-open"
              id="location-map-open"
              href={openMapHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open an interactive map centered on the selected coordinates"
            >
              <div className="location-map-media">
                {streetMapUrl ? (
                  <>
                    <img
                      className="location-map-image"
                      id="location-map-image"
                      src={streetMapUrl}
                      alt="Street map centered on coordinates"
                      loading="lazy"
                    />
                    <span className="location-map-marker" id="location-map-marker"></span>
                  </>
                ) : (
                  <div className="location-map-empty" id="location-map-empty">
                    AWAITING COORDINATES
                  </div>
                )}
              </div>
            </a>
          </figure>

          <figure className="location-map-card">
            <figcaption className="location-map-title">
              <span>SATELLITE</span>
              <span className="location-map-open-label">OPEN FULL SIZE ↗</span>
            </figcaption>
            <a
              className="location-satellite-open"
              id="location-satellite-open"
              href={openSatelliteHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open high-resolution satellite imagery for the selected coordinates"
            >
              <div className="location-satellite-frame">
                {satelliteMapUrl ? (
                  <>
                    <img
                      className="location-satellite-image"
                      id="location-satellite-image"
                      src={satelliteMapUrl}
                      alt="Satellite imagery around coordinates"
                      loading="lazy"
                    />
                    <span className="location-map-marker" id="location-satellite-marker"></span>
                  </>
                ) : (
                  <div className="location-map-empty" id="location-satellite-empty">
                    AWAITING COORDINATES
                  </div>
                )}
              </div>
            </a>
          </figure>
        </div>

        <div className="location-map-attribution">
          <a href="https://goto.arcgisonline.com/maps/World_Street_Map" target="_blank" rel="noopener noreferrer">
            Street map sources: Esri, HERE, Garmin, USGS, © OpenStreetMap contributors.
          </a>
          <a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9" target="_blank" rel="noopener noreferrer">
            Satellite source: Esri, Maxar, Earthstar Geographics.
          </a>
        </div>
      </div>
    </section>
  );
};
