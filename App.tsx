import React, { useState, useCallback } from 'react';
import { GridConfig, AppState, SlicedIcon } from './types';
import ControlPanel from './components/ControlPanel';
import CanvasPreview from './components/CanvasPreview';
import SliceResults from './components/SliceResults';
import ImageUploader from './components/ImageUploader';
import { detectGridStructure } from './services/geminiService';
import { Image as ImageIcon } from 'lucide-react';

const INITIAL_CONFIG: GridConfig = {
  rows: 4,
  cols: 4,
  padding: 0,
  gapX: 0,
  gapY: 0,
  offsetX: 0,
  offsetY: 0,
  gridWidth: 0, // 0 implies full width initially
  gridHeight: 0, // 0 implies full height initially
  lockAspectRatio: false,
  aspectRatio: 1,
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [gridConfig, setGridConfig] = useState<GridConfig>(INITIAL_CONFIG);
  const [generatedSlices, setGeneratedSlices] = useState<SlicedIcon[]>([]);
  const [triggerSlice, setTriggerSlice] = useState(false);

  // Handle Image Upload
  const handleImageLoaded = useCallback((base64: string) => {
    setImageSrc(base64);
    setAppState(AppState.EDITING);
    // Reset config but keep the image loaded state logic for CanvasPreview to handle initialization
    setGridConfig(INITIAL_CONFIG);
  }, []);

  // Handle AI Auto Detect
  const handleAutoDetect = async () => {
    if (!imageSrc) return;
    
    setAppState(AppState.ANALYZING);
    try {
      const result = await detectGridStructure(imageSrc);
      setGridConfig(prev => ({
        ...prev,
        rows: result.rows,
        cols: result.cols,
        // AI doesn't detect gaps/offsets well usually, so we keep existing or reset? 
        // Let's keep existing dimensions if they are set, otherwise logic in Canvas will handle it
      }));
    } catch (error) {
      console.error("Auto detect failed", error);
    } finally {
      setAppState(AppState.EDITING);
    }
  };

  // Handle Slicing Process
  const handleSlice = () => {
    setAppState(AppState.SLICING);
    setTriggerSlice(true);
  };

  const handleSliceComplete = () => {
    setTriggerSlice(false);
    setAppState(AppState.DONE);
  };

  const handleReset = () => {
    setImageSrc(null);
    setAppState(AppState.IDLE);
    setGeneratedSlices([]);
  };

  const handleConfigChange = (newConfig: GridConfig) => {
      setGridConfig(newConfig);
  }

  return (
    <div className="flex h-screen bg-black text-gray-100 overflow-hidden">
      
      {/* Left Sidebar */}
      <ControlPanel 
        appState={appState}
        config={gridConfig}
        onConfigChange={handleConfigChange}
        onAutoDetect={handleAutoDetect}
        onSlice={handleSlice}
        onReset={handleReset}
        hasImage={!!imageSrc}
      />

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col">
        
        {/* Header/Toolbar Area */}
        {imageSrc && (
             <div className="absolute top-4 left-4 z-10 bg-gray-900/80 backdrop-blur px-4 py-2 rounded-lg border border-gray-700 shadow-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-300">Workspace</span>
                <span className="text-xs text-gray-500 ml-2">Drag grid to move • Drag corner to resize</span>
            </div>
        )}

        {/* Canvas */}
        <CanvasPreview 
            imageSrc={imageSrc}
            config={gridConfig}
            onConfigChange={handleConfigChange}
            onSliceGenerated={setGeneratedSlices}
            triggerSlice={triggerSlice}
            onSliceComplete={handleSliceComplete}
        />

        {/* Initial Uploader Overlay */}
        {!imageSrc && (
             <ImageUploader onImageLoaded={handleImageLoaded} />
        )}

        {/* Results Overlay */}
        {appState === AppState.DONE && (
            <SliceResults 
                slices={generatedSlices} 
                onBack={() => setAppState(AppState.EDITING)} 
            />
        )}
      </div>
    </div>
  );
};

export default App;