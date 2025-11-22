import { useState, useEffect, useCallback } from 'react';
import { NaverMap } from '../components/NaverMap';
import { PhotoUpload } from '../components/PhotoUpload';
import { PhotoList } from '../components/PhotoList';
import { PhotoDetail } from '../components/PhotoDetail';
import { AlbumList } from '../components/AlbumList';
import { AlbumPhotoList } from '../components/AlbumPhotoList';
import { PhotoSelectionModal } from '../components/PhotoSelectionModal';
import { photoApi } from '../api/photoApi';
import { albumApi } from '../api/albumApi';
import { config } from '../config/env';
import type { PhotoMarker, PoiMarker, Photo, MapBounds } from '../types/photo';
import type { Album } from '../types/album';

type TabType = 'photos' | 'albums';

export const MainPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('photos');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [photoMarkers, setPhotoMarkers] = useState<PhotoMarker[]>([]);
  const [poiMarkers, setPoiMarkers] = useState<PoiMarker[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | PhotoMarker | null>(null);
  const [locationEditPhoto, setLocationEditPhoto] = useState<Photo | PhotoMarker | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [isPhotoSelectionModalOpen, setIsPhotoSelectionModalOpen] = useState(false);

  const loadMarkers = useCallback(async () => {
    // mapBounds가 없으면 기본 범위(한국 전체) 사용
    const bounds = mapBounds || {
      swLat: 33.0,  // 남쪽 위도
      swLng: 124.0, // 서쪽 경도
      neLat: 38.6,  // 북쪽 위도
      neLng: 132.0, // 동쪽 경도
    };

    try {
      if (selectedAlbum) {
        // 앨범이 선택된 경우: 앨범별 마커 조회
        const response = await albumApi.getAlbumMarkers(selectedAlbum.id, bounds);
        console.log('Album markers response:', response);
        console.log('Album markers items:', response?.albumPhotoMarkers);
        
        // AlbumPhotoMarker를 PhotoMarker로 변환 (lat, lng가 있는 경우만)
        const markers: PhotoMarker[] = (response?.albumPhotoMarkers || [])
          .filter((marker) => {
            const hasLatLng = marker.lat != null && marker.lng != null;
            if (!hasLatLng) {
              console.warn('Marker missing lat/lng:', marker);
            }
            return hasLatLng;
          })
          .map((marker) => ({
            id: marker.id,
            capturedDt: marker.capturedDt || '', // null인 경우 빈 문자열로 변환
            filePath: marker.filePath,
            thumbnailPath: marker.thumbnailPath,
            lat: marker.lat!,
            lng: marker.lng!,
          }));
        console.log('Converted markers:', markers);
        console.log('Converted markers count:', markers.length);
        if (markers.length > 0) {
          console.log('First marker details:', markers[0]);
          console.log('First marker lat/lng:', markers[0].lat, markers[0].lng);
        } else {
          console.warn('No markers after conversion! Check filter conditions.');
        }
        setPhotoMarkers(markers);
        console.log('setPhotoMarkers called with', markers.length, 'markers');
        setPoiMarkers([]); // 앨범 마커에는 POI가 없음
      } else {
        // 앨범이 선택되지 않은 경우: 전체 사진 마커 조회
        const response = await photoApi.getMapMarkers(config.defaultUserId, bounds);
        setPhotoMarkers(response?.photoMarkers || []);
        setPoiMarkers([]); // 전체 마커에도 POI가 없음 (스펙 변경)
      }
    } catch (error) {
      console.error('Failed to load markers:', error);
      // 에러 발생 시 빈 배열로 초기화
      setPhotoMarkers([]);
      setPoiMarkers([]);
    }
  }, [mapBounds, selectedAlbum]);

  useEffect(() => {
    loadMarkers();
  }, [loadMarkers]);

  const handleMapBoundsChange = (bounds: MapBounds) => {
    setMapBounds(bounds);
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    loadMarkers();
  };

  const handlePhotoUpdate = () => {
    setSelectedPhoto(null);
    setRefreshTrigger((prev) => prev + 1);
    loadMarkers();
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
      loadMarkers();
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
    } catch (error) {
      console.error(error);
      alert('사진 추가에 실패했습니다.');
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'photos') {
      setSelectedAlbum(null);
    }
  };

  console.log('MainPage rendering', { activeTab, selectedAlbum });

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#F2F2F7',
    }}>
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
                    onClick={() => setSelectedAlbum(null)}
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
