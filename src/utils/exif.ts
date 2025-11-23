// EXIF 데이터 추출 유틸리티
export interface PhotoMetadata {
  capturedDate: string | null;
  latitude: number | null;
  longitude: number | null;
}

// ArrayBuffer에서 EXIF 데이터 파싱
export const extractExifData = async (file: File): Promise<PhotoMetadata> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as ArrayBuffer;
      if (!result) {
        resolve({ capturedDate: null, latitude: null, longitude: null });
        return;
      }

      try {
        const exifData = parseExif(result);
        resolve(exifData);
      } catch {
        resolve({ capturedDate: null, latitude: null, longitude: null });
      }
    };

    reader.onerror = () => {
      resolve({ capturedDate: null, latitude: null, longitude: null });
    };

    reader.readAsArrayBuffer(file);
  });
};

// EXIF 파싱 (JPEG 전용)
function parseExif(arrayBuffer: ArrayBuffer): PhotoMetadata {
  const dataView = new DataView(arrayBuffer);
  const metadata: PhotoMetadata = {
    capturedDate: null,
    latitude: null,
    longitude: null,
  };

  // JPEG 시그니처 확인
  if (dataView.getUint16(0) !== 0xffd8) {
    return metadata;
  }

  let offset = 2;
  const length = dataView.byteLength;

  while (offset < length) {
    if (dataView.getUint8(offset) !== 0xff) {
      break;
    }

    const marker = dataView.getUint8(offset + 1);

    // APP1 마커 (EXIF)
    if (marker === 0xe1) {
      const exifOffset = offset + 4;
      const exifHeader = getString(dataView, exifOffset, 4);

      if (exifHeader === 'Exif') {
        const tiffOffset = exifOffset + 6;
        const littleEndian = dataView.getUint16(tiffOffset) === 0x4949;

        const ifdOffset = dataView.getUint32(tiffOffset + 4, littleEndian);
        parseIfd(dataView, tiffOffset, tiffOffset + ifdOffset, littleEndian, metadata);
      }
      break;
    }

    offset += 2 + dataView.getUint16(offset + 2);
  }

  return metadata;
}

function getString(dataView: DataView, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(dataView.getUint8(offset + i));
  }
  return str;
}

function parseIfd(
  dataView: DataView,
  tiffOffset: number,
  ifdOffset: number,
  littleEndian: boolean,
  metadata: PhotoMetadata
): void {
  const entries = dataView.getUint16(ifdOffset, littleEndian);

  for (let i = 0; i < entries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    const tag = dataView.getUint16(entryOffset, littleEndian);

    // DateTimeOriginal (0x9003) 또는 DateTime (0x0132)
    if (tag === 0x9003 || tag === 0x0132) {
      const type = dataView.getUint16(entryOffset + 2, littleEndian);
      const count = dataView.getUint32(entryOffset + 4, littleEndian);

      if (type === 2 && count > 0) {
        // ASCII 타입
        const valueOffset = dataView.getUint32(entryOffset + 8, littleEndian);
        const dateStr = getString(dataView, tiffOffset + valueOffset, count - 1);
        // EXIF 형식: "YYYY:MM:DD HH:MM:SS" -> ISO 8601 형식으로 변환 (LocalDateTime)
        const isoDate = dateStr
          .replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
          .replace(' ', 'T');
        metadata.capturedDate = isoDate;
      }
    }

    // GPS IFD Pointer (0x8825)
    if (tag === 0x8825) {
      const gpsIfdOffset = dataView.getUint32(entryOffset + 8, littleEndian);
      parseGpsIfd(dataView, tiffOffset, tiffOffset + gpsIfdOffset, littleEndian, metadata);
    }

    // EXIF IFD Pointer (0x8769)
    if (tag === 0x8769) {
      const exifIfdOffset = dataView.getUint32(entryOffset + 8, littleEndian);
      parseIfd(dataView, tiffOffset, tiffOffset + exifIfdOffset, littleEndian, metadata);
    }
  }
}

function parseGpsIfd(
  dataView: DataView,
  tiffOffset: number,
  gpsOffset: number,
  littleEndian: boolean,
  metadata: PhotoMetadata
): void {
  const entries = dataView.getUint16(gpsOffset, littleEndian);
  let latRef = 'N';
  let lngRef = 'E';
  let lat: number | null = null;
  let lng: number | null = null;

  for (let i = 0; i < entries; i++) {
    const entryOffset = gpsOffset + 2 + i * 12;
    const tag = dataView.getUint16(entryOffset, littleEndian);

    // GPSLatitudeRef (0x0001)
    if (tag === 0x0001) {
      latRef = String.fromCharCode(dataView.getUint8(entryOffset + 8));
    }

    // GPSLatitude (0x0002)
    if (tag === 0x0002) {
      const valueOffset = dataView.getUint32(entryOffset + 8, littleEndian);
      lat = parseGpsCoordinate(dataView, tiffOffset + valueOffset, littleEndian);
    }

    // GPSLongitudeRef (0x0003)
    if (tag === 0x0003) {
      lngRef = String.fromCharCode(dataView.getUint8(entryOffset + 8));
    }

    // GPSLongitude (0x0004)
    if (tag === 0x0004) {
      const valueOffset = dataView.getUint32(entryOffset + 8, littleEndian);
      lng = parseGpsCoordinate(dataView, tiffOffset + valueOffset, littleEndian);
    }
  }

  if (lat !== null) {
    metadata.latitude = latRef === 'S' ? -lat : lat;
  }
  if (lng !== null) {
    metadata.longitude = lngRef === 'W' ? -lng : lng;
  }
}

function parseGpsCoordinate(
  dataView: DataView,
  offset: number,
  littleEndian: boolean
): number {
  const degrees =
    dataView.getUint32(offset, littleEndian) /
    dataView.getUint32(offset + 4, littleEndian);
  const minutes =
    dataView.getUint32(offset + 8, littleEndian) /
    dataView.getUint32(offset + 12, littleEndian);
  const seconds =
    dataView.getUint32(offset + 16, littleEndian) /
    dataView.getUint32(offset + 20, littleEndian);

  return degrees + minutes / 60 + seconds / 3600;
}
