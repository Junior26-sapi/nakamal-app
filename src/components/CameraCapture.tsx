import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            setIsReady(true);
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please ensure permissions are granted.");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-2xl bg-kava-surface rounded-[40px] overflow-hidden border border-white/10 shadow-3xl"
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-kava-gold/20 rounded-xl text-kava-gold">
              <Camera size={20} />
            </div>
            <h3 className="font-bebas text-3xl text-kava-text tracking-wider uppercase">Visual Capture</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-kava-muted transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center">
          {error ? (
            <div className="text-center p-8 space-y-4">
              <AlertCircle size={48} className="text-rose-500 mx-auto" />
              <p className="text-kava-text font-medium">{error}</p>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-white/10 rounded-2xl text-kava-text font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                Go Back
              </button>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
              />
              {capturedImage && (
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              )}
              {!isReady && !capturedImage && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw size={40} className="text-kava-gold animate-spin" />
                  <p className="text-[10px] font-black text-kava-gold uppercase tracking-[0.3em]">Initializing Lens...</p>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-8 bg-white/5 flex justify-center gap-6">
          <AnimatePresence mode="wait">
            {!capturedImage ? (
              <motion.button
                key="capture"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={takePhoto}
                disabled={!isReady}
                className="w-20 h-20 rounded-full border-4 border-white/20 p-1 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-kava-bg group-hover:bg-kava-gold group-hover:text-white transition-colors">
                  <Camera size={32} />
                </div>
              </motion.button>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-6"
              >
                <button
                  onClick={handleRetake}
                  className="px-8 py-4 bg-white/10 text-kava-text rounded-2xl font-bebas text-2xl tracking-widest hover:bg-white/20 transition-all flex items-center gap-3"
                >
                  <RefreshCw size={20} />
                  Retake
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-12 py-4 bg-kava-gold text-white rounded-2xl font-bebas text-2xl tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-kava-gold/20 flex items-center gap-3"
                >
                  <Check size={24} />
                  Use Photo
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
