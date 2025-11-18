# Photo Liner Web

네이버 지도 기반 사진 관리 웹 애플리케이션

## 기능

- 네이버 지도를 활용한 사진 위치 표시
- 사진 업로드 (EXIF 메타데이터 자동 추출)
- 지도 상의 마커로 사진 위치 시각화
- 날짜 범위 필터링
- 사진 메타데이터 수정 (촬영일시, GPS 좌표)

## 기술 스택

- React 19.2
- TypeScript
- Vite
- Naver Maps API
- Axios (API 통신)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Naver Map API
VITE_NAVER_MAP_CLIENT_ID=your_naver_map_client_id_here

# User Configuration (for demo)
VITE_DEFAULT_USER_ID=1
```

**네이버 지도 API 키 발급:**
1. [네이버 클라우드 플랫폼](https://www.ncloud.com/)에 접속
2. 콘솔 로그인
3. Services > AI·NAVER API > AI·NAVER API 메뉴 선택
4. Application 등록 후 Client ID 복사
5. `.env` 파일의 `VITE_NAVER_MAP_CLIENT_ID`에 붙여넣기

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 4. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

## 프로젝트 구조

```
photo_liner_web/
├── src/
│   ├── api/              # API 클라이언트
│   │   ├── client.ts     # Axios 인스턴스
│   │   └── photoApi.ts   # Photo API 함수
│   ├── components/       # React 컴포넌트
│   │   ├── NaverMap.tsx
│   │   ├── PhotoUpload.tsx
│   │   ├── PhotoList.tsx
│   │   ├── PhotoDetail.tsx
│   │   └── DateRangeFilter.tsx
│   ├── pages/           # 페이지 컴포넌트
│   │   └── MainPage.tsx
│   ├── types/           # TypeScript 타입 정의
│   │   ├── photo.ts
│   │   └── naver-maps.d.ts
│   ├── hooks/           # 커스텀 훅
│   │   └── useNaverMap.ts
│   ├── utils/           # 유틸리티 함수
│   │   └── loadNaverMaps.ts
│   ├── config/          # 설정 파일
│   │   └── env.ts       # 환경변수 설정
│   ├── App.tsx
│   └── main.tsx
├── .env                 # 환경변수 (git에 포함되지 않음)
├── .env.example         # 환경변수 예시
└── package.json
```

## API 엔드포인트

백엔드 API (`PHOTO_LINER_API`)의 다음 엔드포인트를 사용합니다:

- `GET /api/v1/photos` - 사진 목록 조회
- `GET /api/v1/photos/markers` - 지도 마커 조회
- `POST /api/v1/photos` - 사진 업로드
- `PATCH /api/v1/photos/{photoId}/captured-date` - 촬영 날짜 수정
- `PATCH /api/v1/photos/{photoId}/location` - 위치 정보 수정

## 주요 컴포넌트

### NaverMap
네이버 지도를 렌더링하고 사진 마커를 표시합니다.

### PhotoUpload
여러 사진 파일을 선택하여 서버에 업로드합니다.

### PhotoList
사용자의 사진 목록을 그리드 형태로 표시합니다.

### PhotoDetail
선택한 사진의 상세 정보를 모달로 표시하고 편집할 수 있습니다.

### DateRangeFilter
지도에 표시할 사진의 날짜 범위를 필터링합니다.

## 환경변수 설명

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `VITE_API_BASE_URL` | 백엔드 API 서버 주소 | `http://localhost:8080/api/v1` |
| `VITE_NAVER_MAP_CLIENT_ID` | 네이버 지도 API 클라이언트 ID | (필수) |
| `VITE_DEFAULT_USER_ID` | 기본 사용자 ID | `1` |

## 개발 가이드

### 새로운 API 엔드포인트 추가

1. `src/types/photo.ts`에 타입 정의 추가
2. `src/api/photoApi.ts`에 API 함수 추가
3. 컴포넌트에서 사용

### 스타일링

현재는 인라인 스타일을 사용하고 있습니다. 필요시 CSS Modules나 Styled Components로 변경할 수 있습니다.

## 라이선스

MIT
