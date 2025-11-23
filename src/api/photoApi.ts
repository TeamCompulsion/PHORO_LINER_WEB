import { apiClient } from './client';
import type {
  PhotosResponse,
  PhotoListParams,
  PhotoMarkersResponse,
  MapBounds,
  PhotoCapturedDateUpdateRequest,
  PhotoLocationUpdateRequest,
  DeletePhotosRequest,
  PresignedUrlRequest,
  PresignedUrlResponse,
  CreatePhotosRequest,
} from '../types/photo';

export const photoApi = {
  // GET /api/v1/photos - 사진 목록 조회
  getPhotos: async (params: PhotoListParams): Promise<PhotosResponse> => {
    const response = await apiClient.get<PhotosResponse>('/photos', {
      params: {
        userId: params.userId,
        ...(params.page !== undefined && { page: params.page }),
        ...(params.size !== undefined && { size: params.size }),
      },
    });
    return response.data;
  },

  // GET /api/v1/photos/markers?userId={userId} - 지도 마커 조회
  getMapMarkers: async (
    userId: number,
    bounds: MapBounds
  ): Promise<PhotoMarkersResponse> => {
    const response = await apiClient.get<PhotoMarkersResponse>('/photos/markers', {
      params: {
        userId,
        swLat: bounds.swLat,
        swLng: bounds.swLng,
        neLat: bounds.neLat,
        neLng: bounds.neLng,
      },
    });
    return response.data;
  },

  // POST /api/v1/photos/presigned-urls - Presigned URL 발급
  getPresignedUrls: async (
    requests: PresignedUrlRequest[]
  ): Promise<PresignedUrlResponse[]> => {
    const response = await apiClient.post<PresignedUrlResponse[]>(
      '/photos/presigned-urls',
      requests
    );
    return response.data;
  },

  // S3에 직접 업로드
  uploadToS3: async (presignedUrl: string, file: File): Promise<void> => {
    await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  },

  // POST /api/v1/photos - 사진 메타데이터 저장
  createPhotos: async (request: CreatePhotosRequest): Promise<void> => {
    await apiClient.post('/photos', request);
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
