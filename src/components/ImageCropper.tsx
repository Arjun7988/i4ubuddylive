import { useEffect, useRef, useState } from 'react';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { GradientButton } from './GradientButton';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.5);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      const canvas = canvasRef.current;
      if (canvas) {
        const size = Math.min(canvas.width, canvas.height);
        const calculatedMinZoom = size / Math.max(img.width, img.height);
        setMinZoom(calculatedMinZoom);
        setZoom(calculatedMinZoom * 1.1);
        setPosition({
          x: (canvas.width - img.width * calculatedMinZoom * 1.1) / 2,
          y: (canvas.height - img.height * calculatedMinZoom * 1.1) / 2,
        });
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.scale(zoom, zoom);
    ctx.drawImage(image, 0, 0);
    ctx.restore();

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 20;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }, [image, zoom, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const newZoom = Math.min(zoom * 1.1, minZoom * 5);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const imageRelX = (centerX - position.x) / zoom;
    const imageRelY = (centerY - position.y) / zoom;
    setZoom(newZoom);
    setPosition({
      x: centerX - imageRelX * newZoom,
      y: centerY - imageRelY * newZoom,
    });
  };

  const handleZoomOut = () => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const newZoom = Math.max(zoom / 1.1, minZoom);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const imageRelX = (centerX - position.x) / zoom;
    const imageRelY = (centerY - position.y) / zoom;
    setZoom(newZoom);
    setPosition({
      x: centerX - imageRelX * newZoom,
      y: centerY - imageRelY * newZoom,
    });
  };

  const handleCrop = async () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 20;

    const outputCanvas = document.createElement('canvas');
    const outputSize = 400;
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) return;

    outputCtx.beginPath();
    outputCtx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    outputCtx.clip();

    const sourceX = (centerX - radius - position.x) / zoom;
    const sourceY = (centerY - radius - position.y) / zoom;
    const sourceSize = (radius * 2) / zoom;

    outputCtx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize
    );

    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      },
      'image/jpeg',
      0.95
    );
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-xl font-bold text-white">Crop Profile Picture</h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="rounded-lg cursor-move touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-5 h-5 text-white" />
            </button>
            <div className="w-24 h-1 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-400 transition-all"
                style={{ width: `${((zoom - minZoom) / (minZoom * 4)) * 100}%` }}
              />
            </div>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10">
        <p className="text-center text-gray-400 text-sm mb-4">
          Drag to reposition • Use zoom controls to adjust size
        </p>
        <div className="flex gap-3 max-w-md mx-auto">
          <GradientButton
            onClick={onCancel}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </GradientButton>
          <GradientButton
            onClick={handleCrop}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Apply
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
