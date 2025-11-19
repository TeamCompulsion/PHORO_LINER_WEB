import { apiClient } from './client';
import type {
  PhotosResponse,
  MapMarkersResponse,
  PhotoUploadResponse,
  MapBounds,
  DateRange,
  PhotoCapturedDateUpdateRequest,
  PhotoLocationUpdateRequest,
  DeletePhotosRequest,
} from '../types/photo';

export const photoApi = {
  // GET /api/v1/photos - 사진 목록 조회
  getPhotos: async (userId: number): Promise<PhotosResponse> => {
    const response = await apiClient.get<PhotosResponse>('/photos', {
      params: { userId },
    });
    return response.data;
  },

  // GET /api/v1/photos/markers - 지도 마커 조회
  getMapMarkers: async (
    userId: number,
    dateRange: DateRange,
    bounds: MapBounds
  ): Promise<MapMarkersResponse> => {
    const response = await apiClient.get<MapMarkersResponse>('/photos/markers', {
      params: {
        userId,
        from: dateRange.from,
        to: dateRange.to,
        swLat: bounds.swLat,
        swLng: bounds.swLng,
        neLat: bounds.neLat,
        neLng: bounds.neLng,
      },
    });
    return response.data;
  },

  // POST /api/v1/photos - 사진 업로드
  uploadPhotos: async (userId: number, files: File[]): Promise<PhotoUploadResponse> => {
    const formData = new FormData();
    formData.append('userId', userId.toString());

    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiClient.post<PhotoUploadResponse>('/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // PATCH /api/v1/photos/{photoId}/captured-date - 촬영 날짜 수정
  updateCapturedDate: async (
    photoId: number,
    request: PhotoCapturedDateUpdateRequest
  ): Promise<void> => {
    await apiClient.patch(`/photos/${photoId}/captured-date`, request);
  },

  // PATCH /api/v1/photos/{photoId}/location - 위치 정보 수정
  updateLocation: async (
    photoId: number,
    request: PhotoLocationUpdateRequest
  ): Promise<void> => {
    await apiClient.patch(`/photos/${photoId}/location`, request);
  },

  // DELETE /api/v1/photos - 사진 일괄 삭제
  deletePhotos: async (request: DeletePhotosRequest): Promise<void> => {
    await apiClient.delete('/photos', {
      data: request,
    });
  },
};
