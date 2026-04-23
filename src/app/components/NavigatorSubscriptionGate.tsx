import { Sparkles } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import imgUnoLogo from 'figma:asset/036db285069a2b8b94cc4ad3c602ba0af3a2f1fe.png';

type NavigatorAccessGateProps = {
  onAlreadySubscribed: () => void;
  onNotSubscribed: () => void;
};

export function NavigatorAccessGate({ onAlreadySubscribed, onNotSubscribed }: NavigatorAccessGateProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f5f5f5]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(39,83,235,0.14),transparent_55%),linear-gradient(180deg,#eef2ff_0%,#f5f5f5_45%,#f5f5f5_100%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12 sm:px-8">
        <div className="rounded-2xl border border-white/80 bg-white/90 p-8 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.04)] backdrop-blur-sm sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 flex h-14 items-center justify-center">
              <div className="shadow-[0px_0px_1.6px_0px_white]">
                <img
                  src={imgUnoLogo}
                  alt="UNO"
                  className="h-9 w-auto object-contain sm:h-10"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
            <h1 className="text-[26px] font-semibold tracking-tight text-[#1a1a1a] sm:text-[28px]">
              Rates &amp; inventory
            </h1>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#555555]">
              Navigator competitive and parity features are integrated into UNO. Tell us whether your property already
              includes Navigator so we can show the right data.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-12 w-full border border-[#d1d5db] bg-white/80 text-[15px] font-medium text-[#374151] hover:bg-[#f9fafb]"
              onClick={onNotSubscribed}
            >
              Not Subscribed to Navigator
            </Button>
            <Button
              type="button"
              size="lg"
              className="h-12 w-full border-0 bg-[#2753eb] text-[15px] font-semibold text-white shadow-md shadow-[#2753eb]/25 hover:bg-[#1e45c7]"
              onClick={onAlreadySubscribed}
            >
              <Sparkles className="size-4 opacity-90" aria-hidden />
              Already Subscribed to Navigator
            </Button>
          </div>

          <p className="mt-8 text-center text-[12px] leading-snug text-[#888888]">
            You can always use Rates &amp; Inventory in UNO. Competitor and parity views need Navigator because live
            market data is costly to source and refresh.
          </p>
        </div>
      </div>
    </div>
  );
}
