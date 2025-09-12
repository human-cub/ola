import { useEffect, useRef } from 'react';

interface AnimatedQRProps {
  src: string;
  alt: string;
  className?: string;
}

export const AnimatedQR = ({ src, alt, className = "" }: AnimatedQRProps) => {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleImageLoad = () => {
      // Попробуем найти SVG элементы для анимации после загрузки
      const container = img.closest('.qr-with-pulse');
      if (!container) return;

      // Добавляем стили для анимации через JavaScript
      const style = document.createElement('style');
      style.textContent = `
        .qr-animated-logo {
          animation: qr-logo-pulse 2s ease-in-out infinite !important;
          transform-origin: center !important;
        }
      `;
      document.head.appendChild(style);

      // Пытаемся найти и анимировать центральные элементы
      setTimeout(() => {
        const svgElements = container.querySelectorAll('svg *[cx="150"], svg *[cy="150"], svg image, svg circle[r="20"]');
        svgElements.forEach(el => {
          (el as HTMLElement).classList.add('qr-animated-logo');
        });
      }, 100);
    };

    img.addEventListener('load', handleImageLoad);
    if (img.complete) handleImageLoad();

    return () => {
      img.removeEventListener('load', handleImageLoad);
    };
  }, [src]);

  return (
    <img 
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
    />
  );
};