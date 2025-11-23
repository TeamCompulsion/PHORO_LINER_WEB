// 앨범 관련 타입 정의

export interface Album {
  id: number;
  name: string;
}

export interface PageInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface AlbumsResponse {
  albums: Album[];
  pageInfo: PageInfo;
}

export interface AlbumCreateRequest {
  title: string;
}

export interface AlbumTitleUpdateRequest {
  title: string;
}

export interface AlbumDeleteRequest {
  ids: number[];
}

export interface AlbumPhotoItem {
  id: number;
  photoId: number;
  fileName: string;
  filePath: string;
  thumbnailPath: string;
  capturedDt: string;
  latitude?: number;
  longitude?: number;
}

export interface AlbumPhotoItemsResponse {
  items: AlbumPhotoItem[];
  pageInfo?: PageInfo;
}

export interface AlbumItemCreateRequest {
  ids: number[];
}

export interface AlbumItemDeleteRequest {
  ids: number[];
}

export interface AlbumListParams {
  page?: number;
  size?: number;
}

export interface AlbumPhotoListParams {
  page?: number;
  size?: number;
}

export interface AlbumPhotoMarker {
  id: number;
  photoId: number;
  filePath: string;
  thumbnailPath?: string;
  capturedDt: string;
  lat?: number;
  lng?: number;
}

export interface AlbumPhotoMarkersResponse {
  count: number;
  albumPhotoMarkers: AlbumPhotoMarker[];
}

