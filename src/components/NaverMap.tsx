import { useEffect, useRef, useState } from 'react';
import { useNaverMap } from '../hooks/useNaverMap';
import type { PhotoMarker, PoiMarker, Photo } from '../types/photo';

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
  locationEditPhoto?: Photo | PhotoMarker | null;
  onSaveLocation?: (lat: number, lng: number) => void;
  onCancelLocationEdit?: () => void;
}

export const NaverMap = ({
  center,
  zoom,
  photoMarkers = [],
  poiMarkers = [],
  onMapBoundsChange,
  onPhotoMarkerClick,
  locationEditPhoto,
  onSaveLocation,
  onCancelLocationEdit,
}: NaverMapProps) => {
  const { mapRef, map, isLoaded, error } = useNaverMap({ center, zoom });
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number } | null>(null);

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

  // 위치 수정 모드 처리
  useEffect(() => {
    if (!map || !isLoaded || !locationEditPhoto) return;

    // 사진의 위치로 지도 이동
    const lat = locationEditPhoto.lat != null ? locationEditPhoto.lat : locationEditPhoto.latitude;
    const lng = locationEditPhoto.lng != null ? locationEditPhoto.lng : locationEditPhoto.longitude;

    if (lat != null && lng != null) {
      map.setCenter(new window.naver.maps.LatLng(lat, lng));
      setCurrentCenter({ lat, lng });
    }

    // 지도 이동 시 중앙 좌표 업데이트
    const listener = window.naver.maps.Event.addListener(map, 'center_changed', () => {
      const center = map.getCenter();
      setCurrentCenter({ lat: center.lat(), lng: center.lng() });
    });

    return () => {
      window.naver.maps.Event.removeListener(listener);
      setCurrentCenter(null);
    };
  }, [map, isLoaded, locationEditPhoto]);

  // 컴포넌트 언마운트 시 마커 정리
  useEffect(() => {
    return () => clearMarkers();
  }, []);

  const handleSave = () => {
    if (currentCenter && onSaveLocation) {
      onSaveLocation(currentCenter.lat, currentCenter.lng);
    }
  };

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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* 위치 수정 모드: 중앙 고정 마커 */}
      {locationEditPhoto && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#ea4335',
                border: '4px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
              }}
            >
              📌
            </div>
          </div>

          {/* 위치 수정 모드: 저장/취소 버튼 */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '10px',
              zIndex: 1000,
            }}
          >
            <button
              onClick={handleSave}
              style={{
                padding: '12px 24px',
                backgroundColor: '#34a853',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              위치 저장
            </button>
            <button
              onClick={onCancelLocationEdit}
              style={{
                padding: '12px 24px',
                backgroundColor: '#9e9e9e',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              취소
            </button>
          </div>

          {/* 안내 메시지 */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'white',
              padding: '12px 20px',
              borderRadius: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              fontSize: '14px',
              fontWeight: 'bold',
              zIndex: 1000,
            }}
          >
            지도를 이동하여 새로운 위치를 선택하세요
          </div>
        </>
      )}
    </div>
  );
};
