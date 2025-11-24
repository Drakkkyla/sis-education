import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { cn } from '../utils/cn';

interface PreloaderProps {
  isLoading?: boolean;
  message?: string;
}

const Preloader = ({ isLoading = true, message }: PreloaderProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isLoading && !mounted) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-opacity duration-500',
        isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl blur-2xl opacity-50 animate-pulse" />
          <div className="relative p-6 bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl shadow-2xl transform transition-transform hover:scale-110">
            <GraduationCap className="h-16 w-16 text-white animate-bounce" />
          </div>
        </div>

        {/* Loading spinner */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" />
        </div>

        {/* Loading text */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {message || 'Загрузка...'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Кванториум система доп образования
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-primary-600 via-blue-600 to-primary-600 rounded-full animate-progress" />
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% {
            width: 0%;
            transform: translateX(0);
          }
          50% {
            width: 70%;
            transform: translateX(0);
          }
          100% {
            width: 100%;
            transform: translateX(0);
          }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
          background-size: 200% 100%;
          background-position: 100% 0;
        }
      `}</style>
    </div>
  );
};

export default Preloader;

