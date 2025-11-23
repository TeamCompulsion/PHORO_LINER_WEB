import { useState, useEffect, useMemo } from 'react';
import { photoApi } from '../api/photoApi';
import { config } from '../config/env';
import { getImageUrl } from '../utils/getImageUrl';
import { PhotoMetadataSetupModal } from './PhotoMetadataSetupModal';
import type { Photo, PhotoForMetadataSetup } from '../types/photo';

interface PhotoListProps {
  onPhotoClick?: (photo: Photo) => void;
  refreshTrigger?: number;
  onPhotoDragStart?: (photo: Photo) => void;
  onPhotoDragEnd?: () => void;
}

const PAGE_SIZE = 20;

export const PhotoList = ({ onPhotoClick, refreshTrigger, onPhotoDragStart, onPhotoDragEnd }: PhotoListProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [photosForMetadataSetup, setPhotosForMetadataSetup] = useState<PhotoForMetadataSetup[]>([]);

  const loadPhotos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await photoApi.getPhotos({
        page: currentPage,
        size: PAGE_SIZE,
      });
      setPhotos(response.photos);
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

  // 날짜/위치 기입하기 버튼 핸들러 - API로 메타데이터 없는 사진 조회
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  const handleOpenMetadataSetup = async () => {
    setLoadingMetadata(true);
    try {
      // 위치 없는 사진 조회
      const noLocationResponse = await photoApi.getPhotos({
        page: 0,
        size: 100,
        hasLocation: false,
      });

      // 날짜 없는 사진 조회
      const noDateResponse = await photoApi.getPhotos({
        page: 0,
        size: 100,
        hasCapturedDate: false,
      });

      // 두 결과를 합치고 중복 제거
      const allPhotos = [...noLocationResponse.photos, ...noDateResponse.photos];
      const uniquePhotosMap = new Map<number, Photo>();
      allPhotos.forEach(photo => uniquePhotosMap.set(photo.id, photo));
      const uniquePhotos = Array.from(uniquePhotosMap.values());

      if (uniquePhotos.length === 0) {
        alert('날짜/위치 정보가 필요한 사진이 없습니다.');
        return;
      }

      const photosForSetup: PhotoForMetadataSetup[] = uniquePhotos.map(photo => ({
        id: photo.id,
        fileName: photo.fileName || photo.filePath.split('/').pop() || `photo_${photo.id}`,
        filePath: photo.filePath,
        thumbnailPath: photo.thumbnailPath,
        hasLocation: !!(photo.latitude || photo.longitude || photo.lat || photo.lng),
        hasCapturedDate: !!photo.capturedDt,
      }));

      setPhotosForMetadataSetup(photosForSetup);
      setIsMetadataModalOpen(true);
    } catch (err) {
      console.error('Failed to load photos for metadata setup:', err);
      alert('사진을 불러오는데 실패했습니다.');
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleMetadataSetupComplete = () => {
    setIsMetadataModalOpen(false);
    setPhotosForMetadataSetup([]);
    loadPhotos(); // 변경사항 반영을 위해 새로고침
  };

  const togglePhotoSelection = (photoId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
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

  // 날짜별로 사진 그룹화
  const groupedPhotos = useMemo(() => {
    if (photos.length === 0) {
      return [];
    }
    const groups: { [key: string]: Photo[] } = {};
    
    photos.forEach((photo) => {
      if (photo.capturedDt) {
        const date = new Date(photo.capturedDt);
        const dateKey = date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(photo);
      } else {
        if (!groups['날짜 없음']) {
          groups['날짜 없음'] = [];
        }
        groups['날짜 없음'].push(photo);
      }
    });

    // 날짜순으로 정렬 (최신순)
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === '날짜 없음') return 1;
      if (b[0] === '날짜 없음') return -1;
      return new Date(b[1][0].capturedDt || '').getTime() - new Date(a[1][0].capturedDt || '').getTime();
    });
  }, [photos]);

  if (loading) {
    return (
      <div style={{ 
        padding: '60px 20px', 
        textAlign: 'center',
        color: '#8E8E93',
        fontSize: '17px',
      }}>
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#FF3B30',
        fontSize: '15px',
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'transparent',
    }}>
      {/* 날짜/위치 기입하기 버튼 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
      }}>
        <button
          onClick={handleOpenMetadataSetup}
          disabled={loadingMetadata}
          style={{
            padding: '8px 16px',
            backgroundColor: loadingMetadata ? '#E5E5EA' : '#007AFF',
            color: loadingMetadata ? '#8E8E93' : '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            cursor: loadingMetadata ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>📝</span>
          {loadingMetadata ? '불러오는 중...' : '날짜/위치 기입하기'}
        </button>
      </div>

      {/* Control bar - 선택 모드일 때만 표시 */}
      {selectedPhotoIds.size > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'pointer',
            flex: 1,
          }}>
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
              transition: 'all 0.2s',
            }}
          >
            {isDeleting ? '삭제 중...' : `삭제 (${selectedPhotoIds.size})`}
          </button>
        </div>
      )}

      {/* 날짜별 그룹 */}
      {groupedPhotos.length === 0 ? (
        <div style={{ 
          padding: '60px 20px', 
          textAlign: 'center', 
          color: '#8E8E93',
          fontSize: '17px',
        }}>
          사진이 없습니다. 사진을 업로드해보세요!
        </div>
      ) : (
        <>
          {groupedPhotos.map(([dateKey, datePhotos]) => (
            <div key={dateKey} style={{ marginBottom: '32px' }}>
              {/* 섹션 헤더 */}
              <div style={{
                padding: '8px 4px',
                marginBottom: '8px',
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#8E8E93',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {dateKey}
                </h3>
              </div>

              {/* iOS 스타일 그리드 - 4열 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '2px',
              }}>
                {datePhotos.map((photo) => {
                  const hasNoLocation = photo.latitude == null && photo.longitude == null && photo.lat == null && photo.lng == null;
                  return (
                  <div
                    key={photo.id}
                    draggable={hasNoLocation}
                    onDragStart={(e) => {
                      if (hasNoLocation) {
                        e.dataTransfer.setData('application/json', JSON.stringify(photo));
                        e.dataTransfer.effectAllowed = 'move';
                        onPhotoDragStart?.(photo);
                      }
                    }}
                    onDragEnd={() => {
                      onPhotoDragEnd?.();
                    }}
                    onClick={(e) => {
                      if (selectedPhotoIds.size > 0) {
                        togglePhotoSelection(photo.id, e);
                      } else {
                        onPhotoClick?.(photo);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      togglePhotoSelection(photo.id, e);
                    }}
                    style={{
                      cursor: hasNoLocation ? 'grab' : 'pointer',
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
                      data-original={getImageUrl(photo.filePath)}
                      alt={`Photo ${photo.id}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        const originalSrc = img.dataset.original;
                        if (originalSrc && img.src !== originalSrc) {
                          img.src = originalSrc;
                        } else {
                          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23E5E5EA" width="100" height="100"/%3E%3Ctext fill="%238E8E93" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }
                      }}
                    />
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Pagination - iOS 스타일 */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginTop: '32px',
          paddingTop: '20px',
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: '#FFFFFF',
              color: currentPage === 0 ? '#C7C7CC' : '#007AFF',
              border: 'none',
              borderRadius: '8px',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            이전
          </button>

          <span style={{ 
            padding: '0 16px', 
            fontSize: '15px', 
            fontWeight: '500',
            color: '#000000',
          }}>
            {currentPage + 1} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1}
            style={{
              padding: '10px 20px',
              backgroundColor: '#FFFFFF',
              color: currentPage >= totalPages - 1 ? '#C7C7CC' : '#007AFF',
              border: 'none',
              borderRadius: '8px',
              cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            다음
          </button>
        </div>
      )}

      {/* 메타데이터 설정 모달 */}
      <PhotoMetadataSetupModal
        isOpen={isMetadataModalOpen}
        photos={photosForMetadataSetup}
        onClose={() => {
          setIsMetadataModalOpen(false);
          setPhotosForMetadataSetup([]);
        }}
        onComplete={handleMetadataSetupComplete}
      />
    </div>
  );
};
