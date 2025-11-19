import { useState } from 'react';
import { photoApi } from '../api/photoApi';
import { getImageUrl } from '../utils/getImageUrl';
import type { Photo, PhotoMarker } from '../types/photo';

interface PhotoDetailProps {
  photo: Photo | PhotoMarker | null;
  onClose: () => void;
  onUpdate?: () => void;
}

type EditMode = 'none' | 'date' | 'location';

export const PhotoDetail = ({ photo, onClose, onUpdate }: PhotoDetailProps) => {
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [capturedDt, setCapturedDt] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  if (!photo) return null;

  const handleEditDate = () => {
    setEditMode('date');
    setCapturedDt(photo.capturedDt || '');
  };

  const handleEditLocation = () => {
    setEditMode('location');

    // lat, lng를 우선 사용하고, 없으면 latitude, longitude 사용
    if (photo.lat != null && photo.lng != null) {
      setLatitude(photo.lat.toString());
      setLongitude(photo.lng.toString());
    } else if (photo.latitude != null && photo.longitude != null) {
      setLatitude(photo.latitude.toString());
      setLongitude(photo.longitude.toString());
    }
  };

  const handleSaveDate = async () => {
    try {
      if (capturedDt && capturedDt !== photo.capturedDt) {
        await photoApi.updateCapturedDate(photo.id, { capturedDt });
        alert('촬영 날짜가 업데이트되었습니다.');
        setEditMode('none');
        onUpdate?.();
      }
    } catch (error) {
      console.error(error);
      alert('업데이트에 실패했습니다.');
    }
  };

  const handleSaveLocation = async () => {
    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      // lat, lng를 우선 사용하고, 없으면 latitude, longitude 사용
      const currentLat = photo.lat != null ? photo.lat : photo.latitude;
      const currentLng = photo.lng != null ? photo.lng : photo.longitude;

      if (!isNaN(lat) && !isNaN(lng) && (lat !== currentLat || lng !== currentLng)) {
        await photoApi.updateLocation(photo.id, {
          latitude: lat,
          longitude: lng,
        });
        alert('위치 정보가 업데이트되었습니다.');
        setEditMode('none');
        onUpdate?.();
      }
    } catch (error) {
      console.error(error);
      alert('업데이트에 실패했습니다.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <h2 style={{ margin: 0 }}>사진 상세</h2>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
              }}
            >
              ×
            </button>
          </div>

          <img
            src={getImageUrl(photo.filePath)}
            alt={`Photo ${photo.id}`}
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'contain',
              borderRadius: '4px',
              marginBottom: '20px',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />

          {editMode === 'none' ? (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <strong>촬영 날짜:</strong>{' '}
                {photo.capturedDt ? new Date(photo.capturedDt).toLocaleString() : '없음'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>위치:</strong>{' '}
                {photo.lat != null && photo.lng != null
                  ? `${photo.lat.toFixed(6)}, ${photo.lng.toFixed(6)}`
                  : photo.latitude != null && photo.longitude != null
                  ? `${photo.latitude.toFixed(6)}, ${photo.longitude.toFixed(6)}`
                  : '없음'}
              </div>

              <button
                onClick={handleEditDate}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4285f4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginRight: '10px',
                }}
              >
                날짜 수정
              </button>
              <button
                onClick={handleEditLocation}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#34a853',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                위치 수정
              </button>
            </div>
          ) : editMode === 'date' ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  촬영 날짜 (yyyy-MM-dd HH:mm:ss):
                </label>
                <input
                  type="text"
                  value={capturedDt}
                  onChange={(e) => setCapturedDt(e.target.value)}
                  placeholder="2024-11-18 15:30:00"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div>
                <button
                  onClick={handleSaveDate}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4285f4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginRight: '10px',
                  }}
                >
                  저장
                </button>
                <button
                  onClick={() => setEditMode('none')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#9e9e9e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  위도:
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="37.5665"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  경도:
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="126.9780"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div>
                <button
                  onClick={handleSaveLocation}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#34a853',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginRight: '10px',
                  }}
                >
                  저장
                </button>
                <button
                  onClick={() => setEditMode('none')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#9e9e9e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
