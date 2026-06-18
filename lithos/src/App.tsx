import { useState } from 'react';
import { 
  Menu, 
  X, 
  ChevronRight, 
  Layers, 
  Compass, 
  Download,
  RefreshCw
} from 'lucide-react';
import RevealLayer from './components/RevealLayer';
import { useSmoothedMouse } from './hooks/useSmoothedMouse';

const BG_IMAGE_1 = "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85";
const BG_IMAGE_2 = "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_201152_bba90a12-bf12-459f-91f0-51f237dbaf3b.png&w=1280&q=85";

// Interface for geological layers
interface GeoLayer {
  depthRange: string;
  name: string;
  age: string;
  epoch: string;
  dominantMineral: string;
  description: string;
  colorClass: string;
  fossils: string;
}

const GEOLOGICAL_LAYERS: GeoLayer[] = [
  {
    depthRange: "0 - 50m",
    name: "Quaternary Alluvium",
    age: "11,700 yr - 2.5M yr",
    epoch: "Holocene / Pleistocene",
    dominantMineral: "Quartz, Clay minerals, Silt",
    description: "Young, loosely consolidated riverbed deposition and glacial till. Highly porous and rich in modern microfauna.",
    colorClass: "border-amber-400 bg-amber-400/10 text-amber-300",
    fossils: "Mammoth teeth, modern mollusks, plant macrofossils"
  },
  {
    depthRange: "50 - 200m",
    name: "Cretaceous Chalk Group",
    age: "66M yr - 145M yr",
    epoch: "Upper Cretaceous",
    dominantMineral: "Calcite (Calcium Carbonate)",
    description: "Soft white limestone composed of coccoliths. Formed in deep warm marine shelfs during high sea-level periods.",
    colorClass: "border-sky-300 bg-sky-300/10 text-sky-200",
    fossils: "Ammonites, echinoids (sea urchins), bivalves"
  },
  {
    depthRange: "200 - 550m",
    name: "Jurassic Siltstone & Shales",
    age: "145M yr - 201M yr",
    epoch: "Middle to Upper Jurassic",
    dominantMineral: "Illite, Kaolinite, Pyrite",
    description: "Dark, organic-rich laminated fine mudstones. Notable as source rocks for ancient petroleums and rich fossil beds.",
    colorClass: "border-emerald-400 bg-emerald-400/10 text-emerald-300",
    fossils: "Pleisiosaur segments, ammonites (Dactylioceras), belemnites"
  },
  {
    depthRange: "550 - 1200m",
    name: "Triassic Red Sandstone",
    age: "201M yr - 252M yr",
    epoch: "Lower Triassic",
    dominantMineral: "Hematite, Orthoclase Feldspar",
    description: "Oxidized sandstone and conglomerates displaying ancient fluvial cross-bedding. Warm desert conditions left iron-oxide traces.",
    colorClass: "border-orange-400 bg-orange-400/10 text-orange-300",
    fossils: "Therapsid footprints, primitive plant spores, petrified wood"
  },
  {
    depthRange: "1200m+",
    name: "Devonian Old Red Sandstone",
    age: "358M yr - 419M yr",
    epoch: "Lower/Middle Devonian",
    dominantMineral: "Quartz, Mica, Iron oxides",
    description: "Highly lithified terrestrial sandstones from the Euramerican continent. First major deposits recording early land forest vegetation.",
    colorClass: "border-rose-400 bg-rose-400/10 text-rose-300",
    fossils: "Placoderm plates (armored fish), early club mosses"
  }
];

export default function App() {
  const [activeNav, setActiveNav] = useState('Course');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeGeoPanelLayer, setActiveGeoPanelLayer] = useState<number>(1);
  
  // Use custom hook for tracking cursor smoothly
  const { cursorPos, hasScanned } = useSmoothedMouse(0.1);

  // Derived current geological indices based on mouse cursor Y-coordinate position
  const getScanningData = () => {
    if (cursorPos.x === -999 || cursorPos.y === -999) {
      return {
        depth: 0,
        ...GEOLOGICAL_LAYERS[0]
      };
    }
    const heightRatio = Math.max(0, Math.min(1, cursorPos.y / window.innerHeight));
    const depthInMeters = Math.round(heightRatio * 1500);

    let layerIndex = 0;
    if (depthInMeters <= 50) layerIndex = 0;
    else if (depthInMeters <= 200) layerIndex = 1;
    else if (depthInMeters <= 550) layerIndex = 2;
    else if (depthInMeters <= 1200) layerIndex = 3;
    else layerIndex = 4;

    return {
      depth: depthInMeters,
      ...GEOLOGICAL_LAYERS[layerIndex]
    };
  };

  const currentScan = getScanningData();

  const navItems = ['Course', 'Field Guides', 'Geology', 'Plans', 'Live Tour'];

  return (
    <main 
      className="min-h-screen bg-white tracking-[-0.02em] selection:bg-[#e8702a]/30 selection:text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Dynamic Navigation */}
      <nav id="lithos-navbar" className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5">
        {/* Left Side: Logo & Wordmark */}
        <div className="flex items-center gap-3 backdrop-blur-sm bg-black/5 px-4 py-2 rounded-full border border-white/5">
          <svg 
            width="26" 
            height="26" 
            viewBox="0 0 256 256" 
            fill="#ffffff" 
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform duration-500 hover:rotate-180"
          >
            <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
          </svg>
          <span className="text-white text-2xl font-playfair italic select-none">Lithos</span>
        </div>

        {/* Center Pill Nav Bar */}
        <div 
          id="center-pill-nav"
          className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1 items-center gap-1 shadow-2xl shadow-black/20"
        >
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeNav === item 
                  ? 'bg-white text-gray-900 shadow-md shadow-black/10' 
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Right Side Items */}
        <div className="flex items-center gap-3">
          {/* Sign Up Desktop */}
          <button 
            id="signup-btn-desktop"
            className="hidden md:block bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all shadow-md hover:shadow-lg hover:shadow-white/5 cursor-pointer"
          >
            Sign Up
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden flex items-center justify-center p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[110] flex flex-col bg-black/95 backdrop-blur-xl transition-all duration-300">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <svg width="26" height="26" viewBox="0 0 256 256" fill="#ffffff">
                <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
              </svg>
              <span className="text-white text-2xl font-playfair italic">Lithos</span>
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center px-8 gap-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#e8702a]">Exploration Menu</p>
            <div className="flex flex-col gap-5 text-3xl font-medium">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setActiveNav(item);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left transition-colors flex items-center justify-between ${
                    activeNav === item ? 'text-white font-semibold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>{item}</span>
                  <ChevronRight className={`w-6 h-6 text-[#e8702a] transition-transform ${activeNav === item ? 'translate-x-1' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 border-t border-white/10 flex flex-col gap-4">
            <button className="w-full bg-white text-black py-4 rounded-xl font-semibold hover:bg-gray-100 active:scale-95 transition-all text-center">
              Sign Up For Explorer Account
            </button>
            <p className="text-xs text-center text-white/40">Lithos Geological Surveying © 2026</p>
          </div>
        </div>
      )}

      {/* Main Hero Section */}
      <section 
        id="lithos-hero-section"
        className="relative w-full overflow-hidden h-screen bg-black"
        style={{ height: '100dvh' }}
      >
        {/* Layer 1: Base Image (Ken Burns Zoom Intro Animation) */}
        <div 
          id="hero-base-image-layer"
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom pointer-events-none"
          style={{
            backgroundImage: `url(${BG_IMAGE_1})`
          }}
        />

        {/* Layer 2: Interactive Spotlight Reveal Layer */}
        <RevealLayer 
          image={BG_IMAGE_2} 
          cursorX={cursorPos.x} 
          cursorY={cursorPos.y} 
          spotlightRadius={450}
        />

        {/* Overlay Dark Vignette to pop typography and details */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 z-20 pointer-events-none" />

        {/* Subtle Tech Instruction HUD when no cursor/mouse movement is detected on desktop */}
        {!hasScanned && (
          <div className="absolute top-[8%] left-1/2 -translate-x-1/2 z-40 bg-black/40 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 flex items-center gap-2 pointer-events-none animate-pulse">
            <Compass className="w-3.5 h-3.5 text-[#e8702a]" />
            <span>Move cursor or tap and drag to scan sediment structure</span>
          </div>
        )}

        {/* Real-time Depth Mapping HUD (Interactive feedback based on cursor coordinates) */}
        {hasScanned && cursorPos.x !== -999 && (
          <div 
            id="cursor-feedback-hud"
            className="hidden lg:flex flex-col gap-2 absolute z-40 bg-black/75 backdrop-blur-md border border-white/20 p-4 rounded-xl max-w-[280px] pointer-events-none text-white transition-opacity duration-300 shadow-2xl"
            style={{
              left: `${cursorPos.x + 30}px`,
              top: `${cursorPos.y - 120}px`
            }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#e8702a]" /> Sensor Sweep
              </span>
              <span className="font-mono text-[10px] text-white/60 bg-white/10 px-1.5 rounded">
                Y: {Math.round(cursorPos.y)}px
              </span>
            </div>
            
            <div>
              <p className="text-[11px] text-white/50 leading-none">Scanning Depth</p>
              <h4 className="text-xl font-bold font-mono text-[#e8702a]">{currentScan.depth}m</h4>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div>
                <p className="text-[9px] text-white/40 uppercase">Stratum</p>
                <p className="text-xs font-semibold truncate text-white/90">{currentScan.name.split(" ")[0]}</p>
              </div>
              <div>
                <p className="text-[9px] text-white/40 uppercase">Epoch</p>
                <p className="text-xs font-semibold truncate text-white/90">{currentScan.epoch.split(" ")[0]}</p>
              </div>
            </div>

            <div className="text-[10px] text-white/50 italic bg-black/30 p-1.5 rounded border border-white/5">
              Revealing alternative seismic reflectivity view
            </div>
          </div>
        )}

        {/* Dynamic Scan Line Indicator (Horizontal guide following cursor y position) */}
        {hasScanned && cursorPos.y !== -999 && (
          <div 
            id="seismic-scan-axis"
            className="absolute left-0 right-0 h-[1px] bg-red-500/20 z-20 pointer-events-none flex items-center transition-opacity"
            style={{ top: `${cursorPos.y}px` }}
          >
            <div className="bg-red-500/60 text-[8px] font-mono font-medium px-2 py-0.5 rounded-r text-white leading-none">
              GRID_DEPTH: {currentScan.depth}m
            </div>
          </div>
        )}

        {/* Layer 3: Heading (Staggered Rising Blur-Reveal Animations) */}
        <div id="hero-heading-block" className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
          <h1 className="text-white leading-[0.95]">
            <span 
              className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
              style={{ 
                letterSpacing: '-0.05em',
                animationDelay: '0.25s'
              }}
            >
              Layers hold
            </span>
            <span 
              className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
              style={{ 
                letterSpacing: '-0.08em',
                animationDelay: '0.42s'
              }}
            >
              tales of time
            </span>
          </h1>
          <p className="text-white/40 text-[10px] sm:text-xs font-semibold uppercase tracking-widest mt-6 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full select-none animate-pulse">
            Interactive Spotlight Sensor • Hover to probe layers
          </p>
        </div>

        {/* Layer 4: Bottom-Left Paragraph (Staggered Fade-Up Anim) */}
        <div 
          id="hero-bottom-left-block"
          className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] hero-anim hero-fade z-50"
          style={{ animationDelay: '0.7s' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-[#e8702a] rounded-full mt-2 animate-ping" />
            <p className="text-sm text-white/80 leading-relaxed">
              Every layer of sediment records a chapter of our planet, from ancient seabeds to drifting ash, layered across millions of years beneath us.
            </p>
          </div>
        </div>

        {/* Layer 5: Bottom-Right Block (Staggered Fade-Up Anim & Start Digging Button) */}
        <div 
          id="hero-bottom-right-block"
          className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 hero-anim hero-fade z-50"
          style={{ animationDelay: '0.85s' }}
        >
          <div className="p-3.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 flex gap-3.5 items-start">
            <div className="bg-[#e8702a]/10 p-2.5 rounded-xl border border-[#e8702a]/20">
              <Compass className="w-5 h-5 text-[#e8702a]" />
            </div>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Our interactive maps let you peel back the crust to trace how stones, fossils, and deep time combine to shape the ground beneath your feet.
            </p>
          </div>

          <button 
            id="start-digging-btn"
            onClick={() => setSidebarOpen(true)}
            className="w-full sm:w-auto bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#e8702a]/30 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/40"
          >
            <span>Start Digging</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Vertical Depth Meter HUD on the right side */}
        <div className="absolute right-5 top-1/3 -translate-y-1/2 hidden md:flex flex-col items-center gap-2 z-40 bg-black/50 backdrop-blur-sm px-2.5 py-4 rounded-full border border-white/10 text-white select-none">
          <span className="text-[9px] font-mono font-bold text-white/40">0M</span>
          <div className="w-1 h-32 bg-white/10 rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 right-0 bg-[#e8702a] transition-all duration-150"
              style={{ height: `${(currentScan.depth / 1500) * 100}%` }}
            />
          </div>
          <span className="text-[9px] font-mono font-bold text-[#e8702a]">{currentScan.depth}M</span>
          <span className="text-[9px] font-mono font-bold text-white/40">1500M</span>
        </div>

        {/* Artistic Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 opacity-50 select-none pointer-events-none hero-anim hero-fade" style={{ animationDelay: '1.1s' }}>
          <div className="w-px h-12 bg-white/60"></div>
          <span className="text-[9px] text-white/75 uppercase tracking-widest font-medium">Scroll</span>
        </div>
      </section>

      {/* Geology Survey Digging Lab Sidebar / Overlay Sheet */}
      {sidebarOpen && (
        <div id="geology-sidebar-backdrop" className="fixed inset-0 z-[120] flex justify-end bg-black/85 backdrop-blur-md transition-opacity">
          {/* Clickable Backdrop side closer */}
          <div className="flex-1" onClick={() => setSidebarOpen(false)} />
          
          {/* Sidebar Drawer Panel */}
          <div 
            id="geology-sidebar-panel"
            className="w-full max-w-lg bg-zinc-950 text-white h-full overflow-y-auto p-6 sm:p-8 border-l border-white/10 flex flex-col justify-between shadow-2xl relative"
          >
            <div>
              {/* Close and Title */}
              <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-[#e8702a]/15 p-2 rounded-lg border border-[#e8702a]/30">
                    <Layers className="w-5 h-5 text-[#e8702a]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Lithospheric Core Sample</h3>
                    <p className="text-xs text-white/50">Vertical drilling simulator (0m - 1500m+)</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all cursor-pointer border border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Depth Segment Quick Selection tabs */}
              <div className="flex flex-col gap-2.5 mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Drill Target Strata</p>
                <div className="grid grid-cols-2 gap-2">
                  {GEOLOGICAL_LAYERS.map((layer, index) => (
                    <button
                      key={layer.name}
                      onClick={() => setActiveGeoPanelLayer(index)}
                      className={`text-left p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        activeGeoPanelLayer === index
                          ? 'bg-[#e8702a]/25 text-white border-[#e8702a]'
                          : 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-mono text-[9px] text-[#e8702a]">{layer.depthRange}</div>
                      <div className="font-semibold truncate">{layer.name.split(" ")[0]} {layer.name.split(" ")[1] || "Layer"}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Stratum Core Sample Sheet */}
              <div className="bg-zinc-900 rounded-2xl p-5 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-[#e8702a]/10 to-transparent pointer-events-none" />
                
                {/* Specific graphic representations based on selection */}
                <div className={`border-l-4 pl-4 py-1 mb-4 ${GEOLOGICAL_LAYERS[activeGeoPanelLayer].colorClass}`}>
                  <span className="font-mono text-xs block opacity-60">Stratum depth: {GEOLOGICAL_LAYERS[activeGeoPanelLayer].depthRange}</span>
                  <h4 className="text-xl font-bold font-playfair italic leading-tight">{GEOLOGICAL_LAYERS[activeGeoPanelLayer].name}</h4>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
                  <div className="bg-black/35 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] text-white/40 uppercase font-mono">Geological Age</p>
                    <p className="font-semibold text-white/95">{GEOLOGICAL_LAYERS[activeGeoPanelLayer].age}</p>
                  </div>
                  <div className="bg-black/35 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] text-white/40 uppercase font-mono">Formational Epoch</p>
                    <p className="font-semibold text-[#e8702a] truncate">{GEOLOGICAL_LAYERS[activeGeoPanelLayer].epoch}</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-white/80">
                  <div>
                    <span className="font-semibold text-white/90 block mb-1">Stratigraphic Composition / Mineralogy:</span>
                    <p className="bg-black/25 p-2 rounded-lg border border-white/5 font-mono text-xs text-white/70">
                      {GEOLOGICAL_LAYERS[activeGeoPanelLayer].dominantMineral}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-white/90 block mb-1">Index Fossils:</span>
                    <p className="bg-black/25 p-2 rounded-lg border border-white/5 text-xs text-amber-200/90 italic">
                      {GEOLOGICAL_LAYERS[activeGeoPanelLayer].fossils}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-white/90 block mb-1">Depositional Environment description:</span>
                    <p className="leading-relaxed opacity-90">
                      {GEOLOGICAL_LAYERS[activeGeoPanelLayer].description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated actions to prompt user */}
            <div className="pt-6 border-t border-white/10 mt-6 space-y-3.5">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Simulation coordinates active</span>
                <span>40.7128° N, 74.0060° W</span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    const message = `Seismological parameters saved! Layer details exported.`;
                    alert(message);
                  }}
                  className="flex-1 bg-white hover:bg-gray-100 text-[#1b1c1e] text-xs font-bold py-3.5 px-4 rounded-xl transition-all cursor-pointer text-center active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Core Datasheet</span>
                </button>
                <button
                  onClick={() => {
                    // Randomize stratum
                    setActiveGeoPanelLayer((prev) => (prev + 1) % GEOLOGICAL_LAYERS.length);
                  }}
                  className="bg-white/10 hover:bg-white/15 border border-white/10 text-white p-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                  title="Randomize layer selection"
                >
                  <RefreshCw className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
