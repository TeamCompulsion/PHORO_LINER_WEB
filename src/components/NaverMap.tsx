import { useEffect, useRef, useState } from 'react';
import { useNaverMap } from '../hooks/useNaverMap';
import type { PhotoMarker, PoiMarker, Photo } from '../types/photo';
import { getImageUrl } from '../utils/getImageUrl';

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
  showPolyline?: boolean;
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
  showPolyline = false,
}: NaverMapProps) => {
  const { mapRef, map, isLoaded, error } = useNaverMap({ center, zoom });
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const clusteringRef = useRef<InstanceType<typeof window.MarkerClustering> | null>(null);
  const polylineRef = useRef<naver.maps.Polyline | null>(null);
  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number } | null>(null);

  // 마커 클리어
  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    if (clusteringRef.current) {
      clusteringRef.current.setMap(null);
      clusteringRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  };

  // 클러스터 아이콘 HTML 생성 (카드 형태)
  const createClusterIcon = (size: number) => {
    return {
      content: `
        <div class="cluster-card" style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 12px;
          background-color: white;
          border: 3px solid #4285f4;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          overflow: hidden;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        ">
          <div class="cluster-image" style="
            flex: 1;
            background-color: #f0f0f0;
            background-size: cover;
            background-position: center;
            position: relative;
          "></div>
          <div class="cluster-count" style="
            height: ${size / 4}px;
            background-color: #4285f4;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${size / 5}px;
          "></div>
        </div>
      `,
      size: new window.naver.maps.Size(size, size),
      anchor: new window.naver.maps.Point(size / 2, size / 2),
    };
  };

  // 사진 마커 추가 (클러스터링 포함)
  useEffect(() => {
    if (!map || !isLoaded || !window.MarkerClustering) return;

    console.log('NaverMap: Rendering markers', { 
      photoMarkersCount: photoMarkers.length,
      photoMarkers: photoMarkers 
    });

    clearMarkers();

    // 위치 수정 중인 사진은 클러스터링에서 제외 (중앙 핀으로 표시됨)
    const filteredPhotoMarkers = locationEditPhoto
      ? photoMarkers.filter((photo) => photo.id !== locationEditPhoto.id)
      : photoMarkers;
    
    console.log('NaverMap: Filtered markers', { 
      filteredCount: filteredPhotoMarkers.length,
      filteredMarkers: filteredPhotoMarkers 
    });

    // 클러스터링 모드: filteredPhotoMarkers를 클러스터링으로 관리
    const markers = filteredPhotoMarkers.map((photo, index) => {
      const imageUrl = getImageUrl(photo.thumbnailPath || photo.filePath);
      const originalUrl = getImageUrl(photo.filePath);

      // 앨범 모드에서 순서 표시
      const orderNumber = index + 1;
      const isFirst = index === 0;
      const isLast = index === filteredPhotoMarkers.length - 1;

      // 시작점/끝점 색상 구분
      const badgeColor = isFirst ? '#34a853' : isLast ? '#ea4335' : '#4285f4';
      const badgeLabel = isFirst ? 'S' : isLast ? 'E' : orderNumber.toString();

      // 순서 뱃지 HTML (앨범 모드에서만 표시)
      const orderBadgeHtml = showPolyline ? `
        <div style="
          position: absolute;
          top: -6px;
          left: -6px;
          min-width: 22px;
          height: 22px;
          border-radius: 11px;
          background-color: ${badgeColor};
          color: white;
          font-size: 11px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          padding: 0 4px;
          z-index: 10;
        ">${badgeLabel}</div>
      ` : '';

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(photo.lat, photo.lng),
        title: photo.capturedDt,
        icon: {
          content: `
            <div style="
              position: relative;
              width: 70px;
              height: 70px;
            ">
              ${orderBadgeHtml}
              <div style="
                width: 70px;
                height: 70px;
                border-radius: 6px;
                overflow: hidden;
                border: 2px solid ${showPolyline ? badgeColor : 'white'};
                box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                cursor: pointer;
                background-color: #f0f0f0;
              ">
                <img
                  src="${imageUrl}"
                  data-original="${originalUrl}"
                  alt="photo"
                  style="
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                  "
                  onerror="var orig=this.dataset.original;if(orig&&this.src!==orig){this.src=orig}else{this.parentElement.innerHTML='<div style=&quot;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background-color:#4285f4;color:white;font-size:28px;&quot;>📷</div>'}"
                />
              </div>
            </div>
          `,
          size: new window.naver.maps.Size(70, 70),
          anchor: new window.naver.maps.Point(35, 35),
        },
      });

      // 마커에 photo 데이터 저장
      (marker as any).photoData = photo;

      window.naver.maps.Event.addListener(marker, 'click', () => {
        onPhotoMarkerClick?.(photo);
      });

      return marker;
    });

    // 앨범 모드에서는 클러스터링 비활성화 (모든 마커에 순서 표시)
    if (showPolyline) {
      // 마커를 직접 지도에 추가
      markers.forEach((marker) => {
        marker.setMap(map);
      });
      markersRef.current = markers;
    } else {
      // 일반 모드: 클러스터링 사용
      const clusterIcons = [
        createClusterIcon(80),   // 10개 미만
        createClusterIcon(90),   // 10~100개
        createClusterIcon(100),  // 100~200개
        createClusterIcon(110),  // 200~500개
        createClusterIcon(120),  // 500개 이상
      ];

      clusteringRef.current = new window.MarkerClustering({
        map,
        markers,
        disableClickZoom: false,
        minClusterSize: 2,
        maxZoom: 18,
        gridSize: 120,
        icons: clusterIcons,
        indexGenerator: [10, 100, 200, 500, 1000],
        averageCenter: true,
        stylingFunction: (clusterMarker: any, count: number, cluster: any) => {
          const element = clusterMarker.getElement();
          if (element) {
            // 개수 업데이트
            const countElement = element.querySelector('.cluster-count');
            if (countElement) {
              countElement.textContent = `${count}개`;
            }

            // 대표 이미지 업데이트
            const imageElement = element.querySelector('.cluster-image');
            if (imageElement && cluster) {
              const clusterMembers = cluster.getClusterMember();
              if (clusterMembers && clusterMembers.length > 0) {
                // 첫 번째 마커의 사진 데이터 가져오기
                const firstMarker = clusterMembers[0];
                const photoData = (firstMarker as any).photoData;
                if (photoData) {
                  const thumbnailUrl = getImageUrl(photoData.thumbnailPath || photoData.filePath);
                  const originalUrl = getImageUrl(photoData.filePath);
                  // 썸네일 로딩 시도, 실패 시 원본으로 fallback
                  const img = new Image();
                  img.onload = () => {
                    (imageElement as HTMLElement).style.backgroundImage = `url(${thumbnailUrl})`;
                  };
                  img.onerror = () => {
                    (imageElement as HTMLElement).style.backgroundImage = `url(${originalUrl})`;
                  };
                  img.src = thumbnailUrl;
                }
              }
            }
          }
        },
      });
    }

    // 마커들을 날짜 순서대로 선으로 연결 (앨범 모드에서만, 백엔드에서 정렬된 순서 그대로 사용)
    if (showPolyline && filteredPhotoMarkers.length > 1 && !locationEditPhoto) {
      const path = filteredPhotoMarkers.map((photo) => 
        new window.naver.maps.LatLng(photo.lat, photo.lng)
      );

      // 기존 polyline 제거
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      // 새로운 polyline 생성
      polylineRef.current = new window.naver.maps.Polyline({
        map,
        path,
        strokeColor: '#4285f4',
        strokeWeight: 3,
        strokeOpacity: 0.8,
        strokeStyle: 'solid',
        zIndex: 1,
      });
    }

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
  }, [map, isLoaded, photoMarkers, poiMarkers, onPhotoMarkerClick, locationEditPhoto, showPolyline]);

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
    const lat = 'lat' in locationEditPhoto && locationEditPhoto.lat != null
      ? locationEditPhoto.lat
      : 'latitude' in locationEditPhoto ? locationEditPhoto.latitude : undefined;
    const lng = 'lng' in locationEditPhoto && locationEditPhoto.lng != null
      ? locationEditPhoto.lng
      : 'longitude' in locationEditPhoto ? locationEditPhoto.longitude : undefined;

    if (lat != null && lng != null) {
      map.setCenter(new window.naver.maps.LatLng(lat, lng));
      setCurrentCenter({ lat, lng });
    }

    // 지도 이동 시 중앙 좌표 업데이트
    const listener = window.naver.maps.Event.addListener(map, 'center_changed', () => {
      const center = map.getCenter() as naver.maps.LatLng;
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

      {/* 위치 수정 모드: 중앙 고정 사진 */}
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
                width: '90px',
                height: '90px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '4px solid #ea4335',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                backgroundColor: '#f0f0f0',
              }}
            >
              <img
                src={getImageUrl(
                  ('thumbnailPath' in locationEditPhoto && locationEditPhoto.thumbnailPath)
                    ? locationEditPhoto.thumbnailPath
                    : locationEditPhoto.filePath
                )}
                data-original={getImageUrl(locationEditPhoto.filePath)}
                alt="editing"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  const img = e.currentTarget;
                  const originalSrc = img.dataset.original;
                  if (originalSrc && img.src !== originalSrc) {
                    img.src = originalSrc;
                  } else {
                    img.parentElement!.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background-color:#ea4335;color:white;font-size:36px;">📷</div>';
                  }
                }}
              />
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
