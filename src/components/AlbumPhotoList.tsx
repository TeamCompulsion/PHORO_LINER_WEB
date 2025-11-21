import { useState, useEffect } from 'react';
import { albumApi } from '../api/albumApi';
import { getImageUrl } from '../utils/getImageUrl';
import type { AlbumPhotoItem } from '../types/album';
import type { Photo } from '../types/photo';

interface AlbumPhotoListProps {
  albumId: number;
  onPhotoClick?: (photo: Photo | AlbumPhotoItem) => void;
  refreshTrigger?: number;
  onShowOnMap?: () => void;
}

export const AlbumPhotoList = ({
  albumId,
  onPhotoClick,
  refreshTrigger,
  onShowOnMap,
}: AlbumPhotoListProps) => {
  const [photos, setPhotos] = useState<AlbumPhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPhotos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await albumApi.getAlbumPhotos(albumId);
      setPhotos(response.items);
      setSelectedPhotoIds(new Set());
    } catch (err) {
      setError('앨범 내 사진 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (albumId) {
      loadPhotos();
    }
  }, [albumId, refreshTrigger]);

  const togglePhotoSelection = (photoId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedPhotoIds((prev) => {
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
      setSelectedPhotoIds(new Set(photos.map((p) => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPhotoIds.size === 0) return;

    const confirmed = window.confirm(
      `선택한 ${selectedPhotoIds.size}개의 사진을 앨범에서 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      await albumApi.removePhotosFromAlbum(albumId, {
        ids: Array.from(selectedPhotoIds),
      });
      await loadPhotos();
    } catch (err) {
      setError('사진 삭제에 실패했습니다.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const convertToPhoto = (item: AlbumPhotoItem): Photo => {
    return {
      id: item.photoId,
      filePath: item.filePath,
      capturedDt: item.capturedDt,
      userId: 0, // 앨범 사진에는 userId가 없을 수 있음
      lat: undefined,
      lng: undefined,
    };
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
        이 앨범에는 사진이 없습니다.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: 0 }}>
          앨범 내 사진 ({photos.length}개)
        </h3>
        {onShowOnMap && (
          <button
            onClick={onShowOnMap}
            style={{
              padding: '8px 16px',
              backgroundColor: '#34a853',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            지도에서 보기
          </button>
        )}
      </div>

      {/* Control bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
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
          }}
        >
          {isDeleting
            ? '삭제 중...'
            : `선택 항목 삭제 (${selectedPhotoIds.size})`}
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '16px',
        }}
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => onPhotoClick?.(convertToPhoto(photo))}
            style={{
              cursor: 'pointer',
              borderRadius: '8px',
              overflow: 'hidden',
              border: selectedPhotoIds.has(photo.id)
                ? '3px solid #1976d2'
                : '1px solid #e0e0e0',
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
                onChange={() => {}}
                style={{
                  cursor: 'pointer',
                  width: '18px',
                  height: '18px',
                  margin: 0,
                }}
              />
            </div>

            <div
              style={{
                width: '100%',
                paddingBottom: '100%',
                backgroundColor: '#f5f5f5',
                position: 'relative',
              }}
            >
              <img
                src={getImageUrl(photo.thumbnailPath || photo.filePath)}
                alt={photo.fileName}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
            <div
              style={{
                padding: '8px',
                fontSize: '11px',
                color: '#666',
                lineHeight: '1.4',
              }}
            >
              <div style={{ marginBottom: '4px' }}>
                {photo.capturedDt
                  ? new Date(photo.capturedDt).toLocaleDateString()
                  : '날짜 없음'}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#999',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {photo.fileName}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

