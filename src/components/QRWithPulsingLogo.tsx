import { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import olaWaveLogo from '@/assets/ola-wave-logo.png';

interface QRWithPulsingLogoProps {
  url: string;
  size?: number;
  className?: string;
}

export const QRWithPulsingLogo = ({ url, size = 120, className = "" }: QRWithPulsingLogoProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!qrCode.current) {
      qrCode.current = new QRCodeStyling({
        width: size,
        height: size,
        type: "svg",
        data: url,
        image: olaWaveLogo,
        dotsOptions: {
          color: "#000000",
          type: "square"
        },
        cornersSquareOptions: {
          color: "#000000",
          type: "square"
        },
        cornersDotOptions: {
          color: "#000000",
          type: "square"
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 10,
          imageSize: 0.3,
          hideBackgroundDots: true,
          saveAsBlob: true
        },
        qrOptions: {
          typeNumber: 0,
          mode: "Byte",
          errorCorrectionLevel: "H"
        }
      });
    }

    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCode.current.append(qrRef.current);
      
      // Add pulsing animation to the logo after QR is rendered
      setTimeout(() => {
        const logoElement = qrRef.current?.querySelector('image');
        if (logoElement) {
          logoElement.style.transformBox = 'fill-box';
          logoElement.style.transformOrigin = '50% 50%';
          logoElement.style.animation = 'qr-logo-pulse 2s ease-in-out infinite';
        }
      }, 100);
    }
  }, [url, size]);

  return (
    <div className={`inline-block ${className}`}>
      <div ref={qrRef} className="rounded-lg border-2 border-primary/30 hover:border-primary/50 transition-colors" />
    </div>
  );
};