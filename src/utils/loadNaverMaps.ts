import { config } from '../config/env';

let isLoading = false;
let isLoaded = false;

export const loadNaverMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드되었으면 즉시 resolve
    if (isLoaded) {
      resolve();
      return;
    }

    // 이미 로딩 중이면 로딩이 완료될 때까지 대기
    if (isLoading) {
      const checkInterval = setInterval(() => {
        if (isLoaded) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    if (!config.naverMapClientId) {
      reject(new Error('Naver Map Client ID is not configured'));
      return;
    }

    isLoading = true;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${config.naverMapClientId}`;
    script.async = true;

    script.onload = () => {
      // Naver Maps SDK 로드 후 MarkerClustering 라이브러리 로드
      const clusteringScript = document.createElement('script');
      clusteringScript.type = 'text/javascript';
      clusteringScript.src = '/MarkerClustering.js';
      clusteringScript.async = true;

      clusteringScript.onload = () => {
        isLoaded = true;
        isLoading = false;
        resolve();
      };

      clusteringScript.onerror = () => {
        isLoading = false;
        reject(new Error('Failed to load MarkerClustering library'));
      };

      document.head.appendChild(clusteringScript);
    };

    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Naver Maps SDK'));
    };

    document.head.appendChild(script);
  });
};
