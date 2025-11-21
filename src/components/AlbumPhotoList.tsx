import { useState, useEffect } from 'react';
import { albumApi } from '../api/albumApi';
import { getImageUrl } from '../utils/getImageUrl';
import type { AlbumPhotoItem } from '../types/album';
import type { Photo } from '../types/photo';

interface AlbumPhotoListProps {
  albumId: number;
  onPhotoClick?: (photo: Photo | AlbumPhotoItem) => void;
  refreshTrigger?: number;
  onAddPhotos?: () => void;
}

export const AlbumPhotoList = ({
  albumId,
  onPhotoClick,
  refreshTrigger,
  onAddPhotos,
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

  const togglePhotoSelection = (photoId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
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

  return (
    <div style={{
      backgroundColor: 'transparent',
    }}>
      {/* iOS 스타일 사진 추가 버튼 */}
      {onAddPhotos && (
        <button
          onClick={onAddPhotos}
          style={{
            width: '100%',
            padding: '14px 20px',
            backgroundColor: '#007AFF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '17px',
            fontWeight: '600',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0051D5';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,122,255,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#007AFF';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>사진 추가</span>
        </button>
      )}

      {error ? (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#FF3B30',
          fontSize: '15px',
        }}>
          {error}
        </div>
      ) : photos.length === 0 ? (
        <div style={{ 
          padding: '60px 20px', 
          textAlign: 'center', 
          color: '#8E8E93',
          fontSize: '17px',
        }}>
          이 앨범에는 사진이 없습니다.
        </div>
      ) : (
        <>
          {/* Control bar - 선택 모드일 때만 표시 */}
          {selectedPhotoIds.size > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedPhotoIds.size === photos.length && photos.length > 0}
                  onChange={toggleSelectAll}
                  style={{ 
                    cursor: 'pointer', 
                    width: '20px', 
                    height: '20px',
                    accentColor: '#007AFF',
                  }}
                />
                <span style={{ 
                  fontSize: '15px', 
                  fontWeight: '500',
                  color: '#000000',
                }}>
                  전체 선택 ({selectedPhotoIds.size}/{photos.length})
                </span>
              </label>

              <button
                onClick={handleDeleteSelected}
                disabled={selectedPhotoIds.size === 0 || isDeleting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedPhotoIds.size > 0 ? '#FF3B30' : '#C7C7CC',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: selectedPhotoIds.size > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
              >
                {isDeleting
                  ? '삭제 중...'
                  : `삭제 (${selectedPhotoIds.size})`}
              </button>
            </div>
          )}

          {/* iOS 스타일 그리드 - 4열 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '2px',
            }}
          >
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={(e) => {
                  if (selectedPhotoIds.size > 0) {
                    togglePhotoSelection(photo.id, e);
                  } else {
                    onPhotoClick?.(convertToPhoto(photo));
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  togglePhotoSelection(photo.id, e);
                }}
                style={{
                  cursor: 'pointer',
                  borderRadius: '0',
                  overflow: 'hidden',
                  position: 'relative',
                  aspectRatio: '1',
                  backgroundColor: '#E5E5EA',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {/* iOS 스타일 선택 체크마크 */}
                {selectedPhotoIds.has(photo.id) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      zIndex: 10,
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#007AFF',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.6667 3.5L5.25 9.91667L2.33334 7"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}

                {/* 선택 모드일 때 오버레이 */}
                {selectedPhotoIds.size > 0 && !selectedPhotoIds.has(photo.id) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      zIndex: 5,
                    }}
                  />
                )}

                <img
                  src={getImageUrl(photo.thumbnailPath || photo.filePath)}
                  alt={photo.fileName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23E5E5EA" width="100" height="100"/%3E%3Ctext fill="%238E8E93" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

