import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ src, alt, isOpen, onClose }) => {
  if (!isOpen || !src) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Image preview: ${alt}`} onClick={(event) => { event.stopPropagation(); onClose(); }}>
      <button type="button" onClick={onClose} className="absolute top-4 right-4 z-10 rounded-full bg-white/15 text-white p-3 hover:bg-white/25" aria-label="Close image preview"><X size={24} /></button>
      <div className="w-full max-w-3xl flex flex-col items-center gap-3" onClick={event => event.stopPropagation()}>
        <div className="w-full h-[72vh] flex items-center justify-center rounded-xl overflow-hidden">
          <img src={src} alt={alt} className="max-w-full max-h-full object-contain" />
        </div>
        <div className="flex items-center gap-2 text-white/80 text-xs"><ZoomIn size={14} /><span>{alt}</span></div>
        <p className="text-white/60 text-[11px]">Tap outside the image or close button to return</p>
      </div>
    </div>
  );
};
