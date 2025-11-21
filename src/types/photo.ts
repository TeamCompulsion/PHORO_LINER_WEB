export interface Photo {
  id: number;
  filePath: string;
  thumbnailPath?: string;
  capturedDt: string;
  userId: number;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
}

export interface PhotoMarker {
  id: number;
  capturedDt: string;
  filePath: string;
  thumbnailPath?: string;
  lat: number;
  lng: number;
}

export interface PoiMarker {
  id: number;
  capturedDt: string;
  filePath?: string;
  thumbnailPath?: string;
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

export interface PageInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PhotosResponse {
  photos: Photo[];
  pageInfo: PageInfo;
}

export interface PhotoListParams {
  userId: number;
  page?: number;
  size?: number;
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

export interface DeletePhotosRequest {
  ids: number[];
}
