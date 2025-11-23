import { useState, useEffect } from 'react';
import { albumApi } from '../api/albumApi';
import { config } from '../config/env';
import { getImageUrl } from '../utils/getImageUrl';
import type { Album } from '../types/album';

interface AlbumListProps {
  onAlbumClick?: (album: Album) => void;
  refreshTrigger?: number;
}

const PAGE_SIZE = 20;

export const AlbumList = ({
  onAlbumClick,
  refreshTrigger,
}: AlbumListProps) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editingAlbumId, setEditingAlbumId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [albumThumbnails, setAlbumThumbnails] = useState<{ [key: number]: { thumbnail: string; original: string } }>({});

  const loadAlbums = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await albumApi.getAlbums({
        page: currentPage,
        size: PAGE_SIZE,
      });
      setAlbums(response.albums);
      setTotalPages(response.pageInfo.totalPages);
      setSelectedAlbumIds(new Set());
      
      // 각 앨범의 썸네일 로드
      const thumbnails: { [key: number]: { thumbnail: string; original: string } } = {};
      await Promise.all(
        response.albums.map(async (album) => {
          try {
            const photosResponse = await albumApi.getAlbumPhotos(album.id);
            if (photosResponse.items.length > 0) {
              const firstPhoto = photosResponse.items[0];
              thumbnails[album.id] = {
                thumbnail: getImageUrl(firstPhoto.thumbnailPath || firstPhoto.filePath),
                original: getImageUrl(firstPhoto.filePath),
              };
            }
          } catch (err) {
            // 썸네일 로드 실패는 무시
          }
        })
      );
      setAlbumThumbnails(thumbnails);
    } catch (err) {
      setError('앨범 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, [refreshTrigger, currentPage]);

  const toggleAlbumSelection = (albumId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedAlbumIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(albumId)) {
        newSet.delete(albumId);
      } else {
        newSet.add(albumId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAlbumIds.size === albums.length) {
      setSelectedAlbumIds(new Set());
    } else {
      setSelectedAlbumIds(new Set(albums.map((a) => a.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedAlbumIds.size === 0) return;

    const confirmed = window.confirm(
      `선택한 ${selectedAlbumIds.size}개의 앨범을 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      await albumApi.deleteAlbums({ ids: Array.from(selectedAlbumIds) });
      await loadAlbums();
    } catch (err) {
      setError('앨범 삭제에 실패했습니다.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // 편집 기능은 현재 사용하지 않음 (향후 추가 예정)
  // const handleStartEdit = (album: Album, event: React.MouseEvent) => {
  //   event.stopPropagation();
  //   setEditingAlbumId(album.id);
  //   setEditingTitle(album.name);
  // };

  const handleCancelEdit = () => {
    setEditingAlbumId(null);
    setEditingTitle('');
  };

  const handleSaveEdit = async (albumId: number) => {
    if (!editingTitle.trim()) {
      alert('앨범 제목을 입력해주세요.');
      return;
    }

    try {
      await albumApi.updateAlbumTitle(albumId, { title: editingTitle.trim() });
      setEditingAlbumId(null);
      setEditingTitle('');
      await loadAlbums();
    } catch (err) {
      console.error(err);
      alert('앨범 제목 수정에 실패했습니다.');
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) {
      alert('앨범 제목을 입력해주세요.');
      return;
    }

    setIsCreating(true);
    try {
      await albumApi.createAlbum({
        title: newAlbumTitle.trim(),
      });
      setNewAlbumTitle('');
      await loadAlbums();
    } catch (err) {
      console.error(err);
      alert('앨범 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

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
      {/* 앨범 생성 - iOS 스타일 */}
      <div
        style={{
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={newAlbumTitle}
            onChange={(e) => setNewAlbumTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateAlbum();
              }
            }}
            placeholder="새 앨범 이름"
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '0.5px solid #C7C7CC',
              borderRadius: '10px',
              fontSize: '15px',
              backgroundColor: '#F2F2F7',
              color: '#000000',
            }}
          />
          <button
            onClick={handleCreateAlbum}
            disabled={isCreating || !newAlbumTitle.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: isCreating || !newAlbumTitle.trim() ? '#C7C7CC' : '#007AFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              cursor: isCreating || !newAlbumTitle.trim() ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
          >
            {isCreating ? '생성 중...' : '추가'}
          </button>
        </div>
      </div>

      {/* Control bar - 선택 모드일 때만 표시 */}
      {selectedAlbumIds.size > 0 && (
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
              checked={selectedAlbumIds.size === albums.length && albums.length > 0}
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
              전체 선택 ({selectedAlbumIds.size}/{albums.length})
            </span>
          </label>

          <button
            onClick={handleDeleteSelected}
            disabled={selectedAlbumIds.size === 0 || isDeleting}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedAlbumIds.size > 0 ? '#FF3B30' : '#C7C7CC',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedAlbumIds.size > 0 ? 'pointer' : 'not-allowed',
              fontSize: '15px',
              fontWeight: '600',
            }}
          >
            {isDeleting
              ? '삭제 중...'
              : `삭제 (${selectedAlbumIds.size})`}
          </button>
        </div>
      )}

      {/* 앨범 목록 - iOS 스타일 그리드 */}
      {albums.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#8E8E93',
            fontSize: '17px',
          }}
        >
          앨범이 없습니다. 새 앨범을 만들어보세요!
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '16px',
        }}>
          {albums.map((album) => {
            const thumbnail = albumThumbnails[album.id];
            return (
              <div
                key={album.id}
                onClick={(e) => {
                  if (selectedAlbumIds.size > 0) {
                    toggleAlbumSelection(album.id, e);
                  } else {
                    onAlbumClick?.(album);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleAlbumSelection(album.id, e);
                }}
                style={{
                  cursor: 'pointer',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
              >
                {/* 선택 체크마크 */}
                {selectedAlbumIds.has(album.id) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
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
                {selectedAlbumIds.size > 0 && !selectedAlbumIds.has(album.id) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      zIndex: 5,
                      borderRadius: '12px',
                    }}
                  />
                )}

                {/* 앨범 썸네일 */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    backgroundColor: '#E5E5EA',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {thumbnail ? (
                    <img
                      src={thumbnail.thumbnail}
                      data-original={thumbnail.original}
                      alt={album.name}
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
                        }
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#E5E5EA',
                      }}
                    >
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z"
                          stroke="#8E8E93"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 앨범 정보 */}
                <div style={{ padding: '12px' }}>
                  {editingAlbumId === album.id ? (
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(album.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          border: '1px solid #007AFF',
                          borderRadius: '8px',
                          fontSize: '15px',
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                      <button
                        onClick={() => handleSaveEdit(album.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#34C759',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        저장
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#8E8E93',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          fontSize: '17px',
                          fontWeight: '600',
                          color: '#000000',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {album.name}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#8E8E93',
                        }}
                      >
                        앨범
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
};

