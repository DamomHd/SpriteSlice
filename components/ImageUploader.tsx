import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploaderProps {
  onImageLoaded: (base64: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onImageLoaded(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto">
         <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
         />
         <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-4 p-10 rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900/90 backdrop-blur hover:bg-gray-800 hover:border-blue-500 transition-all group"
         >
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-gray-400 group-hover:text-blue-400" />
            </div>
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-200">Upload Image</h3>
                <p className="text-sm text-gray-500 mt-1">Drag & drop or click to browse</p>
                <p className="text-xs text-gray-600 mt-2">Supports PNG, JPG, GIF</p>
            </div>
         </button>
      </div>
    </div>
  );
};

export default ImageUploader;
