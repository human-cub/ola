import { useEffect, useRef, useState } from 'react';

interface InlineSVGProps {
  src: string;
  className?: string;
  alt?: string;
}

export const InlineSVG = ({ src, className = "", alt = "" }: InlineSVGProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSVG = async () => {
      try {
        const response = await fetch(src);
        const svgText = await response.text();
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svgText;
          
          // Применяем анимацию к логотипу после загрузки
          setTimeout(() => {
            const svg = containerRef.current?.querySelector('svg');
            if (svg) {
              // Ищем элементы логотипа (цветные пути в центре)
              const logoElements = svg.querySelectorAll('path[fill*="#"], circle[fill*="#"], g[transform*="150"]');
              logoElements.forEach(el => {
                const element = el as SVGElement;
                element.style.animation = 'qr-logo-pulse 2s ease-in-out infinite';
                element.style.webkitAnimation = 'qr-logo-pulse 2s ease-in-out infinite';
                element.style.transformOrigin = 'center center';
                element.style.webkitTransformOrigin = 'center center';
                // Убираем transform-box для лучшей совместимости с мобильными
                element.style.transform = 'scale(0.9)';
                element.style.webkitTransform = 'scale(0.9)';
              });
              
              // Пробуем также найти image элементы
              const imageElements = svg.querySelectorAll('image');
              imageElements.forEach(el => {
                const element = el as SVGElement;
                element.style.animation = 'qr-logo-pulse 2s ease-in-out infinite';
                element.style.webkitAnimation = 'qr-logo-pulse 2s ease-in-out infinite';
                element.style.transformOrigin = 'center center';
                element.style.webkitTransformOrigin = 'center center';
                element.style.transform = 'scale(0.9)';
                element.style.webkitTransform = 'scale(0.9)';
              });
            }
            setIsLoaded(true);
          }, 100);
        }
      } catch (error) {
        console.error('Error loading SVG:', error);
      }
    };

    loadSVG();
  }, [src]);

  return (
    <div 
      ref={containerRef}
      className={className}
      role="img"
      aria-label={alt}
    />
  );
};