import { useState } from 'react';
import { photoApi } from '../api/photoApi';
import { getImageUrl } from '../utils/getImageUrl';
import type { Photo, PhotoMarker } from '../types/photo';

interface PhotoDetailProps {
  photo: Photo | PhotoMarker | null;
  onClose: () => void;
  onUpdate?: () => void;
  onStartLocationEdit?: (photo: Photo | PhotoMarker) => void;
}

type EditMode = 'none' | 'date';

export const PhotoDetail = ({ photo, onClose, onUpdate, onStartLocationEdit }: PhotoDetailProps) => {
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [capturedDt, setCapturedDt] = useState('');

  if (!photo) return null;

  const handleEditDate = () => {
    setEditMode('date');
    setCapturedDt(photo.capturedDt || '');
  };

  const handleEditLocation = () => {
    onStartLocationEdit?.(photo);
    onClose();
  };

  const handleSaveDate = async () => {
    try {
      if (capturedDt && capturedDt !== photo.capturedDt) {
        await photoApi.updateCapturedDate(photo.id, { capturedDt });
        alert('촬영 날짜가 업데이트되었습니다.');
        setEditMode('none');
        onUpdate?.();
      }
    } catch (error) {
      console.error(error);
      alert('업데이트에 실패했습니다.');
    }
  };

  // 위치 정보 확인
  const hasLocation = 
    ('lat' in photo && photo.lat != null && photo.lng != null) ||
    ('latitude' in photo && photo.latitude != null && photo.longitude != null);

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
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          margin: 'auto',
        }}
      >
        {/* 핸들 바 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '12px',
          paddingBottom: '8px',
        }}>
          <div style={{
            width: '36px',
            height: '5px',
            backgroundColor: '#C7C7CC',
            borderRadius: '3px',
          }} />
        </div>

        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '0.5px solid rgba(0,0,0,0.1)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: '#000000',
          }}>
            사진 상세
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: 'transparent',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#007AFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              padding: 0,
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

        {/* 스크롤 가능한 컨텐츠 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px',
          minHeight: 0,
        }}>
          {/* 사진 */}
          <div style={{
            width: '100%',
            marginBottom: '24px',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#F2F2F7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
          }}>
            <img
              src={getImageUrl(photo.filePath)}
              alt={`Photo ${photo.id}`}
              style={{
                width: '100%',
                maxHeight: '500px',
                objectFit: 'contain',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23E5E5EA" width="400" height="300"/%3E%3Ctext fill="%238E8E93" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          {editMode === 'none' ? (
            <div>
              {/* 정보 섹션 */}
              <div style={{
                backgroundColor: '#F2F2F7',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
              }}>
                {/* 촬영 날짜 */}
                <div 
                  style={{
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: '0.5px solid rgba(0,0,0,0.1)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    const editBtn = e.currentTarget.querySelector('[data-edit="date"]') as HTMLElement;
                    if (editBtn) editBtn.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    const editBtn = e.currentTarget.querySelector('[data-edit="date"]') as HTMLElement;
                    if (editBtn) editBtn.style.opacity = '0';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#8E8E93',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        촬영 날짜
                      </div>
                      <div style={{
                        fontSize: '17px',
                        fontWeight: '400',
                        color: '#000000',
                      }}>
                        {photo.capturedDt 
                          ? new Date(photo.capturedDt).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '날짜 정보 없음'}
                      </div>
                    </div>
                    <button
                      data-edit="date"
                      onClick={handleEditDate}
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'all 0.2s',
                        marginLeft: '12px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F2F2F7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                          stroke="#007AFF"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
                          stroke="#007AFF"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 위치 정보 */}
                <div
                  style={{
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    const editBtn = e.currentTarget.querySelector('[data-edit="location"]') as HTMLElement;
                    if (editBtn) editBtn.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    const editBtn = e.currentTarget.querySelector('[data-edit="location"]') as HTMLElement;
                    if (editBtn) editBtn.style.opacity = '0';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#8E8E93',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        위치 정보
                      </div>
                      <div style={{
                        fontSize: '17px',
                        fontWeight: '400',
                        color: hasLocation ? '#000000' : '#8E8E93',
                      }}>
                        {hasLocation ? '위치 정보 있음' : '위치 정보 없음'}
                      </div>
                    </div>
                    <button
                      data-edit="location"
                      onClick={handleEditLocation}
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'all 0.2s',
                        marginLeft: '12px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F2F2F7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                          stroke="#34C759"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
                          stroke="#34C759"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                backgroundColor: '#F2F2F7',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#8E8E93',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  촬영 날짜 (yyyy-MM-dd HH:mm:ss)
                </label>
                <input
                  type="text"
                  value={capturedDt}
                  onChange={(e) => setCapturedDt(e.target.value)}
                  placeholder="2024-11-18 15:30:00"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '0.5px solid #C7C7CC',
                    borderRadius: '10px',
                    fontSize: '17px',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
              }}>
                <button
                  onClick={handleSaveDate}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    backgroundColor: '#007AFF',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '17px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0051D5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#007AFF';
                  }}
                >
                  저장
                </button>
                <button
                  onClick={() => setEditMode('none')}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    backgroundColor: '#8E8E93',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '17px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#6D6D70';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#8E8E93';
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
