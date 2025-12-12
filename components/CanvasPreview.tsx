import React, { useRef, useEffect, useState } from 'react';
import { GridConfig } from '../types';

interface CanvasPreviewProps {
  imageSrc: string | null;
  config: GridConfig;
  onConfigChange?: (config: GridConfig) => void;
  onSliceGenerated?: (slices: any[]) => void;
  triggerSlice: boolean;
  onSliceComplete: () => void;
}

const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  imageSrc,
  config,
  onConfigChange,
  onSliceGenerated,
  triggerSlice,
  onSliceComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
  
  // Viewport State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Interaction State
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingGrid, setIsDraggingGrid] = useState(false);
  const [isResizingGrid, setIsResizingGrid] = useState(false);
  
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null); // For grid ops
  const [panStart, setPanStart] = useState<{x: number, y: number} | null>(null); // For panning
  
  const [configStart, setConfigStart] = useState<GridConfig | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>('default');

  // Initialize grid dimensions when image loads
  useEffect(() => {
    if (imgObj && onConfigChange) {
       // If dimensions are not set (0), initialize to full image size
       if (config.gridWidth === 0 || config.gridHeight === 0) {
           onConfigChange({
               ...config,
               gridWidth: imgObj.width,
               gridHeight: imgObj.height,
               offsetX: 0,
               offsetY: 0
           });
       }
    }
  }, [imgObj]); 

  // Load Image
  useEffect(() => {
    if (!imageSrc) {
        setImgObj(null);
        return;
    }
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImgObj(img);
      // Auto-fit logic
      if (containerRef.current) {
         const containerWidth = containerRef.current.clientWidth;
         const containerHeight = containerRef.current.clientHeight;
         const scaleW = (containerWidth - 80) / img.width;
         const scaleH = (containerHeight - 80) / img.height;
         setScale(Math.min(scaleW, scaleH, 1)); 
         setPan({ x: 0, y: 0 });
      }
    };
  }, [imageSrc]);

  // Handle Keyboard (Spacebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && !e.repeat) {
            setIsSpacePressed(true);
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            setIsSpacePressed(false);
            setIsPanning(false); // Stop panning if space released
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle Zoom (Wheel)
  const handleWheel = (e: React.WheelEvent) => {
      if (!imageSrc) return;
      // Use Ctrl+Wheel to zoom, or just Wheel if no conflict. Let's do standard Wheel zoom.
      // e.deltaY > 0 means scroll down (zoom out), < 0 scroll up (zoom in)
      const zoomSensitivity = 0.001;
      const newScale = Math.max(0.1, Math.min(10, scale - e.deltaY * zoomSensitivity));
      setScale(newScale);
  };


  // Main Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgObj) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Setup Canvas
    canvas.width = imgObj.width;
    canvas.height = imgObj.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Source Image
    ctx.drawImage(imgObj, 0, 0);

    // 3. Calculate Grid Geometry
    const gridW = config.gridWidth || imgObj.width; 
    let gridH = config.gridHeight || imgObj.height;

    const { rows, cols, padding, gapX, gapY, offsetX, offsetY, lockAspectRatio, aspectRatio } = config;

    const totalGapX = Math.max(0, cols - 1) * gapX;
    const cellWidth = (gridW - totalGapX) / cols;
    
    let cellHeight: number;
    if (lockAspectRatio) {
        cellHeight = cellWidth / (aspectRatio || 1);
        const totalGapY = Math.max(0, rows - 1) * gapY;
        gridH = (cellHeight * rows) + totalGapY; 
    } else {
        const totalGapY = Math.max(0, rows - 1) * gapY;
        cellHeight = (gridH - totalGapY) / rows;
    }

    const slicesToExport: any[] = [];

    // 4. Draw Grid Cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + (c * cellWidth) + (c * gapX);
        const y = offsetY + (r * cellHeight) + (r * gapY);

        const finalX = x + padding;
        const finalY = y + padding;
        const finalW = Math.max(1, cellWidth - (padding * 2));
        const finalH = Math.max(1, cellHeight - (padding * 2));

        if (!triggerSlice) {
            // Render Mode
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, cellWidth, cellHeight);
            
            // Cut Area (Green Box)
            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.strokeRect(finalX, finalY, finalW, finalH);
            ctx.fillStyle = 'rgba(57, 255, 20, 0.1)';
            ctx.fillRect(finalX, finalY, finalW, finalH);

        } else {
            // Slicing Mode
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = finalW;
            tempCanvas.height = finalH;
            const tempCtx = tempCanvas.getContext('2d');
            
            if (tempCtx) {
                tempCtx.drawImage(imgObj, finalX, finalY, finalW, finalH, 0, 0, finalW, finalH);
                slicesToExport.push({
                    id: `icon-${r}-${c}`,
                    url: tempCanvas.toDataURL('image/png'),
                    width: Math.floor(finalW),
                    height: Math.floor(finalH)
                });
            }
        }
      }
    }

    // 5. Draw Manipulation Handles
    if (!triggerSlice) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(offsetX, offsetY, gridW, gridH);

        const handleSize = 12 / scale; 
        ctx.fillStyle = '#ffff00';
        ctx.setLineDash([]);
        ctx.fillRect(
            offsetX + gridW - handleSize/2, 
            offsetY + gridH - handleSize/2, 
            handleSize, 
            handleSize
        );
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            offsetX + gridW - handleSize/2, 
            offsetY + gridH - handleSize/2, 
            handleSize, 
            handleSize
        );
    }

    if (triggerSlice && onSliceGenerated) {
        onSliceGenerated(slicesToExport);
        onSliceComplete();
    }

  }, [imgObj, config, triggerSlice, onSliceGenerated, onSliceComplete, scale]);


  // --- Helper: Map Screen Coordinates to Canvas Pixels ---
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    
    // The rect takes into account the transform(scale + translate) of parent
    // so clientX - rect.left is relative to visual top-left of canvas
    
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
  };

  // --- Interaction Handlers ---
  
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      // 1. Pan Mode (Spacebar held)
      if (isSpacePressed) {
          setIsPanning(true);
          setPanStart({ x: e.clientX, y: e.clientY });
          (e.target as Element).setPointerCapture(e.pointerId);
          return;
      }

      // 2. Grid Edit Mode
      if (!onConfigChange || !imgObj) return;
      
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const { offsetX, offsetY, lockAspectRatio, aspectRatio, cols, rows, gapX, gapY } = config;
      const gridW = config.gridWidth || imgObj.width;
      
      let gridH = config.gridHeight || imgObj.height;
      if (lockAspectRatio) {
          const cellWidth = (gridW - (Math.max(0, cols - 1) * gapX)) / cols;
          const cellHeight = cellWidth / (aspectRatio || 1);
          gridH = (cellHeight * rows) + (Math.max(0, rows - 1) * gapY);
      }

      const handleSize = 20 / scale; 

      if (
          x >= offsetX + gridW - handleSize && 
          x <= offsetX + gridW + handleSize &&
          y >= offsetY + gridH - handleSize &&
          y <= offsetY + gridH + handleSize
      ) {
          setIsResizingGrid(true);
          setDragStart({ x, y });
          setConfigStart(config);
          (e.target as Element).setPointerCapture(e.pointerId);
          return;
      }

      if (
          x >= offsetX && x <= offsetX + gridW &&
          y >= offsetY && y <= offsetY + gridH
      ) {
          setIsDraggingGrid(true);
          setDragStart({ x, y });
          setConfigStart(config);
          (e.target as Element).setPointerCapture(e.pointerId);
          return;
      }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Handle Panning
      if (isPanning && panStart) {
          const dx = e.clientX - panStart.x;
          const dy = e.clientY - panStart.y;
          setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
          setPanStart({ x: e.clientX, y: e.clientY });
          return;
      }

      const { x, y } = getCanvasCoords(e.clientX, e.clientY);

      // Handle Cursor Styles
      if (!isDraggingGrid && !isResizingGrid && !isPanning && imgObj) {
          if (isSpacePressed) {
              setCursorStyle('grab');
          } else {
              const { offsetX, offsetY, lockAspectRatio, aspectRatio, cols, rows, gapX, gapY } = config;
              const gridW = config.gridWidth || imgObj.width;
              let gridH = config.gridHeight || imgObj.height;
              
              if (lockAspectRatio) {
                const cellWidth = (gridW - (Math.max(0, cols - 1) * gapX)) / cols;
                const cellHeight = cellWidth / (aspectRatio || 1);
                gridH = (cellHeight * rows) + (Math.max(0, rows - 1) * gapY);
              }
              
              const handleSize = 20 / scale;
              
              if (
                  x >= offsetX + gridW - handleSize && x <= offsetX + gridW + handleSize &&
                  y >= offsetY + gridH - handleSize && y <= offsetY + gridH + handleSize
              ) {
                  setCursorStyle('nwse-resize');
              } else if (
                  x >= offsetX && x <= offsetX + gridW &&
                  y >= offsetY && y <= offsetY + gridH
              ) {
                  setCursorStyle('move');
              } else {
                  setCursorStyle('default');
              }
          }
      }

      // Handle Grid Manipulation
      if (!onConfigChange || !configStart || !dragStart) return;

      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      if (isDraggingGrid) {
          onConfigChange({
              ...configStart,
              offsetX: configStart.offsetX + dx,
              offsetY: configStart.offsetY + dy
          });
      } else if (isResizingGrid) {
          let newW = Math.max(10, configStart.gridWidth + dx);
          let newH = Math.max(10, configStart.gridHeight + dy);

          if (config.lockAspectRatio) {
              const { cols, rows, gapX, gapY, aspectRatio } = configStart;
              const cellWidth = (newW - (Math.max(0, cols - 1) * gapX)) / cols;
              const cellHeight = cellWidth / (aspectRatio || 1);
              newH = (cellHeight * rows) + (Math.max(0, rows - 1) * gapY);
          }

          onConfigChange({
              ...configStart,
              gridWidth: newW,
              gridHeight: newH
          });
      }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      setIsDraggingGrid(false);
      setIsResizingGrid(false);
      setIsPanning(false);
      setDragStart(null);
      setPanStart(null);
      setConfigStart(null);
      (e.target as Element).releasePointerCapture(e.pointerId);
  };


  if (!imageSrc) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-gray-950">
        <div className="text-gray-600 text-center">
            <p className="mb-2 text-lg">No image loaded</p>
            <p className="text-sm">Upload an image from the sidebar to begin.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
        ref={containerRef}
        className="flex-1 bg-[#101010] overflow-hidden flex items-center justify-center relative select-none"
        onWheel={handleWheel}
        style={{
            backgroundImage: 'conic-gradient(#1a1a1a 90deg, #151515 90deg 180deg, #1a1a1a 180deg 270deg, #151515 270deg)',
            backgroundSize: '20px 20px',
            cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default'
        }}
    >
        <div 
            style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, 
                transformOrigin: 'center center',
                transition: isPanning || isDraggingGrid || isResizingGrid ? 'none' : 'transform 0.1s linear', 
                boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
        >
            <canvas 
                ref={canvasRef} 
                className="block"
                style={{ cursor: cursorStyle }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp} 
            />
        </div>
        
        {/* Helper Text */}
        {isSpacePressed && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-xs text-white pointer-events-none">
                Hand Mode: Drag to Pan
            </div>
        )}

        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-6 right-6 flex gap-2 bg-gray-800 p-2 rounded-lg shadow-xl border border-gray-700 z-50">
            <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="w-8 h-8 flex items-center justify-center text-white hover:bg-gray-700 rounded">-</button>
            <span className="w-12 flex items-center justify-center text-xs text-gray-300">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(10, s + 0.1))} className="w-8 h-8 flex items-center justify-center text-white hover:bg-gray-700 rounded">+</button>
        </div>
    </div>
  );
};

export default CanvasPreview;