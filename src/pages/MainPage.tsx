import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NaverMap } from '../components/NaverMap';
import { PhotoUpload } from '../components/PhotoUpload';
import { PhotoList } from '../components/PhotoList';
import { PhotoDetail } from '../components/PhotoDetail';
import { AlbumList } from '../components/AlbumList';
import { AlbumPhotoList } from '../components/AlbumPhotoList';
import { PhotoSelectionModal } from '../components/PhotoSelectionModal';
import { photoApi } from '../api/photoApi';
import { albumApi } from '../api/albumApi';
import { userApi } from '../api/userApi';
import { config } from '../config/env';
import { isAuthenticated, logout } from '../utils/auth';
import type { PhotoMarker, PoiMarker, Photo, MapBounds } from '../types/photo';
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

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    reloadPhotos();
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
        width: '400px',
        backgroundColor: '#F2F2F7',
        overflowY: 'auto',
        padding: '0',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 헤더 */}
        <div style={{
          padding: '20px 20px 16px 20px',
          backgroundColor: '#FFFFFF',
          borderBottom: '0.5px solid rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h1 style={{ 
            margin: '0', 
            fontSize: '28px', 
            fontWeight: '700',
            color: '#000000',
            letterSpacing: '-0.5px',
          }}>
            Photo Liner
          </h1>
          {userName && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: '#F2F2F7',
                borderRadius: '20px',
              }}>
                <span style={{
                  fontSize: '18px',
                  lineHeight: '1',
                }}>
                  👤
                </span>
                <span style={{
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#000000',
                }}>
                  {userName}님
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#8E8E93',
                  border: '1px solid #E5E5EA',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F2F2F7';
                  e.currentTarget.style.color = '#000000';
                  e.currentTarget.style.borderColor = '#C7C7CC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#8E8E93';
                  e.currentTarget.style.borderColor = '#E5E5EA';
                }}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>

        {/* iOS 스타일 세그먼트 컨트롤 */}
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#F2F2F7',
        }}>
          <div style={{
            display: 'flex',
            backgroundColor: '#E5E5EA',
            borderRadius: '10px',
            padding: '3px',
            gap: '3px',
          }}>
            <button
              onClick={() => handleTabChange('photos')}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: activeTab === 'photos' ? '#FFFFFF' : 'transparent',
                border: 'none',
                color: activeTab === 'photos' ? '#007AFF' : '#8E8E93',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeTab === 'photos' ? '600' : '400',
                borderRadius: '8px',
                transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
              }}
            >
              사진 보관함
            </button>
            <button
              onClick={() => handleTabChange('albums')}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: activeTab === 'albums' ? '#FFFFFF' : 'transparent',
                border: 'none',
                color: activeTab === 'albums' ? '#007AFF' : '#8E8E93',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeTab === 'albums' ? '600' : '400',
                borderRadius: '8px',
                transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
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
          padding: '0 20px 20px 20px',
        }}>

        {activeTab === 'photos' && (
          <>
            {!isAuthenticated() && (
              <div style={{
                marginBottom: '16px',
                padding: '20px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}>
                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  로그인이 필요합니다
                </p>
                <button
                  onClick={handleLoginClick}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#FEE500',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  카카오 로그인
                </button>
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <PhotoUpload
                onUploadSuccess={handleUploadSuccess}
                onUploadError={(error) => console.error(error)}
              />
            </div>

            <PhotoList
              onPhotoClick={setSelectedPhoto}
              refreshTrigger={refreshTrigger}
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
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}>
                  <button
                    onClick={() => {
                      setSelectedAlbum(null);
                      setFocusTarget(null);
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      color: '#007AFF',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '17px',
                      fontWeight: '400',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ←
                  </button>
                  <span style={{ 
                    fontSize: '17px', 
                    fontWeight: '600',
                    color: '#000000',
                  }}>
                    {selectedAlbum.name}
                  </span>
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
    </div>
  );
};
