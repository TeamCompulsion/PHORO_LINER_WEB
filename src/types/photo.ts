export interface Photo {
  id: number;
  filePath: string;
  capturedDt: string;
  userId: number;
  latitude?: number;
  longitude?: number;
}

export interface PhotoMarker {
  id: number;
  capturedDt: string;
  filePath: string;
  lat: number;
  lng: number;
}

export interface PoiMarker {
  id: number;
  capturedDt: string;
  lat: number;
  lng: number;
}

export interface PhotoMarkersGroup {
  count: number;
  photoMarkers: PhotoMarker[];
}

export interface PoiMarkersGroup {
  count: number;
  markers: PoiMarker[];
}

export interface MapMarkersResponse {
  innerPhotoMarkers: PhotoMarkersGroup;
  innerPoiMarkers: PoiMarkersGroup;
}

export interface PhotosResponse {
  count: number;
  photos: Photo[];
}

export interface PhotoUploadItem {
  photoId: number;
  fileName: string;
  filePath: string;
  capturedDt?: string;
  latitude?: number;
  longitude?: number;
}

export interface PhotoUploadResponse {
  totalUploaded: number;
  uploadedPhotos: PhotoUploadItem[];
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export interface DateRange {
  from: string; // ISO date format: YYYY-MM-DD
  to: string;   // ISO date format: YYYY-MM-DD
}

export interface PhotoCapturedDateUpdateRequest {
  capturedDt: string; // format: yyyy-MM-dd HH:mm:ss
}

export interface PhotoLocationUpdateRequest {
  latitude: number;
  longitude: number;
}
