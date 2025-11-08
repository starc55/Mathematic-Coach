import React, { useRef } from 'react';
import { UploadIcon } from './Icons';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  disabled: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        disabled={disabled}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className="inline-flex items-center justify-center px-6 py-3 border border-slate-200/20 text-base font-medium rounded-full shadow-sm text-slate-200 bg-slate-200/10 hover:bg-slate-200/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <UploadIcon className="w-5 h-5 mr-2 -ml-1" />
        Upload Photo
      </button>
    </div>
  );
};