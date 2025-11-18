import { useState, useEffect } from 'react';
import { photoApi } from '../api/photoApi';
import { config } from '../config/env';
import { getImageUrl } from '../utils/getImageUrl';
import type { Photo } from '../types/photo';

interface PhotoListProps {
  onPhotoClick?: (photo: Photo) => void;
  refreshTrigger?: number;
}

export const PhotoList = ({ onPhotoClick, refreshTrigger }: PhotoListProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPhotos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await photoApi.getPhotos(config.defaultUserId);
      setPhotos(response.photos);
    } catch (err) {
      setError('사진 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#d32f2f' }}>
        {error}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        사진이 없습니다. 사진을 업로드해보세요!
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{ marginTop: 0 }}>사진 목록 ({photos.length})</h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '16px',
      }}>
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => onPhotoClick?.(photo)}
            style={{
              cursor: 'pointer',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #e0e0e0',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '100%',
              paddingBottom: '100%',
              backgroundColor: '#f5f5f5',
              position: 'relative',
            }}>
              <img
                src={getImageUrl(photo.filePath)}
                alt={`Photo ${photo.id}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
            <div style={{ padding: '8px', fontSize: '12px', color: '#666' }}>
              {photo.capturedDt ? new Date(photo.capturedDt).toLocaleDateString() : '날짜 없음'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
