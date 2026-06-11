import { ShareButtons } from './ShareButtons';

interface ShareBlockProps {
  showQR?: boolean;
  refLink?: string;
}

export const ShareBlock = ({ showQR = false, refLink }: ShareBlockProps) => {
  return (
    <div className="bg-gradient-primary/10 rounded-lg p-4 border border-primary/20">
      <p className="text-sm font-semibold text-primary text-center mb-4">
        Invitá a un amigo y los dos obtienen el Súper-Precio
      </p>

      <ShareButtons source="share_block" refLink={refLink} />

      {showQR && (
        <div className="flex flex-col items-center gap-2 mt-4">
          <div className="w-[180px] h-[180px] aspect-square flex items-center justify-center">
            <img
              src="/qr-code-v2.png"
              alt="QR Code"
              className="w-full h-full object-contain hover:opacity-90 transition-opacity rounded-lg border-2 border-primary/30 hover:border-primary/50"
            />
          </div>
          <p className="text-sm font-semibold text-primary">
            Sumáte{' '}
            <a
              href="https://alaola.com.ar/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors"
            >
              alaola.com.ar
            </a>
          </p>
        </div>
      )}
    </div>
  );
};
