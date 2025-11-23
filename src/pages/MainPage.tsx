import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NaverMap } from '../components/NaverMap';
import { PhotoUpload } from '../components/PhotoUpload';
import { PhotoList } from '../components/PhotoList';
import { PhotoDetail } from '../components/PhotoDetail';
import { AlbumList } from '../components/AlbumList';
import { AlbumPhotoList } from '../components/AlbumPhotoList';
import { PhotoSelectionModal } from '../components/PhotoSelectionModal';
import { PhotoMetadataSetupModal } from '../components/PhotoMetadataSetupModal';
import { photoApi } from '../api/photoApi';
import { albumApi } from '../api/albumApi';
import { userApi } from '../api/userApi';
import { config } from '../config/env';
import { isAuthenticated, logout } from '../utils/auth';
import type { PhotoMarker, PoiMarker, Photo, MapBounds, PhotoForMetadataSetup } from '../types/photo';
import type { Album } from '../types/album';

type TabType = 'photos' | 'albums';

export const MainPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('photos');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [photoMarkers, setPhotoMarkers] = useState<PhotoMarker[]>([]);
  const [poiMarkers, setPoiMarkers] = useState<PoiMarker[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | PhotoMarker | null>(null);
  const [locationEditPhoto, setLocationEditPhoto] = useState<Photo | PhotoMarker | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [isPhotoSelectionModalOpen, setIsPhotoSelectionModalOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [photosNeedingSetup, setPhotosNeedingSetup] = useState<PhotoForMetadataSetup[]>([]);
  const [isMetadataSetupModalOpen, setIsMetadataSetupModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 일반 사진 마커 조회 (지도 기반, 앨범 미선택 시에만)
  const loadMarkers = useCallback(async () => {
    // 앨범이 선택된 경우 별도 useEffect에서 처리
    if (selectedAlbum) return;

    // mapBounds가 없으면 기본 범위(한국 전체) 사용
    const bounds = mapBounds || {
      swLat: 33.0,  // 남쪽 위도
      swLng: 124.0, // 서쪽 경도
      neLat: 38.6,  // 북쪽 위도
      neLng: 132.0, // 동쪽 경도
    };

    try {
      const response = await photoApi.getMapMarkers(bounds);
      setPhotoMarkers(response?.photoMarkers || []);
      setPoiMarkers([]); // 전체 마커에도 POI가 없음 (스펙 변경)
    } catch (error) {
      console.error('Failed to load markers:', error);
      setPhotoMarkers([]);
      setPoiMarkers([]);
    }
  }, [mapBounds, selectedAlbum]);

  // 앨범 사진 전체 조회 (앨범 선택 시 한 번만)
  const loadAlbumPhotos = useCallback(async () => {
    if (!selectedAlbum) {
      return;
    }

    try {
      const response = await albumApi.getAlbumPhotos(selectedAlbum.id);
      console.log('Album photos response:', response);

      // AlbumPhotoItem을 PhotoMarker로 변환 (latitude, longitude가 있는 경우만)
      const markers: PhotoMarker[] = (response?.items || [])
        .filter((item) => {
          const hasLatLng = item.latitude != null && item.longitude != null;
          if (!hasLatLng) {
            console.warn('Photo missing latitude/longitude:', item);
          }
          return hasLatLng;
        })
        .map((item) => ({
          id: item.photoId,
          capturedDt: item.capturedDt || '',
          filePath: item.filePath,
          thumbnailPath: item.thumbnailPath,
          lat: item.latitude!,
          lng: item.longitude!,
        }));

      console.log('Converted markers:', markers.length);
      setPhotoMarkers(markers);
      setPoiMarkers([]);

      // 첫 번째 사진 위치로 지도 이동 (capturedDt 기준 정렬된 상태)
      if (markers.length > 0) {
        const firstPhoto = markers[0];
        setFocusTarget({ lat: firstPhoto.lat, lng: firstPhoto.lng });
      }
    } catch (error) {
      console.error('Failed to load album photos:', error);
      setPhotoMarkers([]);
      setPoiMarkers([]);
    }
  }, [selectedAlbum]);

  useEffect(() => {
    loadMarkers();
  }, [loadMarkers]);

  // 앨범 선택 시 사진 전체 조회
  useEffect(() => {
    loadAlbumPhotos();
  }, [loadAlbumPhotos]);

  // MainPage에서 body와 root 스크롤 비활성화 (지도가 전체 화면을 차지하기 위해)
  useEffect(() => {
    const rootElement = document.getElementById('root');
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    if (rootElement) {
      rootElement.style.height = '100vh';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      if (rootElement) {
        rootElement.style.height = '';
      }
    };
  }, []);

  // 사용자 정보 조회
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (isAuthenticated()) {
        try {
          const userInfo = await userApi.getUserInfo();
          setUserName(userInfo.name);
        } catch (error) {
          console.error('Failed to load user info:', error);
          setUserName(null);
        }
      } else {
        setUserName(null);
      }
    };

    fetchUserInfo();
  }, []);

  const handleMapBoundsChange = (bounds: MapBounds) => {
    setMapBounds(bounds);
  };

  // 사진 다시 조회 (앨범/일반 모드에 따라)
  const reloadPhotos = useCallback(() => {
    if (selectedAlbum) {
      loadAlbumPhotos();
    } else {
      loadMarkers();
    }
  }, [selectedAlbum, loadAlbumPhotos, loadMarkers]);

  const handleUploadSuccess = (uploadedCount: number, photosForSetup: PhotoForMetadataSetup[]) => {
    setRefreshTrigger((prev) => prev + 1);
    reloadPhotos();

    // 메타데이터 설정이 필요한 사진이 있으면 모달 열기
    if (photosForSetup.length > 0) {
      setPhotosNeedingSetup(photosForSetup);
      setIsMetadataSetupModalOpen(true);
    }
  };

  const handleMetadataSetupComplete = () => {
    setIsMetadataSetupModalOpen(false);
    setPhotosNeedingSetup([]);
    setRefreshTrigger((prev) => prev + 1);
    reloadPhotos();
  };

  const handleMetadataSetupClose = () => {
    setIsMetadataSetupModalOpen(false);
    setPhotosNeedingSetup([]);
  };

  const handlePhotoUpdate = () => {
    setSelectedPhoto(null);
    setRefreshTrigger((prev) => prev + 1);
    reloadPhotos();
  };

  const handleStartLocationEdit = (photo: Photo | PhotoMarker) => {
    setLocationEditPhoto(photo);
  };

  const handleCancelLocationEdit = () => {
    setLocationEditPhoto(null);
  };

  const handleSaveLocation = async (lat: number, lng: number) => {
    if (!locationEditPhoto) return;

    try {
      await photoApi.updateLocation(locationEditPhoto.id, {
        latitude: lat,
        longitude: lng,
      });
      alert('위치 정보가 업데이트되었습니다.');
      setLocationEditPhoto(null);
      setRefreshTrigger((prev) => prev + 1);
      reloadPhotos();
    } catch (error) {
      console.error(error);
      alert('업데이트에 실패했습니다.');
    }
  };

  const handleAlbumClick = (album: Album) => {
    setSelectedAlbum(album);
  };

  const handleAddPhotosToAlbum = () => {
    setIsPhotoSelectionModalOpen(true);
  };

  const handlePhotoSelectionConfirm = async (selectedPhotoIds: number[]) => {
    if (!selectedAlbum || selectedPhotoIds.length === 0) return;

    try {
      await albumApi.addPhotosToAlbum(selectedAlbum.id, {
        ids: selectedPhotoIds,
      });
      alert(`${selectedPhotoIds.length}개의 사진이 앨범에 추가되었습니다.`);
      setIsPhotoSelectionModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
      reloadPhotos();
    } catch (error) {
      console.error(error);
      alert('사진 추가에 실패했습니다.');
    }
  };

  // 사진 드래그 앤 드롭으로 위치 설정
  const handlePhotoDrop = async (photoId: number, lat: number, lng: number) => {
    try {
      await photoApi.updateLocation(photoId, {
        latitude: lat,
        longitude: lng,
      });
      alert('사진 위치가 설정되었습니다.');
      setRefreshTrigger((prev) => prev + 1);
      reloadPhotos();
    } catch (error) {
      console.error(error);
      alert('위치 설정에 실패했습니다.');
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'photos') {
      setSelectedAlbum(null);
      setFocusTarget(null);
    }
  };

  console.log('MainPage rendering', { activeTab, selectedAlbum });

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#F2F2F7',
      position: 'relative',
    }}>
      {/* 우상단 로그인 버튼 (비로그인 상태일 때만) */}
      {!isAuthenticated() && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
        }}>
          <button
            onClick={handleLoginClick}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007AFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            로그인
          </button>
        </div>
      )}

      {/* 왼쪽 사이드바 */}
      <div style={{
        width: isSidebarCollapsed ? '0px' : '400px',
        minWidth: isSidebarCollapsed ? '0px' : '400px',
        backgroundColor: '#FFFFFF',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '0',
        boxShadow: isSidebarCollapsed ? 'none' : '4px 0 24px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* 헤더 */}
        <div style={{
          padding: '32px 24px 24px 24px',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}>
          <h1 style={{ 
            margin: '0', 
            fontSize: '24px', 
            fontWeight: '800',
            color: '#1C1C1E',
            letterSpacing: '-0.02em',
            fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
          }}>
            Photo Liner
          </h1>
          {userName && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: '#F5F5F7',
                borderRadius: '100px',
                transition: 'background-color 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E5EA'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F7'}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}>
                  <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 20 20" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" 
                      fill="#8E8E93"
                    />
                    <path 
                      d="M10 12C5.58172 12 2 13.7909 2 16C2 18.2091 5.58172 20 10 20C14.4183 20 18 18.2091 18 16C18 13.7909 14.4183 12 10 12Z" 
                      fill="#8E8E93"
                    />
                  </svg>
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1C1C1E',
                }}>
                  {userName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#F5F5F7',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#8E8E93',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF3B30';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5F5F7';
                  e.currentTarget.style.color = '#8E8E93';
                }}
                title="로그아웃"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* 탭 네비게이션 */}
        <div style={{
          padding: '0 24px 24px 24px',
          backgroundColor: '#FFFFFF',
          position: 'sticky',
          top: '88px',
          zIndex: 20,
        }}>
          <div style={{
            display: 'flex',
            backgroundColor: '#F5F5F7',
            borderRadius: '16px',
            padding: '4px',
            position: 'relative',
          }}>
            <button
              onClick={() => handleTabChange('photos')}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: activeTab === 'photos' ? '#FFFFFF' : 'transparent',
                border: 'none',
                color: activeTab === 'photos' ? '#000000' : '#8E8E93',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'photos' ? '600' : '500',
                borderRadius: '12px',
                boxShadow: activeTab === 'photos' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 1,
              }}
            >
              사진 보관함
            </button>
            <button
              onClick={() => handleTabChange('albums')}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: activeTab === 'albums' ? '#FFFFFF' : 'transparent',
                border: 'none',
                color: activeTab === 'albums' ? '#000000' : '#8E8E93',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'albums' ? '600' : '500',
                borderRadius: '12px',
                boxShadow: activeTab === 'albums' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 1,
              }}
            >
              앨범
            </button>
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 24px 32px 24px',
        }}>

        {activeTab === 'photos' && (
          <>
            {!isAuthenticated() && (
              <div style={{
                marginBottom: '24px',
                padding: '24px',
                backgroundColor: '#F5F5F7',
                borderRadius: '20px',
                textAlign: 'center',
              }}>
                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '15px',
                  color: '#1C1C1E',
                  fontWeight: '600',
                  lineHeight: '1.4',
                }}>
                  로그인하고<br/>
                  더 많은 기능을 이용해보세요
                </p>
                <button
                  onClick={handleLoginClick}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#FEE500',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'transform 0.1s ease',
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  카카오 로그인
                </button>
              </div>
            )}
            <div style={{ marginBottom: '24px' }}>
              <PhotoUpload
                onUploadSuccess={handleUploadSuccess}
                onUploadError={(error) => console.error(error)}
              />
            </div>

            <PhotoList
              onPhotoClick={setSelectedPhoto}
              refreshTrigger={refreshTrigger}
              onPhotoDragStart={() => setIsDraggingPhoto(true)}
              onPhotoDragEnd={() => setIsDraggingPhoto(false)}
            />
          </>
        )}

        {activeTab === 'albums' && (
          <>
            {selectedAlbum ? (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '24px',
                  padding: '4px 0',
                }}>
                  <button
                    onClick={() => {
                      setSelectedAlbum(null);
                      setFocusTarget(null);
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      padding: '0',
                      backgroundColor: '#F5F5F7',
                      color: '#1C1C1E',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E5EA'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F7'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <h2 style={{ 
                    margin: '0',
                    fontSize: '20px', 
                    fontWeight: '700',
                    color: '#1C1C1E',
                    letterSpacing: '-0.01em',
                  }}>
                    {selectedAlbum.name}
                  </h2>
                </div>
                <AlbumPhotoList
                  albumId={selectedAlbum.id}
                  onPhotoClick={(photo) => {
                    // AlbumPhotoItem을 Photo로 변환하여 전달
                    if ('photoId' in photo) {
                      setSelectedPhoto({
                        id: photo.photoId,
                        filePath: photo.filePath,
                        thumbnailPath: photo.thumbnailPath,
                        capturedDt: photo.capturedDt,
                        userId: 0,
                      });
                    } else {
                      setSelectedPhoto(photo);
                    }
                  }}
                  refreshTrigger={refreshTrigger}
                  onAddPhotos={handleAddPhotosToAlbum}
                />
              </div>
            ) : (
              <AlbumList
                onAlbumClick={handleAlbumClick}
                refreshTrigger={refreshTrigger}
              />
            )}
          </>
        )}
        </div>
      </div>

      {/* 사이드바 토글 버튼 */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        style={{
          position: 'absolute',
          left: isSidebarCollapsed ? '24px' : '424px',
          top: '48px',
          zIndex: 1000,
          width: '40px',
          height: '40px',
          backgroundColor: '#FFFFFF',
          border: 'none',
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: 0.9,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.opacity = '0.9';
        }}
        title={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="#1C1C1E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* 오른쪽 지도 */}
      <div style={{ flex: 1, position: 'relative' }}>
        <NaverMap
          photoMarkers={photoMarkers}
          poiMarkers={poiMarkers}
          onMapBoundsChange={handleMapBoundsChange}
          onPhotoMarkerClick={setSelectedPhoto}
          locationEditPhoto={locationEditPhoto}
          onSaveLocation={handleSaveLocation}
          onCancelLocationEdit={handleCancelLocationEdit}
          showPolyline={selectedAlbum !== null}
          focusTarget={focusTarget}
          onPhotoDrop={handlePhotoDrop}
          isDraggingPhoto={isDraggingPhoto}
        />
      </div>

      {/* 사진 상세 모달 */}
      <PhotoDetail
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onUpdate={handlePhotoUpdate}
        onStartLocationEdit={handleStartLocationEdit}
      />

      {/* 사진 선택 모달 */}
      {selectedAlbum && (
        <PhotoSelectionModal
          isOpen={isPhotoSelectionModalOpen}
          onClose={() => setIsPhotoSelectionModalOpen(false)}
          onConfirm={handlePhotoSelectionConfirm}
        />
      )}

      {/* 메타데이터 설정 모달 */}
      <PhotoMetadataSetupModal
        isOpen={isMetadataSetupModalOpen}
        photos={photosNeedingSetup}
        onClose={handleMetadataSetupClose}
        onComplete={handleMetadataSetupComplete}
      />
    </div>
  );
};
