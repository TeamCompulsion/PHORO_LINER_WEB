/// <reference types="navermaps" />

interface MarkerClusteringOptions {
  map: naver.maps.Map | null;
  markers: any[];
  disableClickZoom?: boolean;
  minClusterSize?: number;
  maxZoom?: number;
  gridSize?: number;
  icons?: any[];
  indexGenerator?: number[];
  averageCenter?: boolean;
  stylingFunction?: (clusterMarker: naver.maps.Marker, count: number, cluster: any) => void;
}

declare class MarkerClustering {
  constructor(options: MarkerClusteringOptions);
  setMap(map: naver.maps.Map | null): void;
  redraw(): void;
  getMap(): naver.maps.Map | null;
  getMarkers(): any[];
  addMarker(marker: any, redraw?: boolean): void;
  addMarkers(markers: any[], redraw?: boolean): void;
  removeMarker(marker: any, redraw?: boolean): void;
  removeMarkers(markers: any[], redraw?: boolean): void;
  clearMarkers(): void;
  getMinClusterSize(): number;
  setMinClusterSize(size: number): void;
  getMaxZoom(): number;
  setMaxZoom(zoom: number): void;
  getGridSize(): number;
  setGridSize(size: number): void;
  getIcons(): any[];
  setIcons(icons: any[]): void;
  getIndexGenerator(): number[];
  setIndexGenerator(indexGenerator: number[]): void;
  getAverageCenter(): boolean;
  setAverageCenter(averageCenter: boolean): void;
  getStylingFunction(): (clusterMarker: naver.maps.Marker, count: number, cluster: any) => void;
  setStylingFunction(func: (clusterMarker: naver.maps.Marker, count: number, cluster: any) => void): void;
}

declare global {
  interface Window {
    naver: typeof naver;
    MarkerClustering: typeof MarkerClustering;
  }
}

export {};
