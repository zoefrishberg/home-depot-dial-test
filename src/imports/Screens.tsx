import svgPaths from "./svg-3k1w8r72rx";
import imgScreens from "figma:asset/1465f52e1680f70f25ecb32e74bf329aae30e03a.png";
import imgScreens1 from "figma:asset/22623a43919aa268ad6e6266fa599373aef85a1d.png";

export default function Screens() {
  return (
    <div className="bg-[#e0e0e0] relative rounded-[64px] size-full" data-name="screens">
      <div className="content-stretch flex flex-col items-center overflow-clip pb-[34px] pt-[62px] relative rounded-[inherit] size-full">
        <div className="bg-[#313131] relative shrink-0 w-full" data-name="header">
          <div className="flex flex-row items-center size-full">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[16px] relative size-full">
              <div className="h-[40px] relative shrink-0 w-[102px]" data-name="navbar">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <img alt="" className="absolute h-[1892.5%] left-[-11.27%] max-w-none top-0 w-[385.29%]" src={imgScreens} />
                </div>
              </div>
              <div className="h-[40px] relative shrink-0 w-[120px]" data-name="navbar">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <img alt="" className="absolute h-[1892.5%] left-[-217.08%] max-w-none top-0 w-[327.5%]" src={imgScreens} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute left-0 top-0 w-[402px]" data-name="IOS / Status bar">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[154px] items-center justify-center pb-[19px] pt-[21px] px-[16px] relative size-full">
            <div className="content-stretch flex flex-[1_0_0] h-[22px] items-center justify-center min-h-px min-w-px pt-[2px] relative" data-name="Time">
              <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[22px] relative shrink-0 text-[17px] text-black text-center whitespace-nowrap">9:41</p>
            </div>
            <div className="content-stretch flex flex-[1_0_0] gap-[7px] h-[22px] items-center justify-center min-h-px min-w-px pt-px relative" data-name="Levels">
              <div className="h-[12.226px] relative shrink-0 w-[19.2px]" data-name="Cellular Connection">
                <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.2 12.2264">
                  <path clipRule="evenodd" d={svgPaths.p1e09e400} fill="var(--fill-0, black)" fillRule="evenodd" id="Cellular Connection" />
                </svg>
              </div>
              <div className="h-[12.328px] relative shrink-0 w-[17.142px]" data-name="Wifi">
                <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.1417 12.3283">
                  <path clipRule="evenodd" d={svgPaths.p18b35300} fill="var(--fill-0, black)" fillRule="evenodd" id="Wifi" />
                </svg>
              </div>
              <div className="h-[13px] relative shrink-0 w-[27.328px]" data-name="Battery">
                <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27.328 13">
                  <g id="Battery">
                    <rect height="12" id="Border" opacity="0.35" rx="3.8" stroke="var(--stroke-0, black)" width="24" x="0.5" y="0.5" />
                    <path d={svgPaths.p3bbd9700} fill="var(--fill-0, black)" id="Cap" opacity="0.4" />
                    <rect fill="var(--fill-0, black)" height="9" id="Capacity" rx="2.5" width="21" x="2" y="2" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-black flex-[1_0_0] min-h-px min-w-px relative w-full" data-name=".MainViewContainer">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
            <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[609px] left-[calc(50%-0.5px)] top-[calc(50%+0.08px)] w-[343px]" data-name="image 1">
              <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgScreens1} />
            </div>
            <div className="absolute bg-[rgba(0,0,0,0.4)] bottom-[15.92px] h-[80px] left-[16px] overflow-clip right-[65px] rounded-[16px]" data-name="histogram">
              <div className="-translate-y-1/2 absolute h-0 left-[12px] right-[12px] top-1/2" data-name="middle-line">
                <div className="absolute inset-[-1px_0_0_0]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 297 1">
                    <line id="middle-line" stroke="var(--stroke-0, #E0E0E0)" x2="297" y1="0.5" y2="0.5" />
                  </svg>
                </div>
              </div>
              <div className="-translate-y-1/2 absolute h-[49.501px] left-[2.99%] right-[29.85%] top-1/2" data-name="heartbeat">
                <div className="absolute inset-[-4.04%_-0.93%_-4.04%_-0.74%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 219.194 53.5007">
                    <g id="heartbeat">
                      <mask height="54" id="mask0_6153_3309" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }} width="221" x="-1" y="0">
                        <path d={svgPaths.p2eba9f00} id="line" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                      </mask>
                      <g mask="url(#mask0_6153_3309)">
                        <g id="color-fill">
                          <path d={svgPaths.p3bf44b70} fill="url(#paint0_linear_6153_3309)" />
                          <path d={svgPaths.p3bf44b70} fill="var(--fill-1, white)" />
                        </g>
                      </g>
                    </g>
                    <defs>
                      <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_6153_3309" x1="150.918" x2="150.918" y1="-3.99998" y2="55">
                        <stop stopColor="#2CC353" />
                        <stop offset="1" stopColor="#EB5547" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
            <div className="absolute bottom-[15.92px] content-stretch flex h-[240px] items-center justify-center pb-[70px] right-[16px] rounded-[9999px] w-[32px]" style={{ backgroundImage: "linear-gradient(180deg, rgb(44, 195, 83) 0%, rgba(255, 255, 255, 0.7) 50%, rgb(235, 85, 71) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }} data-name="slider-path">
              <div aria-hidden="true" className="absolute border-2 border-solid border-white inset-[-2px] pointer-events-none rounded-[10001px] shadow-[0px_4px_8px_0px_rgba(0,0,0,0.16)]" />
              <div className="bg-white content-stretch flex gap-[8px] h-[40px] items-center justify-center min-h-[40px] min-w-[40px] px-[12px] relative rounded-[28px] shrink-0" data-name="button">
                <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.16)] border-solid inset-[-1px] pointer-events-none rounded-[29px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.16)]" />
                <div className="overflow-clip relative shrink-0 size-[16px]" data-name="icon">
                  <div className="absolute inset-[29.17%_12.5%]" data-name="Vector">
                    <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 6.66667">
                      <path clipRule="evenodd" d={svgPaths.p3cdb7400} fill="var(--fill-0, black)" fillOpacity="0.16" fillRule="evenodd" id="Vector" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="-translate-x-1/2 absolute bg-black h-[36px] left-1/2 rounded-[32px] top-[13px] w-[124px]" />
        <div className="bg-[#e0e0e0] relative shrink-0 w-full" data-name="actions">
          <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.08)] border-solid border-t inset-0 pointer-events-none" />
          <div className="bg-clip-padding border-[transparent] border-solid border-t content-stretch flex gap-[13px] items-center pb-[24px] pt-[16px] px-[16px] relative size-full">
            <div className="bg-[rgba(0,0,0,0.08)] content-stretch flex gap-[8px] h-[40px] items-center justify-center min-h-[40px] min-w-[80px] px-[12px] relative rounded-[12px] shrink-0" data-name="button">
              <div className="relative shrink-0" data-name="span">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[4px] relative size-full">
                  <div className="flex flex-col font-['Inter_Variable:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[14px] text-[rgba(0,0,0,0.8)] text-center whitespace-nowrap" style={{ fontFeatureSettings: "'case', 'cpsp', 'ss01', 'ss04', 'lnum', 'tnum'" }}>
                    <p className="leading-[20px]">Back</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[rgba(0,0,0,0.4)] flex-[1_0_0] h-[40px] min-h-[40px] min-w-[40px] relative rounded-[12px]" data-name="button">
              <div className="flex flex-row items-center justify-center min-h-[inherit] min-w-[inherit] size-full">
                <div className="content-stretch flex gap-[8px] items-center justify-center min-h-[inherit] min-w-[inherit] px-[12px] relative size-full">
                  <div className="content-stretch flex items-center justify-center px-[4px] relative shrink-0" data-name="span">
                    <div className="flex flex-col font-['Inter_Variable:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[14px] text-center text-white whitespace-nowrap" style={{ fontFeatureSettings: "'case', 'cpsp', 'ss01', 'ss04', 'lnum', 'tnum'" }}>
                      <p className="leading-[20px]">12s Remaining</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0" data-name="Tabs Mode Compact">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[10px] items-center relative size-full">
            <div className="backdrop-blur-[12px] bg-[rgba(250,250,250,0.7)] content-stretch flex items-center justify-center py-[9px] relative rounded-[24px] shrink-0 size-[48px]" data-name="Button">
              <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[24px] shadow-[0px_2px_40px_0px_rgba(0,0,0,0.1)]" />
              <div className="flex flex-col font-['SF_Compact:Light',sans-serif] font-[350.52398681640625] justify-center leading-[0] relative shrink-0 size-[24px] text-[#1b1b1b] text-[23px] text-center">
                <p className="leading-[normal]">{`\u{100BF6}`}</p>
              </div>
            </div>
            <div className="backdrop-blur-[12px] bg-[rgba(250,250,250,0.7)] h-[48px] relative rounded-[24px] shrink-0 w-[218px]" data-name="Search Bar">
              <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[24px] shadow-[0px_2px_42px_0px_rgba(0,0,0,0.1)]" />
              <div className="-translate-y-1/2 absolute h-[17.982px] right-[13.24px] top-[calc(50%-0.31px)] w-[14.757px]" data-name="reload">
                <div className="absolute inset-[-0.56%_-0.68%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.9568 18.1824">
                    <path d={svgPaths.p35cf2300} fill="var(--fill-0, #1B1B1B)" id="reload" stroke="var(--stroke-0, #1B1B1B)" strokeWidth="0.2" />
                  </svg>
                </div>
              </div>
              <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro_Text:Medium',sans-serif] justify-center leading-[0] left-[calc(50%+0.5px)] not-italic text-[#1b1b1b] text-[17px] text-center top-1/2 whitespace-nowrap">
                <p className="leading-[normal]">nelsurveys.com</p>
              </div>
              <div className="-translate-y-1/2 absolute h-[18px] left-[15px] top-1/2 w-[15px]" data-name="site settings">
                <div className="absolute inset-[-0.56%_-0.67%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.2 18.2">
                    <path clipRule="evenodd" d={svgPaths.p1e0de700} fill="var(--fill-0, #1B1B1B)" fillRule="evenodd" id="site settings" stroke="var(--stroke-0, #1B1B1B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="backdrop-blur-[12px] bg-[rgba(250,250,250,0.7)] content-stretch flex items-center justify-center py-[9px] relative rounded-[24px] shrink-0 size-[48px]" data-name="Button">
              <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[24px] shadow-[0px_2px_40px_0px_rgba(0,0,0,0.1)]" />
              <div className="flex flex-col font-['SF_Compact:Light',sans-serif] font-[350.52398681640625] justify-center leading-[0] relative shrink-0 size-[24px] text-[#1b1b1b] text-[23px] text-center">
                <p className="leading-[normal]">{`\u{100360}`}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-10 border-[rgba(0,0,0,0.4)] border-solid inset-[-10px] pointer-events-none rounded-[74px]" />
    </div>
  );
}