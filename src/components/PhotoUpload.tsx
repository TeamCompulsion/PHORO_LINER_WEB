import { useState, useRef } from 'react';
import { photoApi } from '../api/photoApi';
import { config } from '../config/env';
import type { PhotoUploadResponse } from '../types/photo';

interface PhotoUploadProps {
  onUploadSuccess?: (response: PhotoUploadResponse) => void;
  onUploadError?: (error: Error) => void;
}

export const PhotoUpload = ({ onUploadSuccess, onUploadError }: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('업로드할 파일을 선택해주세요.');
      return;
    }

    setUploading(true);

    try {
      const response = await photoApi.uploadPhotos(config.defaultUserId, selectedFiles);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadSuccess?.(response);
      alert(`${response.totalUploaded}개의 사진이 업로드되었습니다.`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('업로드 실패');
      onUploadError?.(err);
      alert('사진 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{ marginTop: 0 }}>사진 업로드</h3>

      <div style={{ marginBottom: '16px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{
            display: 'block',
            marginBottom: '8px',
          }}
        />
        {selectedFiles.length > 0 && (
          <p style={{ fontSize: '14px', color: '#666' }}>
            {selectedFiles.length}개의 파일 선택됨
          </p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || selectedFiles.length === 0}
        style={{
          padding: '10px 20px',
          backgroundColor: uploading ? '#ccc' : '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {uploading ? '업로드 중...' : '업로드'}
      </button>
    </div>
  );
};
