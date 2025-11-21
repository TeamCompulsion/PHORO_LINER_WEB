import { useState, useEffect } from 'react';
import { albumApi } from '../api/albumApi';
import { config } from '../config/env';
import type { Album } from '../types/album';

interface AlbumListProps {
  onAlbumClick?: (album: Album) => void;
  refreshTrigger?: number;
  selectedAlbumId?: number | null;
}

const PAGE_SIZE = 20;

export const AlbumList = ({
  onAlbumClick,
  refreshTrigger,
  selectedAlbumId,
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

  const loadAlbums = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await albumApi.getAlbums({
        userId: config.defaultUserId,
        page: currentPage,
        size: PAGE_SIZE,
      });
      setAlbums(response.albums);
      setTotalPages(response.pageInfo.totalPages);
      setSelectedAlbumIds(new Set());
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

  const handleStartEdit = (album: Album, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingAlbumId(album.id);
    setEditingTitle(album.name);
  };

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
        userId: config.defaultUserId,
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
        <h3 style={{ margin: 0 }}>앨범 목록</h3>
        {totalPages > 0 && (
          <div style={{ fontSize: '14px', color: '#666' }}>
            {currentPage + 1} / {totalPages} 페이지
          </div>
        )}
      </div>

      {/* 앨범 생성 */}
      <div
        style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
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
            placeholder="새 앨범 제목"
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
          <button
            onClick={handleCreateAlbum}
            disabled={isCreating || !newAlbumTitle.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: isCreating || !newAlbumTitle.trim() ? '#ccc' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isCreating || !newAlbumTitle.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            {isCreating ? '생성 중...' : '앨범 추가'}
          </button>
        </div>
      </div>

      {/* Control bar */}
      {albums.length > 0 && (
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
              checked={selectedAlbumIds.size === albums.length}
              onChange={toggleSelectAll}
              style={{ cursor: 'pointer', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              전체 선택 ({selectedAlbumIds.size}/{albums.length})
            </span>
          </label>

          <button
            onClick={handleDeleteSelected}
            disabled={selectedAlbumIds.size === 0 || isDeleting}
            style={{
              marginLeft: 'auto',
              padding: '8px 16px',
              backgroundColor:
                selectedAlbumIds.size > 0 ? '#d32f2f' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedAlbumIds.size > 0 ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            {isDeleting
              ? '삭제 중...'
              : `선택 항목 삭제 (${selectedAlbumIds.size})`}
          </button>
        </div>
      )}

      {/* 앨범 목록 */}
      {albums.length === 0 ? (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#666',
          }}
        >
          앨범이 없습니다. 새 앨범을 만들어보세요!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => onAlbumClick?.(album)}
              style={{
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '8px',
                border:
                  selectedAlbumId === album.id
                    ? '2px solid #1976d2'
                    : '1px solid #e0e0e0',
                backgroundColor:
                  selectedAlbumId === album.id ? '#e3f2fd' : 'white',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (selectedAlbumId !== album.id) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedAlbumId !== album.id) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {/* Checkbox */}
              <div
                onClick={(e) => toggleAlbumSelection(album.id, e)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 10,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedAlbumIds.has(album.id)}
                  onChange={() => {}}
                  style={{
                    cursor: 'pointer',
                    width: '18px',
                    height: '18px',
                  }}
                />
              </div>

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
                      border: '1px solid #1976d2',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    onClick={() => handleSaveEdit(album.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#34a853',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    저장
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#9e9e9e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#333',
                        marginBottom: '4px',
                      }}
                    >
                      📁 {album.name}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleStartEdit(album, e)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'transparent',
                      color: '#666',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    수정
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
};

