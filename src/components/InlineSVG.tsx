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
                (el as SVGElement).style.animation = 'qr-logo-pulse 2s ease-in-out infinite';
                (el as SVGElement).style.transformOrigin = 'center';
                (el as SVGElement).style.transformBox = 'fill-box';
              });
              
              // Пробуем также найти image элементы
              const imageElements = svg.querySelectorAll('image');
              imageElements.forEach(el => {
                (el as SVGElement).style.animation = 'qr-logo-pulse 2s ease-in-out infinite';
                (el as SVGElement).style.transformOrigin = 'center';
                (el as SVGElement).style.transformBox = 'fill-box';
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