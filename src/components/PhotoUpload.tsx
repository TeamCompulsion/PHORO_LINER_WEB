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
      padding: '12px 16px',
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '16px',
    }}>
      <label
        htmlFor="photo-upload-input"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          cursor: 'pointer',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: '#F2F2F7',
          borderRadius: '10px',
          border: '1px dashed #C7C7CC',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#E5E5EA';
          e.currentTarget.style.borderColor = '#007AFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#F2F2F7';
          e.currentTarget.style.borderColor = '#C7C7CC';
        }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5V19M5 12H19"
              stroke="#007AFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span style={{
            fontSize: '15px',
            fontWeight: '500',
            color: '#007AFF',
          }}>
            사진 선택
          </span>
        </div>

        <input
          id="photo-upload-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{
            display: 'none',
          }}
        />
      </label>

      {selectedFiles.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#F2F2F7',
          borderRadius: '10px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <span style={{
              fontSize: '15px',
              fontWeight: '500',
              color: '#000000',
            }}>
              {selectedFiles.length}개의 파일 선택됨
            </span>
            <button
              onClick={() => {
                setSelectedFiles([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                color: '#FF3B30',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              취소
            </button>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: uploading || selectedFiles.length === 0 ? '#C7C7CC' : '#007AFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              cursor: uploading || selectedFiles.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      )}
    </div>
  );
};
