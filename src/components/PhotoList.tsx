import { useState, useEffect } from 'react';
import { photoApi } from '../api/photoApi';
import { config } from '../config/env';
import { getImageUrl } from '../utils/getImageUrl';
import type { Photo } from '../types/photo';

interface PhotoListProps {
  onPhotoClick?: (photo: Photo) => void;
  refreshTrigger?: number;
}

const PAGE_SIZE = 20;

export const PhotoList = ({ onPhotoClick, refreshTrigger }: PhotoListProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadPhotos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await photoApi.getPhotos({
        userId: config.defaultUserId,
        page: currentPage,
        size: PAGE_SIZE,
      });
      setPhotos(response.photos);
      setTotalCount(response.pageInfo.totalElements);
      setTotalPages(response.pageInfo.totalPages);
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
  }, [refreshTrigger, currentPage]);

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

  const getCoordinateText = (photo: Photo): string => {
    const lat = photo.latitude ?? photo.lat;
    const lng = photo.longitude ?? photo.lng;

    if (typeof lat === 'number' && typeof lng === 'number') {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
    return '좌표 없음';
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>사진 목록 (전체: {totalCount}개)</h3>
        {totalPages > 0 && (
          <div style={{ fontSize: '14px', color: '#666' }}>
            {currentPage + 1} / {totalPages} 페이지
          </div>
        )}
      </div>

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
                src={getImageUrl(photo.thumbnailPath || photo.filePath)}
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
            <div style={{ padding: '8px', fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
              <div style={{ marginBottom: '4px' }}>
                {photo.capturedDt ? new Date(photo.capturedDt).toLocaleDateString() : '날짜 없음'}
              </div>
              <div style={{ fontSize: '10px', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getCoordinateText(photo)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #e0e0e0',
        }}>
          <button
            onClick={() => setCurrentPage(0)}
            disabled={currentPage === 0}
            style={{
              padding: '8px 12px',
              backgroundColor: currentPage === 0 ? '#f5f5f5' : '#1976d2',
              color: currentPage === 0 ? '#999' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            처음
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            style={{
              padding: '8px 12px',
              backgroundColor: currentPage === 0 ? '#f5f5f5' : '#1976d2',
              color: currentPage === 0 ? '#999' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            이전
          </button>

          <span style={{ padding: '0 16px', fontSize: '14px', fontWeight: '500' }}>
            {currentPage + 1} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1}
            style={{
              padding: '8px 12px',
              backgroundColor: currentPage >= totalPages - 1 ? '#f5f5f5' : '#1976d2',
              color: currentPage >= totalPages - 1 ? '#999' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            다음
          </button>
          <button
            onClick={() => setCurrentPage(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            style={{
              padding: '8px 12px',
              backgroundColor: currentPage >= totalPages - 1 ? '#f5f5f5' : '#1976d2',
              color: currentPage >= totalPages - 1 ? '#999' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            마지막
          </button>
        </div>
      )}
    </div>
  );
};
