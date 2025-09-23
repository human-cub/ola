import { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import olaLogo from '@/assets/ola-logo.png';

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
        image: olaLogo,
        dotsOptions: {
          color: "#2563eb",
          type: "rounded"
        },
        cornersSquareOptions: {
          color: "#1e40af",
          type: "extra-rounded"
        },
        cornersDotOptions: {
          color: "#1e40af",
          type: "dot"
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 8,
          imageSize: 0.4,
          saveAsBlob: true
        },
        qrOptions: {
          typeNumber: 0,
          mode: "Byte",
          errorCorrectionLevel: "M"
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