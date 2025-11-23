import { useState, useRef } from 'react';
import { photoApi } from '../api/photoApi';
import { extractExifData } from '../utils/exif';
import type { CreatePhotoItem, PresignedUrlRequest } from '../types/photo';

interface PhotoUploadProps {
  onUploadSuccess?: (uploadedCount: number) => void;
  onUploadError?: (error: Error) => void;
}

export const PhotoUpload = ({ onUploadSuccess, onUploadError }: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    setUploading(true);

    try {
      // 1. 파일별 메타데이터 추출
      setUploadProgress('메타데이터 추출 중...');
      const metadataList = await Promise.all(
        fileArray.map((file) => extractExifData(file))
      );

      // 2. Presigned URL 요청
      setUploadProgress('업로드 준비 중...');
      const presignedRequests: PresignedUrlRequest[] = fileArray.map((file) => ({
        originalFileName: file.name,
        contentType: file.type || 'image/jpeg',
      }));

      const presignedResponses = await photoApi.getPresignedUrls(presignedRequests);

      // 3. S3에 직접 업로드
      setUploadProgress('S3에 업로드 중...');
      await Promise.all(
        fileArray.map((file, index) =>
          photoApi.uploadToS3(presignedResponses[index].presignedUrl, file)
        )
      );

      // 4. 백엔드에 메타데이터 저장
      setUploadProgress('저장 중...');
      const photos: CreatePhotoItem[] = fileArray.map((file, index) => {
        const metadata = metadataList[index];
        const photo: CreatePhotoItem = {
          fileName: file.name,
          uploadFileName: presignedResponses[index].uploadFileName,
        };
        
        // null이 아닌 값만 추가
        if (metadata.capturedDate !== null && metadata.capturedDate !== undefined) {
          photo.capturedDate = metadata.capturedDate;
        }
        if (metadata.latitude !== null && metadata.latitude !== undefined) {
          // 좌표 정밀도 조정 (소수점 6자리) 및 명시적 number 타입 변환
          const lat = parseFloat(metadata.latitude.toFixed(6));
          if (!isNaN(lat)) {
            photo.latitude = lat;
          }
        }
        if (metadata.longitude !== null && metadata.longitude !== undefined) {
          // 좌표 정밀도 조정 (소수점 6자리) 및 명시적 number 타입 변환
          const lng = parseFloat(metadata.longitude.toFixed(6));
          if (!isNaN(lng)) {
            photo.longitude = lng;
          }
        }
        
        return photo;
      });

      console.log('[PhotoUpload] Request data:', JSON.stringify({ photos }, null, 2));

      await photoApi.createPhotos({
        photos,
      });

      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadSuccess?.(fileArray.length);
      console.log(`${fileArray.length}개의 사진이 업로드되었습니다.`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('업로드 실패');
      onUploadError?.(err);
      alert('사진 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: uploading ? '#E5E5EA' : '#F2F2F7',
          borderRadius: '10px',
          border: uploading ? '1px solid #007AFF' : '1px dashed #C7C7CC',
          transition: 'all 0.2s',
          opacity: uploading ? 0.7 : 1,
          pointerEvents: uploading ? 'none' : 'auto',
        }}
        onMouseEnter={(e) => {
          if (!uploading) {
            e.currentTarget.style.backgroundColor = '#E5E5EA';
            e.currentTarget.style.borderColor = '#007AFF';
          }
        }}
        onMouseLeave={(e) => {
          if (!uploading) {
            e.currentTarget.style.backgroundColor = '#F2F2F7';
            e.currentTarget.style.borderColor = '#C7C7CC';
          }
        }}
        >
          {uploading ? (
            <>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #C7C7CC',
                borderTop: '2px solid #007AFF',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{
                fontSize: '15px',
                fontWeight: '500',
                color: '#007AFF',
              }}>
                {uploadProgress || `업로드 중... (${selectedFiles.length}개)`}
              </span>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <input
          id="photo-upload-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          style={{
            display: 'none',
          }}
        />
      </label>

    </div>
  );
};
