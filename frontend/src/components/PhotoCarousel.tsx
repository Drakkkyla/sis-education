import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PhotoCarouselProps {
  photos: string[];
  onClose?: () => void;
}

const PhotoCarousel = ({ photos, onClose }: PhotoCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (photos.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* Main Image */}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group">
        <img
          src={`${API_URL}${photos[currentIndex]}`}
          alt={`Фото ${currentIndex + 1}`}
          className="w-full h-full object-contain"
          onClick={() => setIsFullscreen(true)}
        />

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Следующее фото"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Close button (if onClose provided) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Image Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <img
                src={`${API_URL}${photo}`}
                alt={`Миниатюра ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              aria-label="Закрыть"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={`${API_URL}${photos[currentIndex]}`}
              alt={`Фото ${currentIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                  aria-label="Следующее фото"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 text-white text-lg rounded-full">
                  {currentIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoCarousel;

