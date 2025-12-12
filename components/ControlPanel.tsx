import React from 'react';
import { GridConfig, AppState } from '../types';
import { RefreshCw, Grid, Scissors, Upload, Lock, Unlock, Move, Maximize } from 'lucide-react';

interface ControlPanelProps {
  appState: AppState;
  config: GridConfig;
  onConfigChange: (newConfig: GridConfig) => void;
  onAutoDetect: () => void;
  onSlice: () => void;
  onReset: () => void;
  hasImage: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  appState,
  config,
  onConfigChange,
  onAutoDetect,
  onSlice,
  onReset,
  hasImage
}) => {
  const handleChange = (key: keyof GridConfig, value: number | boolean) => {
    onConfigChange({ ...config, [key]: value });
  };

  const isAnalyzing = appState === AppState.ANALYZING;

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-full shadow-xl z-10">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
          <Grid className="w-6 h-6 text-blue-500" />
          IconSlicer AI
        </h1>
        <p className="text-xs text-gray-500 mt-1">Smart sprite sheet extractor</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {!hasImage ? (
          <div className="text-center text-gray-500 mt-10">
            <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Upload an image to start</p>
          </div>
        ) : (
          <>
            {/* AI Section */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Assistance</label>
              <button
                onClick={onAutoDetect}
                disabled={isAnalyzing}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                  isAnalyzing
                    ? 'bg-gray-800 text-gray-400 cursor-wait'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50'
                }`}
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isAnalyzing ? 'Analyzing Layout...' : 'Auto-Detect Grid'}
              </button>
            </div>

            {/* Grid Layout */}
            <div className="space-y-4">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Grid Matrix</label>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rows</label>
                  <input
                    type="number"
                    min="1"
                    value={config.rows}
                    onChange={(e) => handleChange('rows', parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Columns</label>
                  <input
                    type="number"
                    min="1"
                    value={config.cols}
                    onChange={(e) => handleChange('cols', parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
            
            {/* Dimensions & Position */}
            <div className="space-y-4">
               <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dimensions & Position</label>
                
               <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Move className="w-3 h-3"/> Offset X</label>
                        <input
                            type="number"
                            value={Math.round(config.offsetX)}
                            onChange={(e) => handleChange('offsetX', parseInt(e.target.value) || 0)}
                             className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Move className="w-3 h-3"/> Offset Y</label>
                        <input
                            type="number"
                            value={Math.round(config.offsetY)}
                            onChange={(e) => handleChange('offsetY', parseInt(e.target.value) || 0)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                     <div>
                        <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Maximize className="w-3 h-3"/> Width</label>
                        <input
                            type="number"
                            value={Math.round(config.gridWidth)}
                            onChange={(e) => handleChange('gridWidth', parseInt(e.target.value) || 0)}
                             className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Maximize className="w-3 h-3"/> Height</label>
                        <input
                            type="number"
                            value={Math.round(config.gridHeight)}
                            onChange={(e) => handleChange('gridHeight', parseInt(e.target.value) || 0)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
               </div>
            </div>

            {/* Cell Constraint */}
            <div className="space-y-4 pt-2 border-t border-gray-800">
               <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      {config.lockAspectRatio ? <Lock className="w-3 h-3 text-blue-400"/> : <Unlock className="w-3 h-3 text-gray-600"/>}
                      Cell Aspect Ratio
                    </span>
                  </label>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input 
                        type="checkbox" 
                        name="toggle" 
                        id="toggle" 
                        checked={config.lockAspectRatio}
                        onChange={(e) => handleChange('lockAspectRatio', e.target.checked)}
                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-blue-600 right-5"
                    />
                    <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${config.lockAspectRatio ? 'bg-blue-600' : 'bg-gray-700'}`}></label>
                  </div>
               </div>

               {config.lockAspectRatio && (
                 <div className="bg-gray-800/50 p-3 rounded-lg space-y-2 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Ratio (W / H)</span>
                        <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.aspectRatio}
                            onChange={(e) => handleChange('aspectRatio', parseFloat(e.target.value) || 1)}
                            className="w-20 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white text-right focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                         <button 
                            onClick={() => handleChange('aspectRatio', 1)}
                            className={`text-[10px] px-2 py-1 rounded border ${config.aspectRatio === 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-400 hover:text-white'}`}
                         >
                            1:1 (Square)
                         </button>
                          <button 
                            onClick={() => handleChange('aspectRatio', 16/9)}
                            className={`text-[10px] px-2 py-1 rounded border ${Math.abs(config.aspectRatio - 1.77) < 0.01 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-400 hover:text-white'}`}
                         >
                            16:9
                         </button>
                    </div>
                 </div>
               )}
            </div>

            {/* Fine Tuning */}
            <div className="space-y-4 border-t border-gray-800 pt-4">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fine Tuning</label>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-gray-500">Padding (Inset)</label>
                    <span className="text-xs text-blue-400">{config.padding}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={config.padding}
                    onChange={(e) => handleChange('padding', parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                   <div className="flex justify-between mb-1">
                    <label className="text-xs text-gray-500">Gap X</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="-50"
                        max="100"
                        value={config.gapX}
                        onChange={(e) => handleChange('gapX', parseInt(e.target.value))}
                        className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <input 
                        type="number" 
                        value={config.gapX}
                        onChange={(e) => handleChange('gapX', parseInt(e.target.value) || 0)}
                        className="w-12 bg-gray-800 border border-gray-700 rounded px-1 text-xs text-white text-center focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                 <div>
                   <div className="flex justify-between mb-1">
                    <label className="text-xs text-gray-500">Gap Y</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="-50"
                        max="100"
                        value={config.gapY}
                        onChange={(e) => handleChange('gapY', parseInt(e.target.value))}
                        className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <input 
                        type="number" 
                        value={config.gapY}
                        onChange={(e) => handleChange('gapY', parseInt(e.target.value) || 0)}
                        className="w-12 bg-gray-800 border border-gray-700 rounded px-1 text-xs text-white text-center focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-6 border-t border-gray-800 bg-gray-900">
        {hasImage ? (
           <div className="flex flex-col gap-3">
            <button
                onClick={onSlice}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-900/50 transition-all active:scale-95"
            >
                <Scissors className="w-5 h-5" />
                Slice Images
            </button>
             <button
                onClick={onReset}
                className="w-full py-2 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
            >
                Reset Image
            </button>
           </div>
        ) : (
            <div className="text-xs text-gray-600 text-center">
                v1.0.0 &copy; 2024
            </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;