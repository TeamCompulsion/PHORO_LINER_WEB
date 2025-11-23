export interface Photo {
  id: number;
  fileName?: string;
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

export interface PhotoMarkersResponse {
  count: number;
  photoMarkers: PhotoMarker[];
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
  page?: number;
  size?: number;
  hasLocation?: boolean | null;
  hasCapturedDate?: boolean | null;
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

// Presigned URL 관련 타입
export interface PresignedUrlRequest {
  originalFileName: string;
  contentType: string;
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  uploadFileName: string;
}

// 사진 생성 요청 타입
export interface CreatePhotoItem {
  fileName: string;
  uploadFileName: string;
  capturedDate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CreatePhotosRequest {
  photos: CreatePhotoItem[];
}

// 생성된 사진 정보 응답 타입
export interface CreatedPhotoItem {
  id: number;
  fileName: string;
  filePath: string;
  thumbnailPath?: string;
  capturedDt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CreatePhotosResponse {
  photos: CreatedPhotoItem[];
}

// 메타데이터 설정이 필요한 사진 정보
export interface PhotoForMetadataSetup {
  id: number;
  fileName: string;
  filePath: string;
  thumbnailPath?: string;
  hasLocation: boolean;
  hasCapturedDate: boolean;
}
