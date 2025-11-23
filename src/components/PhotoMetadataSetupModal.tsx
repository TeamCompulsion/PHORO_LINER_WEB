import { useState, useEffect, useRef } from 'react';
import { loadNaverMaps } from '../utils/loadNaverMaps';
import { getImageUrl } from '../utils/getImageUrl';
import { photoApi } from '../api/photoApi';
import type { PhotoForMetadataSetup } from '../types/photo';

interface PhotoMetadataSetupModalProps {
  isOpen: boolean;
  photos: PhotoForMetadataSetup[];
  onClose: () => void;
  onComplete: () => void;
}

export const PhotoMetadataSetupModal = ({
  isOpen,
  photos,
  onClose,
  onComplete,
}: PhotoMetadataSetupModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [capturedDate, setCapturedDate] = useState('');
  const [capturedTime, setCapturedTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markerRef = useRef<naver.maps.Marker | null>(null);

  const currentPhoto = photos[currentIndex];
  const needsLocation = currentPhoto && !currentPhoto.hasLocation;
  const needsCapturedDate = currentPhoto && !currentPhoto.hasCapturedDate;

  // 지도 초기화
  useEffect(() => {
    if (!isOpen || !needsLocation) return;

    loadNaverMaps()
      .then(() => {
        setMapLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load Naver Maps:', err);
      });
  }, [isOpen, needsLocation]);

  // 지도 인스턴스 생성
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !needsLocation) return;

    // 기존 인스턴스가 있으면 재사용
    if (mapInstanceRef.current) {
      return;
    }

    const mapInstance = new window.naver.maps.Map(mapContainerRef.current, {
      center: new window.naver.maps.LatLng(37.5665, 126.978), // 서울 시청
      zoom: 12,
      minZoom: 7,
      maxZoom: 21,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    });

    mapInstanceRef.current = mapInstance;

    // 클릭 이벤트로 위치 선택
    window.naver.maps.Event.addListener(mapInstance, 'click', (e: any) => {
      const coord = e.coord;
      setSelectedLocation({ lat: coord.lat(), lng: coord.lng() });

      // 마커 업데이트
      if (markerRef.current) {
        markerRef.current.setPosition(coord);
      } else {
        markerRef.current = new window.naver.maps.Marker({
          position: coord,
          map: mapInstance,
          icon: {
            content: `
              <div style="
                width: 40px;
                height: 40px;
                border-radius: 50% 50% 50% 0;
                background-color: #007AFF;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">
                <div style="
                  width: 16px;
                  height: 16px;
                  background-color: white;
                  border-radius: 50%;
                  transform: rotate(45deg);
                "></div>
              </div>
            `,
            size: new window.naver.maps.Size(40, 40),
            anchor: new window.naver.maps.Point(20, 40),
          },
        });
      }
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [mapLoaded, needsLocation]);

  // 사진 변경 시 상태 초기화
  useEffect(() => {
    setSelectedLocation(null);
    setCapturedDate('');
    setCapturedTime('');

    // 마커 제거
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  }, [currentIndex]);

  // 모달 닫힐 때 정리
  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setSelectedLocation(null);
      setCapturedDate('');
      setCapturedTime('');

      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
      setMapLoaded(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!currentPhoto) return;

    setSaving(true);
    try {
      // 위치 저장
      if (needsLocation && selectedLocation) {
        await photoApi.updateLocation(currentPhoto.id, {
          latitude: parseFloat(selectedLocation.lat.toFixed(6)),
          longitude: parseFloat(selectedLocation.lng.toFixed(6)),
        });
      }

      // 촬영날짜 저장
      if (needsCapturedDate && capturedDate) {
        const time = capturedTime || '12:00';
        const capturedDt = `${capturedDate} ${time}:00`;
        await photoApi.updateCapturedDate(currentPhoto.id, {
          capturedDt,
        });
      }

      // 다음 사진으로 이동 또는 완료
      if (currentIndex < photos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to save metadata:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleSkipAll = () => {
    onComplete();
  };

  if (!isOpen || photos.length === 0) {
    return null;
  }

  const canSave = (needsLocation ? selectedLocation !== null : true) &&
                  (needsCapturedDate ? capturedDate !== '' : true) &&
                  (needsLocation || needsCapturedDate);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E5EA',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#000' }}>
              사진 정보 설정
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#8E8E93' }}>
              {currentIndex + 1} / {photos.length} 번째 사진
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#E5E5EA',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#8E8E93',
            }}
          >
            ✕
          </button>
        </div>

        {/* 컨텐츠 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {/* 왼쪽: 사진 미리보기 */}
          <div
            style={{
              width: '300px',
              padding: '24px',
              borderRight: '1px solid #E5E5EA',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#F2F2F7',
            }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#E5E5EA',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              <img
                src={getImageUrl(currentPhoto?.thumbnailPath || currentPhoto?.filePath || '')}
                alt={currentPhoto?.fileName || '사진'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (currentPhoto?.filePath) {
                    img.src = getImageUrl(currentPhoto.filePath);
                  }
                }}
              />
            </div>
            <p
              style={{
                marginTop: '12px',
                fontSize: '14px',
                color: '#8E8E93',
                textAlign: 'center',
                wordBreak: 'break-all',
              }}
            >
              {currentPhoto?.fileName}
            </p>

            {/* 필요한 정보 표시 */}
            <div style={{ marginTop: '16px', width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: needsLocation ? '#FFF3CD' : '#D4EDDA',
                  borderRadius: '8px',
                  marginBottom: '8px',
                }}
              >
                <span>{needsLocation ? '📍' : '✓'}</span>
                <span style={{ fontSize: '13px', color: needsLocation ? '#856404' : '#155724' }}>
                  {needsLocation ? '위치 정보 필요' : '위치 정보 있음'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: needsCapturedDate ? '#FFF3CD' : '#D4EDDA',
                  borderRadius: '8px',
                }}
              >
                <span>{needsCapturedDate ? '📅' : '✓'}</span>
                <span style={{ fontSize: '13px', color: needsCapturedDate ? '#856404' : '#155724' }}>
                  {needsCapturedDate ? '촬영날짜 필요' : '촬영날짜 있음'}
                </span>
              </div>
            </div>
          </div>

          {/* 오른쪽: 설정 폼 */}
          <div
            style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* 위치 설정 */}
            {needsLocation && (
              <div>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '600' }}>
                  위치 설정
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#8E8E93' }}>
                  지도를 클릭하여 사진 촬영 위치를 선택하세요
                </p>
                <div
                  ref={mapContainerRef}
                  style={{
                    width: '100%',
                    height: '300px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#E5E5EA',
                  }}
                />
                {selectedLocation && (
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#007AFF' }}>
                    선택된 위치: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>
            )}

            {/* 촬영날짜 설정 */}
            {needsCapturedDate && (
              <div>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '600' }}>
                  촬영날짜 설정
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '13px',
                        color: '#8E8E93',
                      }}
                    >
                      날짜
                    </label>
                    <input
                      type="date"
                      value={capturedDate}
                      onChange={(e) => setCapturedDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '15px',
                        border: '1px solid #E5E5EA',
                        borderRadius: '8px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '13px',
                        color: '#8E8E93',
                      }}
                    >
                      시간 (선택)
                    </label>
                    <input
                      type="time"
                      value={capturedTime}
                      onChange={(e) => setCapturedTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '15px',
                        border: '1px solid #E5E5EA',
                        borderRadius: '8px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 설정할 항목이 없는 경우 */}
            {!needsLocation && !needsCapturedDate && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8E8E93',
                }}
              >
                이 사진은 모든 정보가 설정되어 있습니다.
              </div>
            )}
          </div>
        </div>

        {/* 푸터: 버튼들 */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E5E5EA',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F9F9F9',
          }}
        >
          <button
            onClick={handleSkipAll}
            style={{
              padding: '10px 20px',
              fontSize: '15px',
              fontWeight: '500',
              color: '#8E8E93',
              backgroundColor: 'transparent',
              border: '1px solid #E5E5EA',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            모두 건너뛰기
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSkip}
              style={{
                padding: '10px 20px',
                fontSize: '15px',
                fontWeight: '500',
                color: '#007AFF',
                backgroundColor: 'transparent',
                border: '1px solid #007AFF',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              건너뛰기
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              style={{
                padding: '10px 24px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#FFFFFF',
                backgroundColor: canSave && !saving ? '#007AFF' : '#C7C7CC',
                border: 'none',
                borderRadius: '8px',
                cursor: canSave && !saving ? 'pointer' : 'not-allowed',
              }}
            >
              {saving ? '저장 중...' : currentIndex < photos.length - 1 ? '저장 후 다음' : '저장 후 완료'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
