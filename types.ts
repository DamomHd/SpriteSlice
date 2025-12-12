export interface GridConfig {
  rows: number;
  cols: number;
  padding: number; // Inner padding for the crop
  gapX: number;    // Horizontal gap between cells
  gapY: number;    // Vertical gap between cells
  offsetX: number; // Starting X offset
  offsetY: number; // Starting Y offset
  gridWidth: number; // Explicit width of the grid area
  gridHeight: number; // Explicit height of the grid area
  lockAspectRatio: boolean; // Whether to force a specific aspect ratio
  aspectRatio: number;      // Width / Height ratio (e.g. 1 for square)
}

export interface SlicedIcon {
  id: string;
  url: string;
  blob: Blob;
  width: number;
  height: number;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  EDITING = 'EDITING',
  SLICING = 'SLICING',
  DONE = 'DONE'
}