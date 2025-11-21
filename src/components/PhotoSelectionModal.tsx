import { useState, useEffect } from 'react';
import { photoApi } from '../api/photoApi';
import { config } from '../config/env';
import { getImageUrl } from '../utils/getImageUrl';
import type { Photo } from '../types/photo';

interface PhotoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedPhotoIds: number[]) => void;
}

const PAGE_SIZE = 20;

export const PhotoSelectionModal = ({
  isOpen,
  onClose,
  onConfirm,
}: PhotoSelectionModalProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
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
      setTotalPages(response.pageInfo.totalPages);
    } catch (err) {
      setError('사진 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPhotos();
      setSelectedPhotoIds(new Set());
      setCurrentPage(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadPhotos();
    }
  }, [currentPage]);

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

  const handleConfirm = () => {
    if (selectedPhotoIds.size === 0) {
      alert('추가할 사진을 선택해주세요.');
      return;
    }
    onConfirm(Array.from(selectedPhotoIds));
    setSelectedPhotoIds(new Set());
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-out',
        overflow: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - iOS 스타일 */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '0.5px solid rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: '#000000',
          }}>
            사진 선택 ({selectedPhotoIds.size}개 선택됨)
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '24px',
              color: '#007AFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F2F2F7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px',
          minHeight: 0,
        }}>
          {loading ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#8E8E93',
              fontSize: '17px',
            }}>
              로딩 중...
            </div>
          ) : error ? (
            <div style={{
              padding: '40px',
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
              사진이 없습니다.
            </div>
          ) : (
            <>
              {/* Control bar - iOS 스타일 */}
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
                </div>
              )}

              {/* Photo grid - iOS 스타일, 촘촘한 그리드 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '4px',
                }}
              >
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={(e) => {
                      if (e.target instanceof HTMLInputElement) {
                        togglePhotoSelection(photo.id, e);
                      } else {
                        togglePhotoSelection(photo.id, e);
                      }
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
                          top: '4px',
                          right: '4px',
                          zIndex: 10,
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#007AFF',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
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
                      alt={`Photo ${photo.id}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23E5E5EA" width="100" height="100"/%3E%3Ctext fill="%238E8E93" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination - iOS 스타일 */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '32px',
                    paddingTop: '20px',
                  }}
                >
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
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

                  <span
                    style={{
                      padding: '0 16px',
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#000000',
                    }}
                  >
                    {currentPage + 1} / {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                    }
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
            </>
          )}
        </div>

        {/* Footer - iOS 스타일 */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '0.5px solid rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#F2F2F7',
              color: '#000000',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '17px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E5E5EA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F2F2F7';
            }}
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedPhotoIds.size === 0}
            style={{
              padding: '12px 24px',
              backgroundColor: selectedPhotoIds.size > 0 ? '#007AFF' : '#C7C7CC',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              cursor: selectedPhotoIds.size > 0 ? 'pointer' : 'not-allowed',
              fontSize: '17px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (selectedPhotoIds.size > 0) {
                e.currentTarget.style.backgroundColor = '#0051D5';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedPhotoIds.size > 0) {
                e.currentTarget.style.backgroundColor = '#007AFF';
              }
            }}
          >
            추가 ({selectedPhotoIds.size}개)
          </button>
        </div>
      </div>
    </div>
  );
};

