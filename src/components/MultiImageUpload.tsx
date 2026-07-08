import React, { useState } from 'react';
import { Upload, X, Camera, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CameraCapture from './CameraCapture';

interface MultiImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  label: string;
  id: string;
}

export default function MultiImageUpload({ images, onImagesChange, label, id }: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

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
    
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files) as File[];
      processFiles(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      processFiles(files);
    }
    e.target.value = '';
  };

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImagesChange([...images, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    onImagesChange(updated);
  };

  return (
    <div className="space-y-4">
      <div 
        className={`relative rounded-[32px] border-2 border-dashed transition-all duration-300 min-h-[120px] flex items-center justify-center p-6 ${
          isDragging 
            ? "border-kava-gold bg-kava-gold/10 scale-[0.99]" 
            : "border-kava-text/10 hover:border-kava-gold/50 hover:bg-kava-gold/5"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-4">
          <label htmlFor={id} className="cursor-pointer group/upload text-center">
            <motion.div
              animate={isDragging ? { y: -5, scale: 1.1 } : { y: 0, scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className={`p-4 rounded-2xl mb-2 transition-colors ${isDragging ? "bg-kava-gold/20 text-kava-gold" : "bg-kava-text/5 text-kava-muted/30 group-hover/upload:bg-kava-text/10"}`}>
                <Upload size={24} />
              </div>
              <span className="text-[10px] font-black text-kava-muted/40 uppercase tracking-widest leading-relaxed group-hover/upload:text-kava-text transition-colors">
                {isDragging ? "Release to upload gallery" : label}
              </span>
            </motion.div>
          </label>
          
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => setShowCamera(true)}
              className="flex items-center gap-2 px-4 py-2 bg-kava-gold/10 text-kava-gold rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-kava-gold hover:text-white transition-all"
            >
              <Camera size={12} />
              Add via Camera
            </button>
            <label htmlFor={id} className="flex items-center gap-2 px-4 py-2 bg-kava-text/5 text-kava-text rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-kava-text hover:text-white cursor-pointer transition-all">
              <Plus size={12} />
              Select Files
            </label>
          </div>
        </div>
        
        <input 
          type="file"
          id={id}
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <AnimatePresence>
          {images.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-white shadow-sm"
            >
              <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <Trash2 size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCamera && (
          <CameraCapture 
            onCapture={(img) => {
              onImagesChange([...images, img]);
              setShowCamera(false);
            }} 
            onClose={() => setShowCamera(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
