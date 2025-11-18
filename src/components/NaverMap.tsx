import { useEffect, useRef } from 'react';
import { useNaverMap } from '../hooks/useNaverMap';
import type { PhotoMarker, PoiMarker } from '../types/photo';

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  photoMarkers?: PhotoMarker[];
  poiMarkers?: PoiMarker[];
  onMapBoundsChange?: (bounds: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  }) => void;
  onPhotoMarkerClick?: (photo: PhotoMarker) => void;
}

export const NaverMap = ({
  center,
  zoom,
  photoMarkers = [],
  poiMarkers = [],
  onMapBoundsChange,
  onPhotoMarkerClick,
}: NaverMapProps) => {
  const { mapRef, map, isLoaded, error } = useNaverMap({ center, zoom });
  const markersRef = useRef<naver.maps.Marker[]>([]);

  // 마커 클리어
  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  };

  // 사진 마커 추가
  useEffect(() => {
    if (!map || !isLoaded) return;

    clearMarkers();

    // 사진 마커 추가
    photoMarkers.forEach((photo) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(photo.lat, photo.lng),
        map,
        title: photo.capturedDt,
        icon: {
          content: `
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background-color: #4285f4;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 18px;
            ">
              📷
            </div>
          `,
          size: new window.naver.maps.Size(40, 40),
          anchor: new window.naver.maps.Point(20, 20),
        },
      });

      window.naver.maps.Event.addListener(marker, 'click', () => {
        onPhotoMarkerClick?.(photo);
      });

      markersRef.current.push(marker);
    });

    // POI 마커 추가 (날짜 범위 외 사진)
    poiMarkers.forEach((poi) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(poi.lat, poi.lng),
        map,
        title: poi.capturedDt,
        icon: {
          content: `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: #9e9e9e;
              border: 2px solid white;
              box-shadow: 0 1px 4px rgba(0,0,0,0.3);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 14px;
            ">
              📍
            </div>
          `,
          size: new window.naver.maps.Size(32, 32),
          anchor: new window.naver.maps.Point(16, 16),
        },
      });

      markersRef.current.push(marker);
    });
  }, [map, isLoaded, photoMarkers, poiMarkers, onPhotoMarkerClick]);

  // 지도 범위 변경 이벤트
  useEffect(() => {
    if (!map || !onMapBoundsChange) return;

    const listener = window.naver.maps.Event.addListener(map, 'idle', () => {
      const bounds = map.getBounds() as naver.maps.LatLngBounds;
      const sw = bounds.getSW();
      const ne = bounds.getNE();

      onMapBoundsChange({
        swLat: sw.lat(),
        swLng: sw.lng(),
        neLat: ne.lat(),
        neLng: ne.lng(),
      });
    });

    return () => {
      window.naver.maps.Event.removeListener(listener);
    };
  }, [map, onMapBoundsChange]);

  // 컴포넌트 언마운트 시 마커 정리
  useEffect(() => {
    return () => clearMarkers();
  }, []);

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        color: '#666',
      }}>
        <div>
          <p>지도를 로드할 수 없습니다.</p>
          <p style={{ fontSize: '14px' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}>
        지도 로딩 중...
      </div>
    );
  }

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};
