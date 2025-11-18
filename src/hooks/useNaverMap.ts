import { useEffect, useRef, useState } from 'react';
import { loadNaverMaps } from '../utils/loadNaverMaps';

interface UseNaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
}

export const useNaverMap = ({ center, zoom = 15 }: UseNaverMapProps = {}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNaverMaps()
      .then(() => setIsLoaded(true))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const defaultCenter = center || { lat: 37.5665, lng: 126.9780 }; // 서울 시청

    const mapInstance = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(defaultCenter.lat, defaultCenter.lng),
      zoom,
      minZoom: 7,
      maxZoom: 21,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
      mapTypeControl: true,
      mapTypeControlOptions: {
          position: window.naver.maps.Position.TOP_LEFT,
          mapTypeIds: null,
          style: naver.maps.MapTypeControlStyle.BUTTON
      },
    });

    setMap(mapInstance);
  }, [isLoaded, center, zoom, map]);

  return { mapRef, map, isLoaded, error };
};
