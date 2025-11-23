import { apiClient } from './client';
import type {
  AlbumsResponse,
  AlbumCreateRequest,
  AlbumTitleUpdateRequest,
  AlbumDeleteRequest,
  AlbumPhotoItemsResponse,
  AlbumItemCreateRequest,
  AlbumItemDeleteRequest,
  AlbumListParams,
} from '../types/album';

export const albumApi = {
  // POST /api/v1/albums - 앨범 생성
  createAlbum: async (request: AlbumCreateRequest): Promise<void> => {
    await apiClient.post('/albums', request);
  },

  // GET /api/v1/albums - 앨범 목록 조회
  getAlbums: async (params: AlbumListParams): Promise<AlbumsResponse> => {
    const response = await apiClient.get<AlbumsResponse>('/albums', {
      params: {
        ...(params.page !== undefined && { page: params.page }),
        ...(params.size !== undefined && { size: params.size }),
      },
    });
    return response.data;
  },

  // PATCH /api/v1/albums/{albumId}/title - 앨범 제목 수정
  updateAlbumTitle: async (
    albumId: number,
    request: AlbumTitleUpdateRequest
  ): Promise<void> => {
    await apiClient.patch(`/albums/${albumId}/title`, request);
  },

  // DELETE /api/v1/albums - 앨범 삭제
  deleteAlbums: async (request: AlbumDeleteRequest): Promise<void> => {
    await apiClient.delete('/albums', {
      data: request,
    });
  },

  // GET /api/v1/albums/{albumId}/photos - 앨범 내 사진 전체 조회
  getAlbumPhotos: async (
    albumId: number
  ): Promise<AlbumPhotoItemsResponse> => {
    const response = await apiClient.get<AlbumPhotoItemsResponse>(
      `/albums/${albumId}/photos`
    );
    return response.data;
  },

  // POST /api/v1/albums/{albumId}/photos - 앨범 내 사진 추가
  addPhotosToAlbum: async (
    albumId: number,
    request: AlbumItemCreateRequest
  ): Promise<void> => {
    await apiClient.post(`/albums/${albumId}/photos`, request);
  },

  // DELETE /api/v1/albums/{albumId}/photos - 앨범 내 사진 삭제
  removePhotosFromAlbum: async (
    albumId: number,
    request: AlbumItemDeleteRequest
  ): Promise<void> => {
    await apiClient.delete(`/albums/${albumId}/photos`, {
      data: request,
    });
  },
};

