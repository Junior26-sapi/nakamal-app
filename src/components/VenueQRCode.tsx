import { useRef, useEffect, useState } from 'react';
import { QRCodeRenderersOptions, toCanvas } from 'qrcode';
import { Download, Copy, Check, ExternalLink, QrCode, Palette, Printer, Sparkles } from 'lucide-react';

interface VenueQRCodeProps {
  venueId: string;
  venueName: string;
  className?: string;
}

export default function VenueQRCode({ venueId, venueName, className = "" }: VenueQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrStyle, setQrStyle] = useState<'classic' | 'kava' | 'holographic'>('kava');
  const [includeCenterBadge, setIncludeCenterBadge] = useState(true);

  // Construct the deep link URL
  const deepLinkUrl = `${window.location.origin}${window.location.pathname}?venue=${venueId}`;

  useEffect(() => {
    if (!canvasRef.current || !deepLinkUrl) return;

    // Define color configurations
    let darkColor = '#3b2a1f'; // Default kava brown
    let lightColor = '#ffffff';

    if (qrStyle === 'kava') {
      darkColor = '#e6a017'; // Gold
      lightColor = '#f7ede0'; // Light kava wheat background
    } else if (qrStyle === 'holographic') {
      darkColor = '#1a1614'; // Dark theme kava
      lightColor = '#f5b22b'; // Gold background for high contrast inverted
    }

    const options: QRCodeRenderersOptions = {
      width: 256,
      margin: 1.5,
      errorCorrectionLevel: 'H', // High error correction level, crucial for center badge overlay
      color: {
        dark: darkColor,
        light: lightColor
      }
    };

    toCanvas(canvasRef.current, deepLinkUrl, options, (error) => {
      if (error) {
        console.error('Error generating QR code:', error);
        return;
      }

      // Add custom center badge if selected
      if (includeCenterBadge && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const size = canvas.width;
          const badgeSize = size * 0.22; // 22% of total size
          const x = (size - badgeSize) / 2;
          const y = (size - badgeSize) / 2;

          // Draw Rounded Background for Badge
          ctx.beginPath();
          ctx.fillStyle = qrStyle === 'holographic' ? '#1a1614' : '#ffffff';
          // Draw rounded rectangle
          const radius = badgeSize * 0.25;
          ctx.roundRect(x, y, badgeSize, badgeSize, radius);
          ctx.fill();

          // Border for Badge
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = qrStyle === 'kava' ? '#e6a017' : qrStyle === 'holographic' ? '#f5b22b' : '#3b2a1f';
          ctx.stroke();

          // Draw Stylized Kava Bowl Icon (🌿 or similar emoji / initials)
          ctx.fillStyle = qrStyle === 'kava' ? '#a57c5c' : '#e6a017';
          ctx.font = `bold ${badgeSize * 0.5}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🌿', size / 2, size / 2);
        }
      }
    });

  }, [deepLinkUrl, qrStyle, includeCenterBadge]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(deepLinkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${venueName.toLowerCase().replace(/\s+/g, '-')}-deep-link-qr.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const printQR = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const windowContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print QR Code - ${venueName}</title>
        <style>
          body {
            font-family: 'Inter', sans-serif;
            text-align: center;
            background: #ffffff;
            color: #3b2a1f;
            padding: 40px;
          }
          .card {
            max-width: 400px;
            margin: 0 auto;
            border: 2px solid #e6a017;
            border-radius: 30px;
            padding: 30px;
            box-shadow: 0 10px 25px rgba(59, 42, 31, 0.08);
          }
          h1 {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 34px;
            letter-spacing: 1.5px;
            margin-bottom: 5px;
            color: #3b2a1f;
            text-transform: uppercase;
          }
          p.subtitle {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #6b4e2e;
            margin-bottom: 30px;
          }
          img.qr {
            width: 250px;
            height: 250px;
            border-radius: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          }
          p.scan {
            font-size: 12px;
            font-weight: 600;
            color: #a57c5c;
            margin-top: 25px;
            letter-spacing: 1px;
          }
          .footer {
            font-size: 9px;
            opacity: 0.5;
            margin-top: 40px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${venueName}</h1>
          <p class="subtitle">Official Public Venue Node</p>
          <img class="qr" src="${dataUrl}" />
          <p class="scan">SCAN TO DISCOVER ONLINE MENU & BOOKING</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(windowContent);
      printWindow.document.close();
    }
  };

  return (
    <div className={`kava-card bg-gradient-to-br from-white/70 to-white/40 dark:from-black/40 dark:to-black/20 border border-white/60 dark:border-white/5 shadow-layered p-6 relative overflow-hidden flex flex-col items-center ${className}`}>
      
      {/* Decorative ambient blobs */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-kava-gold/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-kava-muted/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header Info */}
      <div className="w-full text-center space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-kava-gold/10 text-kava-gold rounded-full">
          <QrCode size={14} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">QR Distribution Hub</span>
        </div>
        <h4 className="font-bebas text-3xl text-kava-text tracking-wide uppercase">Venue Scan Code</h4>
        <p className="text-[10px] text-kava-muted leading-relaxed max-w-xs mx-auto">
          Generate physical badges for your staff uniforms, menus, or tables. Allows customers to instantly expand your digital presence!
        </p>
      </div>

      {/* Interactive Visual Canvas Container */}
      <div className="relative group p-4 bg-white/50 dark:bg-black/25 rounded-[36px] border border-white dark:border-white/5 shadow-inner transition-all flex items-center justify-center mb-6">
        <canvas 
          ref={canvasRef} 
          className="rounded-[24px] shadow-lg max-w-[220px] max-h-[220px] sm:max-w-[256px] sm:max-h-[256px] duration-500 hover:scale-103 cursor-pointer" 
          onClick={downloadQR}
          title="Click to download high-res PNG"
        />
        
        {/* Sparkle decorative effect */}
        <div className="absolute top-2 right-2 p-1 bg-white/80 dark:bg-black/80 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Sparkles className="text-kava-gold" size={12} />
        </div>
      </div>

      {/* Customizer Controls */}
      <div className="w-full space-y-4 bg-white/20 dark:bg-black/10 py-4 px-5 rounded-3xl border border-white/40 dark:border-white/5 mb-6">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-kava-muted/80 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Palette size={13} className="text-kava-gold" /> Style Profile
          </span>
          <div className="flex gap-1.5 bg-white/40 dark:bg-black/20 p-1 rounded-full border border-white">
            {(['classic', 'kava', 'holographic'] as const).map((style) => (
              <button
                key={style}
                onClick={() => setQrStyle(style)}
                className={`text-[9px] font-extrabold uppercase py-1 px-2.5 rounded-full transition-all ${
                  qrStyle === style 
                    ? 'bg-kava-gold text-white shadow-sm' 
                    : 'text-kava-muted hover:text-kava-gold/80'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-kava-gold/10">
          <span className="font-bold text-kava-muted/80 uppercase tracking-wider text-[10px]">
             🌿 Center Totem
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={includeCenterBadge}
              onChange={(e) => setIncludeCenterBadge(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-9 h-5 bg-kava-muted/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-kava-gold"></div>
          </label>
        </div>
      </div>

      {/* Share / Copy / Print Options */}
      <div className="w-full grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={downloadQR}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-kava-gold text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-layered hover:opacity-90 active:scale-95 transition-all text-center"
        >
          <Download size={14} /> Download
        </button>

        <button
          onClick={printQR}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-neutral-50 dark:bg-neutral-900/30 dark:hover:bg-neutral-900/50 text-kava-text font-bold text-xs uppercase tracking-widest rounded-2xl border border-white/80 dark:border-white/10 active:scale-95 transition-all text-center"
        >
          <Printer size={14} /> Print Badge
        </button>
      </div>

      <button
        onClick={copyLink}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/50 hover:bg-white/80 dark:bg-neutral-950/25 dark:hover:bg-neutral-950/45 text-kava-muted font-bold text-xs uppercase tracking-widest rounded-2xl border border-white dark:border-white/5 active:scale-98 transition-all"
      >
        {copied ? (
          <>
            <Check size={14} className="text-emerald-500" /> Copied Node URL
          </>
        ) : (
          <>
            <Copy size={14} /> Copy Direct Deep-Link
          </>
        )}
      </button>

      {/* Raw Link Output Preview */}
      <p className="w-full text-[9px] font-mono text-kava-muted opacity-45 leading-none mt-4 text-center select-all truncate">
        {deepLinkUrl}
      </p>
    </div>
  );
}
