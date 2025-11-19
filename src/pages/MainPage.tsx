import { useState, useEffect, useCallback } from 'react';
import { NaverMap } from '../components/NaverMap';
import { PhotoUpload } from '../components/PhotoUpload';
import { PhotoList } from '../components/PhotoList';
import { PhotoDetail } from '../components/PhotoDetail';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { photoApi } from '../api/photoApi';
import { config } from '../config/env';
import type { PhotoMarker, PoiMarker, Photo, MapBounds } from '../types/photo';

export const MainPage = () => {
  const [photoMarkers, setPhotoMarkers] = useState<PhotoMarker[]>([]);
  const [poiMarkers, setPoiMarkers] = useState<PoiMarker[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | PhotoMarker | null>(null);
  const [locationEditPhoto, setLocationEditPhoto] = useState<Photo | PhotoMarker | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const loadMarkers = useCallback(async () => {
    if (!mapBounds) return;

    try {
      const response = await photoApi.getMapMarkers(
        config.defaultUserId,
        dateRange,
        mapBounds
      );

      setPhotoMarkers(response.innerPhotoMarkers.photoMarkers);
      setPoiMarkers(response.innerPoiMarkers.markers);
    } catch (error) {
      console.error('Failed to load markers:', error);
    }
  }, [mapBounds, dateRange]);

  useEffect(() => {
    loadMarkers();
  }, [loadMarkers]);

  const handleMapBoundsChange = (bounds: MapBounds) => {
    setMapBounds(bounds);
  };

  const handleDateRangeChange = (from: string, to: string) => {
    setDateRange({ from, to });
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

        <DateRangeFilter onDateRangeChange={handleDateRangeChange} />

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
    </div>
  );
};
