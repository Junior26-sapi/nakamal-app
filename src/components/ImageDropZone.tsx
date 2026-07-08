import React from 'react';
import { Camera, Upload, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CameraCapture from './CameraCapture';

interface ImageDropZoneProps {
  imageUrl: string | null;
  onImageChange: (imageUrl: string) => void;
  onImageRemove: () => void;
  label: string;
  id: string;
  className?: string;
}

export default function ImageDropZone({ 
  imageUrl, 
  onImageChange, 
  onImageRemove, 
  label, 
  id, 
  className = "" 
}: ImageDropZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [showCamera, setShowCamera] = React.useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      className={`relative rounded-3xl border-2 transition-all duration-300 overflow-hidden min-h-[160px] ${
        isDragging 
          ? "border-kava-gold bg-kava-gold/10 scale-[0.98]" 
          : imageUrl 
            ? "border-white/20 shadow-lg" 
            : "border-dashed border-kava-text/10 hover:border-kava-gold/50 hover:bg-kava-gold/5"
      } ${className}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {imageUrl ? (
        <div className="w-full h-full min-h-[160px] group/preview">
          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover animate-in fade-in zoom-in duration-500" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button 
              type="button"
              onClick={() => setShowCamera(true)}
              className="p-4 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-kava-gold hover:text-white transition-all transform hover:scale-110"
              title="Retake Photo"
            >
              <Camera size={24} />
            </button>
            <label htmlFor={id} className="p-4 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 cursor-pointer transition-all transform hover:scale-110">
              <Upload size={24} />
            </label>
            <button 
              type="button"
              onClick={onImageRemove}
              className="p-4 bg-rose-500/20 backdrop-blur-md rounded-2xl text-rose-500 hover:bg-rose-500/40 transition-all transform hover:scale-110"
            >
              <Trash2 size={24} />
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center p-4 text-center">
          <div className="flex flex-col items-center space-y-4">
             <label htmlFor={id} className="cursor-pointer group/upload">
              <motion.div
                animate={isDragging ? { y: -5, scale: 1.1 } : { y: 0, scale: 1 }}
                className="flex flex-col items-center"
              >
                <div className={`p-4 rounded-2xl mb-2 transition-colors ${isDragging ? "bg-kava-gold/20 text-kava-gold" : "bg-kava-text/5 text-kava-muted/30 group-hover/upload:bg-kava-text/10"}`}>
                  <Upload size={24} />
                </div>
                <span className="text-[10px] font-black text-kava-muted/40 uppercase tracking-widest leading-relaxed group-hover/upload:text-kava-text transition-colors">
                  {isDragging ? "Release to upload" : label}
                </span>
              </motion.div>
            </label>

            <div className="flex items-center gap-4 w-full px-12 opacity-20">
              <div className="h-[1px] flex-1 bg-kava-text" />
              <span className="text-[8px] font-black text-kava-text uppercase tracking-widest">or</span>
              <div className="h-[1px] flex-1 bg-kava-text" />
            </div>

            <button 
              type="button"
              onClick={() => setShowCamera(true)}
              className="flex items-center gap-3 px-6 py-3 bg-kava-gold/10 text-kava-gold rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-kava-gold hover:text-white transition-all shadow-xl shadow-kava-gold/5 active:scale-95"
            >
              <Camera size={14} />
              Instant Capture
            </button>
          </div>
          
          <span className="text-[8px] font-bold text-kava-muted/20 uppercase mt-4 tracking-widest">PNG, JPG up to 5MB</span>
        </div>
      )}
      
      <input 
        type="file"
        id={id}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <AnimatePresence>
        {showCamera && (
          <CameraCapture 
            onCapture={onImageChange} 
            onClose={() => setShowCamera(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
