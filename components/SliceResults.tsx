import React, { useState } from 'react';
import { SlicedIcon } from '../types';
import { X, Download, ArrowLeft, Check, Square, CheckSquare, Loader2 } from 'lucide-react';
import JSZip from 'jszip';

interface SliceResultsProps {
  slices: SlicedIcon[];
  onBack: () => void;
}

const SliceResults: React.FC<SliceResultsProps> = ({ slices, onBack }) => {
  // Initialize with all selected by default for convenience
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(slices.map(s => s.id)));
  const [isZipping, setIsZipping] = useState(false);

  // Single file download
  const handleDownload = (e: React.MouseEvent, slice: SlicedIcon) => {
    e.stopPropagation(); // Prevent selection toggle
    const link = document.createElement('a');
    link.href = slice.url;
    link.download = `${slice.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle selection for a single item
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedIds.size === slices.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(slices.map(s => s.id)));
    }
  };

  // Batch download using JSZip
  const handleBatchDownload = async () => {
    if (selectedIds.size === 0) return;
    
    setIsZipping(true);
    try {
        const zip = new JSZip();
        let count = 0;

        slices.forEach(slice => {
            if (selectedIds.has(slice.id)) {
                // Remove data:image/png;base64, prefix
                const data = slice.url.split(',')[1];
                zip.file(`${slice.id}.png`, data, {base64: true});
                count++;
            }
        });

        if (count > 0) {
            const content = await zip.generateAsync({type: "blob"});
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `icons_batch_${new Date().toISOString().slice(0,10)}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error("Failed to zip files", error);
        alert("Failed to create zip file.");
    } finally {
        setIsZipping(false);
    }
  };

  const isAllSelected = slices.length > 0 && selectedIds.size === slices.length;

  return (
    <div className="flex-1 bg-gray-900 flex flex-col h-full absolute top-0 left-0 w-full z-20">
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-300"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
                <h2 className="text-lg font-bold text-white">Generation Complete</h2>
                <p className="text-sm text-gray-400">{slices.length} assets generated</p>
            </div>
        </div>

        <div className="flex items-center gap-4">
             {/* Select All Toggle */}
            <button 
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
                {isAllSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-400" />
                ) : (
                    <Square className="w-5 h-5 text-gray-500" />
                )}
                Select All
            </button>

            {/* Batch Download Button */}
            <button
                onClick={handleBatchDownload}
                disabled={selectedIds.size === 0 || isZipping}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedIds.size > 0 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50' 
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
            >
                {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isZipping ? 'Zipping...' : `Download Selected (${selectedIds.size})`}
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {slices.map((slice) => {
            const isSelected = selectedIds.has(slice.id);
            return (
                <div 
                    key={slice.id} 
                    onClick={() => toggleSelection(slice.id)}
                    className={`relative rounded-lg overflow-hidden cursor-pointer group transition-all duration-200 border-2 ${
                        isSelected 
                            ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.3)] bg-gray-800' 
                            : 'border-gray-700 hover:border-gray-500 bg-gray-800'
                    }`}
                >
                  <div className="aspect-square bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-gray-700/50 flex items-center justify-center p-4 relative">
                    <img 
                        src={slice.url} 
                        alt={slice.id} 
                        className="max-w-full max-h-full object-contain pixelated transition-transform duration-200 group-hover:scale-105" 
                        style={{imageRendering: 'pixelated'}}
                    />
                    
                    {/* Hover Download Button (Single) */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                        <button
                            onClick={(e) => handleDownload(e, slice)}
                            className="bg-white text-gray-900 p-2 rounded-full hover:scale-110 transition-transform shadow-lg"
                            title="Download Single Icon"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Selection Checkbox Indicator */}
                    <div className="absolute top-2 right-2 z-20">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isSelected ? 'bg-blue-500 border-blue-500' : 'bg-gray-900/50 border-gray-500 group-hover:border-white'
                        }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                    </div>
                  </div>
                  
                  <div className="p-2 bg-gray-900/90 text-center border-t border-gray-800">
                     <p className={`text-xs font-mono truncate transition-colors ${isSelected ? 'text-blue-400 font-semibold' : 'text-gray-400'}`}>
                        {slice.width}x{slice.height}
                     </p>
                  </div>
                </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SliceResults;