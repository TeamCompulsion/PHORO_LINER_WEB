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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0 }}>사진 선택 ({selectedPhotoIds.size}개 선택됨)</h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f5f5f5',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            닫기
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#d32f2f' }}>
              {error}
            </div>
          ) : photos.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              사진이 없습니다.
            </div>
          ) : (
            <>
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
                    checked={selectedPhotoIds.size === photos.length && photos.length > 0}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    전체 선택 ({selectedPhotoIds.size}/{photos.length})
                  </span>
                </label>
              </div>

              {/* Photo grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                }}
              >
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: selectedPhotoIds.has(photo.id)
                        ? '3px solid #1976d2'
                        : '1px solid #e0e0e0',
                      transition: 'transform 0.2s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
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
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e0e0e0',
                  }}
                >
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
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
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

                  <span
                    style={{
                      padding: '0 16px',
                      fontSize: '14px',
                      fontWeight: '500',
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
                      padding: '8px 12px',
                      backgroundColor:
                        currentPage >= totalPages - 1 ? '#f5f5f5' : '#1976d2',
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
                      backgroundColor:
                        currentPage >= totalPages - 1 ? '#f5f5f5' : '#1976d2',
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
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f5f5f5',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedPhotoIds.size === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedPhotoIds.size > 0 ? '#1976d2' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedPhotoIds.size > 0 ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            추가 ({selectedPhotoIds.size}개)
          </button>
        </div>
      </div>
    </div>
  );
};

