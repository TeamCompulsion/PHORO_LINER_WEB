import { useState, useEffect, useRef } from 'react';
import { loadNaverMaps } from '../utils/loadNaverMaps';
import { getImageUrl } from '../utils/getImageUrl';
import { photoApi } from '../api/photoApi';
import type { PhotoForMetadataSetup } from '../types/photo';
import './PhotoMetadataSetupModal.css';

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
                background-color: #6366f1;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                border: 2px solid white;
              ">
                <div style="
                  width: 14px;
                  height: 14px;
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

  const setDateToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setCapturedDate(today);
  };

  const setDateToYesterday = () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    setCapturedDate(yesterday);
  };

  if (!isOpen || photos.length === 0) {
    return null;
  }

  const canSave = (needsLocation ? selectedLocation !== null : true) &&
    (needsCapturedDate ? capturedDate !== '' : true) &&
    (needsLocation || needsCapturedDate);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h2>사진 정보 설정</h2>
            <p className="modal-subtitle">
              {currentIndex + 1} / {photos.length} 번째 사진
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Left: Photo Preview */}
          <div className="photo-preview-section">
            <div className="photo-container">
              <img
                src={getImageUrl(currentPhoto?.thumbnailPath || currentPhoto?.filePath || '')}
                alt={currentPhoto?.fileName || '사진'}
                className="photo-img"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (currentPhoto?.filePath) {
                    img.src = getImageUrl(currentPhoto.filePath);
                  }
                }}
              />
            </div>
            <p className="photo-name">{currentPhoto?.fileName}</p>

            <div className="status-badges">
              <div className={`status-badge ${needsLocation ? 'needed' : 'complete'}`}>
                <span>{needsLocation ? '📍' : '✓'}</span>
                <span>{needsLocation ? '위치 정보 필요' : '위치 정보 있음'}</span>
              </div>
              <div className={`status-badge ${needsCapturedDate ? 'needed' : 'complete'}`}>
                <span>{needsCapturedDate ? '📅' : '✓'}</span>
                <span>{needsCapturedDate ? '촬영날짜 필요' : '촬영날짜 있음'}</span>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="form-section">
            {/* Location Setup */}
            {needsLocation && (
              <div className="form-group">
                <h3>📍 위치 설정</h3>
                <p className="form-group-desc">지도를 클릭하여 사진 촬영 위치를 선택하세요</p>
                <div ref={mapContainerRef} className="map-wrapper" />
                {selectedLocation && (
                  <div className="location-display">
                    <span>선택된 위치:</span>
                    <strong>{selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Date Setup */}
            {needsCapturedDate && (
              <div className="form-group">
                <h3>📅 촬영날짜 설정</h3>
                <div className="datetime-inputs">
                  <div className="input-wrapper">
                    <label className="input-label">날짜</label>
                    <input
                      type="date"
                      value={capturedDate}
                      onChange={(e) => setCapturedDate(e.target.value)}
                      className="styled-input"
                    />
                    <div className="quick-actions">
                      <button
                        className={`chip-btn ${capturedDate === new Date().toISOString().split('T')[0] ? 'active' : ''}`}
                        onClick={setDateToToday}
                      >
                        오늘
                      </button>
                      <button
                        className="chip-btn"
                        onClick={setDateToYesterday}
                      >
                        어제
                      </button>
                    </div>
                  </div>
                  <div className="input-wrapper">
                    <label className="input-label">시간 (선택)</label>
                    <input
                      type="time"
                      value={capturedTime}
                      onChange={(e) => setCapturedTime(e.target.value)}
                      className="styled-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* All Set Message */}
            {!needsLocation && !needsCapturedDate && (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                gap: '16px'
              }}>
                <div style={{ fontSize: '48px' }}>✨</div>
                <p>이 사진은 모든 정보가 설정되어 있습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={handleSkipAll}>
            모두 건너뛰기
          </button>

          <div className="btn-group">
            <button className="btn btn-outline" onClick={handleSkip}>
              건너뛰기
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!canSave || saving}
            >
              {saving ? '저장 중...' : currentIndex < photos.length - 1 ? '저장 후 다음' : '저장 후 완료'}
              {!saving && <span>→</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
