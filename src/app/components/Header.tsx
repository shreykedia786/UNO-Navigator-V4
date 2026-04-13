import { ChevronDown, AlertCircle } from 'lucide-react';
import svgPaths from "../../imports/svg-n3t9v38tfc";
import imgLogo from "figma:asset/036db285069a2b8b94cc4ad3c602ba0af3a2f1fe.png";

export function Header() {

  return (
    <>
      {/* Main Header — full-width bg, content capped at 1440px */}
      <div className="bg-[#d9dbe0] w-full shadow-[0px_1px_12px_0px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1440px] mx-auto w-full flex items-center px-[50px] py-[10px]">
        <div className="flex items-center flex-1 min-w-0">
          {/* Menu Icon */}
          <div className="flex items-center justify-center p-[10px] h-[48px] w-[44px]">
            <div className="size-[24px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                <path d={svgPaths.p2e55b680} fill="#505050" />
              </svg>
            </div>
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center p-[10px]">
            <div className="h-[23px] w-[71px] shadow-[0px_0px_1.6px_0px_white]">
              <img alt="UNO Logo" className="size-full object-cover" src={imgLogo} />
            </div>
          </div>

          <div className="p-[10px] h-[48px]" />
        </div>

        {/* Center Title */}
        <div className="flex items-center justify-center gap-[6px]">
          <p className="font-medium text-[20px] text-[#333333] tracking-[-0.44px] leading-[1.5] whitespace-nowrap">
            Rates and Inventory
          </p>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-[10px] flex-1 min-w-0">
          {/* What's New */}
          <div className="relative h-[20px] w-[75px]">
            <div className="absolute inset-[0_4%_0_0] flex items-center justify-center">
              <p className="font-normal text-[13px] text-[#2f4bb7] tracking-[-0.286px] leading-[1.5] whitespace-nowrap">
                What's New?
              </p>
            </div>
            <div className="absolute aspect-square bg-[#de186c] left-[90.67%] right-0 rounded-full top-[3px]" />
          </div>

          {/* Divider */}
          <div className="h-[19px] w-0 relative">
            <div className="absolute inset-[0_-1px_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 19">
                <line stroke="#707070" strokeOpacity="0.4" x1="0.5" x2="0.5" y1="0" y2="19" />
              </svg>
            </div>
          </div>

          {/* User Avatar */}
          <div className="bg-[#414171] flex items-center justify-center p-[10px] rounded-[16px] size-[32px]">
            <p className="font-normal text-[14px] text-white leading-normal">
              JD
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Links Navigation */}
      <div className="bg-[#f8f7f7] w-full border-t border-[#e5e7eb]">
        <div className="max-w-[1440px] mx-auto w-full flex items-center justify-end px-[50px] pt-px">
        <div className="flex items-center gap-[32px]">
          {/* ARI Resync Link */}
          <div className="py-[12px]">
            <p className="font-normal text-[14px] text-[#2753eb] leading-[20px] tracking-[-0.1504px]">
              ARI Resync
            </p>
          </div>


          {/* Manage Restriction Link */}
          <div className="flex items-center gap-px py-[12px]">
            <p className="font-normal text-[14px] text-[#2753eb] leading-[20px] tracking-[-0.1504px]">
              Manage Restriction
            </p>
            <div className="size-[16px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <path d="M4 6L8 10L12 6" stroke="#2753EB" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Filter Selection */}
      <div className="bg-white w-full">
        <div className="max-w-[1440px] mx-auto w-full px-[50px] py-[18px] flex items-center justify-center">
        <div className="flex flex-wrap items-end justify-center gap-[32px] w-full">
          {/* Date Range */}
          <div className="flex flex-col items-start w-[220px]">
            <div className="h-[17px] mb-[3px]">
              <p className="font-normal text-[11px] text-[#8a8c9a] tracking-[-0.242px] leading-[1.5]">
                Date Range
              </p>
            </div>
            <div className="flex items-center pb-[3px] w-full border-b-[0.6px] border-[#a8a8a8] h-[30px]">
              <div className="flex items-center flex-1">
                <p className="font-normal text-[14px] text-black tracking-[-0.308px] leading-[1.5] whitespace-nowrap">
                  20 Jan 26 - 19 Feb 26
                </p>
              </div>
              <div className="flex items-center justify-center size-[32px]">
                <div className="size-[16px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                    <g clipPath="url(#clip0_36_6644)">
                      <path d={svgPaths.p1434f800} fill="#808080" />
                    </g>
                    <defs>
                      <clipPath id="clip0_36_6644">
                        <rect fill="white" height="16" width="16" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
            <div className="h-[17px] mt-[3px]">
              <p className="font-normal italic text-[11px] text-[#8a8c9a] tracking-[-0.242px] leading-[1.5]">
                Selected for next 30 days
              </p>
            </div>
          </div>

          {/* Property */}
          <div className="flex flex-col items-start w-[220px]">
            <div className="h-[17px] mb-[3px]">
              <p className="font-normal text-[11px] text-[#8a8c9a] tracking-[-0.242px] leading-[1.5]">
                Property (Type and Search)*
              </p>
            </div>
            <div className="flex items-center pb-[3px] w-full border-b-[0.6px] border-[#a8a8a8] h-[30px]">
              <p className="font-normal text-[14px] text-black tracking-[-0.308px] leading-[1.5]">
                DLF City Club 3
              </p>
            </div>
            <div className="h-[20px]" />
          </div>

          {/* Room Dropdown */}
          <div className="flex flex-col items-start w-[140px]">
            <div className="h-[17px] mb-[3px]">
              <p className="font-normal text-[11px] text-[#8a8c9a] tracking-[-0.242px] leading-[1.5]">
                Room
              </p>
            </div>
            <div className="h-[30px] w-full relative">
              <div className="absolute inset-0 flex items-center border-b-[0.6px] border-[#a8a8a8]">
                <p className="font-normal text-[14px] text-[#505050] tracking-[-0.308px] leading-[1.5]">
                  All
                </p>
              </div>
              <div className="absolute right-0 top-0 size-[28px] flex items-center justify-center">
                <svg className="block w-[11.5px] h-[6.5px]" fill="none" viewBox="0 0 11.5 6.5">
                  <path d={svgPaths.p3d2c9380} stroke="#8A8C9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
            <div className="h-[20px]" />
          </div>

          {/* Rate Dropdown */}
          <div className="flex flex-col items-start w-[140px]">
            <div className="h-[17px] mb-[3px]">
              <p className="font-normal text-[11px] text-[#8a8c9a] tracking-[-0.242px] leading-[1.5]">
                Rate
              </p>
            </div>
            <div className="h-[30px] w-full relative">
              <div className="absolute inset-0 flex items-center border-b-[0.6px] border-[#a8a8a8]">
                <p className="font-normal text-[14px] text-[#505050] tracking-[-0.308px] leading-[1.5]">
                  All
                </p>
              </div>
              <div className="absolute right-0 top-0 size-[28px] flex items-center justify-center">
                <svg className="block w-[11.5px] h-[6.5px]" fill="none" viewBox="0 0 11.5 6.5">
                  <path d={svgPaths.p3d2c9380} stroke="#8A8C9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
            <div className="h-[20px]" />
          </div>

          {/* Guest Count Dropdown */}
          <div className="flex flex-col items-start w-[140px]">
            <div className="h-[17px] mb-[3px]">
              <p className="font-normal text-[11px] text-[#8a8c9a] tracking-[-0.242px] leading-[1.5]">
                Guest Count
              </p>
            </div>
            <div className="h-[30px] w-full relative">
              <div className="absolute inset-0 flex items-center border-b-[0.6px] border-[#a8a8a8]">
                <p className="font-normal text-[14px] text-[#505050] tracking-[-0.308px] leading-[1.5]">
                  1 Adult
                </p>
              </div>
              <div className="absolute right-0 top-0 size-[28px] flex items-center justify-center">
                <svg className="block w-[11.5px] h-[6.5px]" fill="none" viewBox="0 0 11.5 6.5">
                  <path d={svgPaths.p3d2c9380} stroke="#8A8C9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
            <div className="h-[20px]" />
          </div>

          {/* Search Button */}
          <div className="bg-[#2753eb] flex items-center justify-center px-[10px] rounded-[6px] border border-[#2753eb] mb-[20px]">
            <div className="flex items-center justify-center gap-[6px] h-[40px] px-[12px]">
              <p className="font-normal text-[14px] text-white leading-[22px] tracking-[0.28px]">
                Search
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Sub Header with Legend and unmapped products */}
      <div className="bg-[#f1f2f8] w-full border-t border-[#e5e7eb]">
        <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between gap-4 px-[50px] py-2.5 min-h-[56px]">
        {/* Status legends — vertically centered as a row */}
        <div className="flex items-center flex-wrap gap-x-6 gap-y-2 min-w-0">
          <div className="flex items-center shrink-0">
            <p className="font-medium text-[14px] text-[#5f5f5f] leading-[20px] tracking-[-0.1504px]">
              Status:
            </p>
          </div>

          <div className="flex items-center gap-[6px] shrink-0">
            <div className="bg-[#ff7272] h-[7px] w-[19px]" />
            <p className="font-normal text-[12px] text-[#8b8c9a] leading-[20px] tracking-[-0.1504px]">
              Closed
            </p>
          </div>

          <div className="flex items-center gap-[6px] shrink-0">
            <div className="bg-[#80cbc4] h-[7px] w-[19px]" />
            <p className="font-normal text-[12px] text-[#8b8c9a] leading-[20px] tracking-[-0.1504px]">
              Available
            </p>
          </div>

          <div className="flex items-center gap-[6px] shrink-0">
            <div className="bg-[#c1d3f7] h-[7px] w-[19px]" />
            <p className="font-normal text-[12px] text-[#8b8c9a] leading-[20px] tracking-[-0.1504px]">
              Parent
            </p>
          </div>

          <div className="flex items-center gap-[6px] shrink-0">
            <div className="size-[14px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                <path d={svgPaths.p1aca3780} stroke="#FF5E01" strokeLinecap="round" strokeLinejoin="round" />
                <path d={svgPaths.p25f81600} stroke="#FF5E01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-normal text-[12px] text-[#8b8c9a] leading-[20px] tracking-[-0.1504px]">
              Restrictions
            </p>
          </div>
        </div>

        {/* Unmapped products — extreme right, vertically aligned with status row */}
        <div className="flex items-center justify-end shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => {
              console.log('Navigate to product mapping');
            }}
            className="flex items-center gap-2 group py-0.5"
          >
            <AlertCircle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
            <span className="font-normal text-[14px] text-[#DC2626] leading-[20px] tracking-[-0.1504px] whitespace-nowrap">
              5 products are currently unmapped
            </span>
            <span className="font-normal text-[14px] text-[#2753eb] leading-[20px] tracking-[-0.1504px] group-hover:underline flex items-center gap-1 whitespace-nowrap">
              Map Now
              <ChevronDown className="w-3.5 h-3.5 -rotate-90 shrink-0" />
            </span>
          </button>
        </div>
        </div>
      </div>
    </>
  );
}