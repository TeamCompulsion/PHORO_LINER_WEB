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
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPhotos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await photoApi.getPhotos(config.defaultUserId);
      setPhotos(response.photos);
      setSelectedPhotoIds(new Set()); // Clear selection after reload
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

  const togglePhotoSelection = (photoId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedPhotoIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPhotoIds.size === photos.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(photos.map(p => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPhotoIds.size === 0) return;

    const confirmed = window.confirm(
      `선택한 ${selectedPhotoIds.size}개의 사진을 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      await photoApi.deletePhotos({ ids: Array.from(selectedPhotoIds) });
      await loadPhotos(); // Reload photos after deletion
    } catch (err) {
      setError('사진 삭제에 실패했습니다.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

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

      {/* Control bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={selectedPhotoIds.size === photos.length}
            onChange={toggleSelectAll}
            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
          />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>
            전체 선택 ({selectedPhotoIds.size}/{photos.length})
          </span>
        </label>

        <button
          onClick={handleDeleteSelected}
          disabled={selectedPhotoIds.size === 0 || isDeleting}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            backgroundColor: selectedPhotoIds.size > 0 ? '#d32f2f' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedPhotoIds.size > 0 ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (selectedPhotoIds.size > 0) {
              e.currentTarget.style.backgroundColor = '#b71c1c';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedPhotoIds.size > 0) {
              e.currentTarget.style.backgroundColor = '#d32f2f';
            }
          }}
        >
          {isDeleting ? '삭제 중...' : `선택 항목 삭제 (${selectedPhotoIds.size})`}
        </button>
      </div>

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
              border: selectedPhotoIds.has(photo.id) ? '3px solid #1976d2' : '1px solid #e0e0e0',
              transition: 'transform 0.2s, box-shadow 0.2s',
              position: 'relative',
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
            {/* Checkbox overlay */}
            <div
              onClick={(e) => togglePhotoSelection(photo.id, e)}
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '4px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <input
                type="checkbox"
                checked={selectedPhotoIds.has(photo.id)}
                onChange={() => {}} // Handled by parent div onClick
                style={{
                  cursor: 'pointer',
                  width: '18px',
                  height: '18px',
                  margin: 0,
                }}
              />
            </div>

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
