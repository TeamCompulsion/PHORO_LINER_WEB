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
    if (!mapBounds || !selectedAlbum) return;

    try {
      const response = await photoApi.getMapMarkers(
        config.defaultUserId,
        selectedAlbum.id,
        mapBounds
      );

      setPhotoMarkers(response.innerPhotoMarkers.photoMarkers);
      setPoiMarkers(response.innerPoiMarkers.markers);
    } catch (error) {
      console.error('Failed to load markers:', error);
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

  const handleShowAlbumOnMap = () => {
    if (selectedAlbum) {
      // mapBounds가 없으면 기본 범위로 설정
      if (!mapBounds) {
        // 기본 범위: 한국 전체
        const defaultBounds: MapBounds = {
          swLat: 33.0,
          swLng: 124.0,
          neLat: 38.6,
          neLng: 132.0,
        };
        setMapBounds(defaultBounds);
        // mapBounds가 설정되면 loadMarkers가 자동으로 호출됨
        return;
      }
      loadMarkers();
    }
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

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* 왼쪽 사이드바 */}
      <div style={{
        width: '400px',
        backgroundColor: '#f5f5f5',
        overflowY: 'auto',
        padding: '20px',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ margin: '0 0 20px 0', fontSize: '24px', color: '#333' }}>
          Photo Liner
        </h1>

        {/* 탭 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '2px solid #e0e0e0',
        }}>
          <button
            onClick={() => handleTabChange('photos')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'photos' ? '3px solid #1976d2' : '3px solid transparent',
              color: activeTab === 'photos' ? '#1976d2' : '#666',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'photos' ? '600' : '400',
              transition: 'all 0.2s',
            }}
          >
            사진 보관함
          </button>
          <button
            onClick={() => handleTabChange('albums')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'albums' ? '3px solid #1976d2' : '3px solid transparent',
              color: activeTab === 'albums' ? '#1976d2' : '#666',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'albums' ? '600' : '400',
              transition: 'all 0.2s',
            }}
          >
            앨범
          </button>
        </div>

        {activeTab === 'photos' && (
          <>
            <div style={{ marginBottom: '20px' }}>
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
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                  <button
                    onClick={() => setSelectedAlbum(null)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f5f5f5',
                      color: '#666',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ← 뒤로
                  </button>
                  <span style={{ fontSize: '16px', fontWeight: '500' }}>
                    {selectedAlbum.name}
                  </span>
                </div>
                <AlbumPhotoList
                  albumId={selectedAlbum.id}
                  onPhotoClick={setSelectedPhoto}
                  refreshTrigger={refreshTrigger}
                  onShowOnMap={handleShowAlbumOnMap}
                  onAddPhotos={handleAddPhotosToAlbum}
                />
              </div>
            ) : (
              <AlbumList
                onAlbumClick={handleAlbumClick}
                refreshTrigger={refreshTrigger}
                selectedAlbumId={selectedAlbum?.id || null}
              />
            )}
          </>
        )}
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

        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          fontSize: '14px',
        }}>
          <div>📷 사진 마커: {photoMarkers.length}</div>
          <div>📍 POI 마커: {poiMarkers.length}</div>
        </div>
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
          albumId={selectedAlbum.id}
        />
      )}
    </div>
  );
};
