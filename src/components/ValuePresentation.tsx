import React, { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Crown,
  Gem,
  ShieldAlert,
  Atom,
  Zap,
  Maximize,
  Car,
  Truck,
  FileWarning,
  ShieldCheck,
  Microscope,
  Anchor,
  ThermometerSnowflake,
  ThermometerSun,
  Droplets,
  Sun,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { CustomerInfoModal, type CustomerInfo } from "./CustomerInfoModal";

const PresentationBoardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="4" y="3" width="16" height="11" rx="2" />
    <path d="M8 21h8" />
    <path d="M12 14v7" />
    <path d="M8 8l2 2 3-4 3 5" />
  </svg>
);

interface ValuePresentationProps {
  onComplete: () => void;
  customerInfo?: CustomerInfo;
  onSaveCustomerInfo?: (info: CustomerInfo) => void;
}

/**
 * Technical Restoration: Standardized Bullet Component
 * Ensures 100% UI consistency and vertical alignment for iPad displays.
 */
const BulletRow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-3 text-white/75 font-light leading-relaxed">
    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full mt-2 flex-shrink-0 shadow-[0_0_10px_rgba(37,99,235,0.6)]" />
    <div className="text-base md:text-[17px] lg:text-lg">{children}</div>
  </div>
);

const ValuePresentation: React.FC<ValuePresentationProps> = ({
  onComplete,
  customerInfo,
  onSaveCustomerInfo,
}) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 12;
  const [activeSlide, setActiveSlide] = useState(1);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [showCustomerHint, setShowCustomerHint] = useState(false);

  const preparedForName = (customerInfo?.name ?? "").trim();
  const preparedForVehicle = [
    customerInfo?.year ?? "",
    customerInfo?.make ?? "",
    customerInfo?.model ?? "",
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");

  const reviewCtaName = preparedForName ? preparedForName.toUpperCase() : "";

  useEffect(() => {
    if (!onSaveCustomerInfo) return;
    if (typeof window === "undefined") return;
    // Keep discoverability without clutter: show once per tab session.
    const key = "am_customer_hint_shown";
    if (window.sessionStorage.getItem(key) === "1") return;

    // Only hint if there's nothing filled in yet.
    if (preparedForName) {
      window.sessionStorage.setItem(key, "1");
      return;
    }

    setShowCustomerHint(true);
    window.sessionStorage.setItem(key, "1");
    const timeout = window.setTimeout(() => setShowCustomerHint(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [onSaveCustomerInfo, preparedForName]);

  // Mapping for locally saved PNG files in your /public folder
  const images: Record<number, string> = {
    2: "/MENU1.png",
    3: "/MENU2.png",
    4: "/MENU3.png",
    5: "/MENU4.png",
    6: "/MENU8.png",
    7: "/MENU5.png",
    8: "/MENU7.png",
    9: "/MENU10.png",
    10: "/MENU6.png",
    11: "/MENU9.png",
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = parseInt(entry.target.id.replace("rs", ""));
            setActiveSlide(id);
            setCurrentSlide(id);
          }
        });
      },
      { threshold: 0.6 }
    );

    document.querySelectorAll(".slide-container").forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Avoid interfering with any potential form elements.
      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target as HTMLElement).isContentEditable);

      if (isEditableTarget) return;

      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        scrollToSlide(currentSlide + 1);
      }

      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        scrollToSlide(currentSlide - 1);
      }

      if (event.key === "Home") {
        event.preventDefault();
        scrollToSlide(1);
      }

      if (event.key === "End") {
        event.preventDefault();
        scrollToSlide(totalSlides);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onComplete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, onComplete]);

  const scrollToSlide = (index: number) => {
    if (index < 1 || index > totalSlides) return;
    document.getElementById(`rs${index}`)?.scrollIntoView({ behavior: "smooth" });
  };

  const progress = ((currentSlide - 1) / (totalSlides - 1)) * 100;
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!progressBarRef.current) return;
    progressBarRef.current.style.width = `${progress}%`;
  }, [progress]);

  useEffect(() => {
    // Enable immediate keyboard navigation on desktop + iPad w/ keyboard.
    scrollRootRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0d0d0d] overflow-hidden text-white font-sans selection:bg-blue-500/30">
      <CustomerInfoModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        currentInfo={customerInfo ?? { name: "", year: "", make: "", model: "" }}
        onSave={(info) => {
          onSaveCustomerInfo?.(info);
        }}
      />
      {/* Premium Executive Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[4px] bg-white/5 z-[10000]">
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700 shadow-[0_0_15px_rgba(0,145,255,0.5)]"
        />
      </div>

      {/* Navigation Controls */}
      <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-[max(1.5rem,env(safe-area-inset-right))] flex items-center gap-3 z-[10000]">
        <div className="hidden sm:flex items-center gap-3 mr-1">
          <div className="text-[10px] uppercase tracking-[0.35em] text-white/35">
            Slide {currentSlide}/{totalSlides}
          </div>
          <button
            type="button"
            onClick={onComplete}
            aria-label="Review package options"
            title="Review package options"
            className="p-3 rounded-full bg-blue-600/20 hover:bg-blue-600/35 transition-all backdrop-blur-2xl border border-blue-400/20 shadow-2xl"
          >
            <PresentationBoardIcon className="w-[18px] h-[18px] text-white" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => scrollToSlide(1)}
          aria-label="Go to first slide"
          title="Go to first slide"
          className="p-3 rounded-full bg-white/5 hover:bg-blue-600 transition-all backdrop-blur-2xl border border-white/10 shadow-2xl"
        >
          <Home size={18} />
        </button>
        <button
          type="button"
          onClick={() => scrollToSlide(currentSlide - 1)}
          aria-label="Previous slide"
          title="Previous slide"
          className="p-3 rounded-full bg-white/5 hover:bg-blue-600 transition-all backdrop-blur-2xl border border-white/10 shadow-2xl"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => scrollToSlide(currentSlide + 1)}
          aria-label="Next slide"
          title="Next slide"
          className="p-3 rounded-full bg-white/5 hover:bg-blue-600 transition-all backdrop-blur-2xl border border-white/10 shadow-2xl"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={scrollRootRef}
        tabIndex={-1}
        className="h-screen overflow-y-auto snap-y snap-mandatory scrollbar-none scroll-smooth overscroll-contain focus:outline-none"
      >
        {/* Slide 1: Welcome */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col px-8 md:px-10 lg:px-16 py-10 md:py-12 lg:py-16 relative overflow-hidden"
          id="rs1"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(0,145,255,0.05)_0%,transparent_50%)]" />

          {onSaveCustomerInfo && (
            <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
              {showCustomerHint && (
                <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] uppercase tracking-[0.2em] text-white/70">
                  Customer
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowCustomerHint(false);
                  setIsCustomerModalOpen(true);
                }}
                aria-label="Edit customer and vehicle info"
                title="Customer / vehicle"
                className={`p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition ${
                  showCustomerHint ? "animate-pulse" : ""
                }`}
              >
                <UserCheck size={16} />
              </button>
            </div>
          )}

          <div
            className={`m-auto text-center z-10 transition-all duration-1000 transform ${activeSlide === 1 ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <h1 className="text-5xl lg:text-7xl font-bold uppercase tracking-widest mb-4 leading-tight">
              Protecting
              <br />
              Your Vehicle
            </h1>
            <p className="text-xl lg:text-2xl text-blue-500 uppercase tracking-[0.4em] font-light mb-8">
              Virginia Beach Resilience
            </p>
            <div className="w-16 h-0.5 bg-blue-600 mx-auto opacity-50" />

            <div className="mt-8">
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">Prepared for</p>
              <p className="mt-2 text-lg lg:text-2xl text-white/80 font-light">
                {preparedForName || "__________"}
              </p>
              {preparedForVehicle ? (
                <p className="mt-2 text-sm lg:text-base text-white/45 font-light">
                  on their {preparedForVehicle}
                </p>
              ) : null}
            </div>

            <p className="mt-8 italic text-white/30 font-light text-lg">
              A value overview for the Lexus Ownership Experience...
            </p>
          </div>
        </div>

        {/* Slide 2: Factory Warranty */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col px-8 md:px-10 lg:px-16 py-10 md:py-12 lg:py-16 relative"
          id="rs2"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 max-w-6xl mx-auto w-full ${activeSlide === 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.3em] block mb-2 uppercase">
              Factory Coverage
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold uppercase tracking-[0.14em] mb-6 pb-4 border-b border-white/10">
              Lexus Manufacturer Warranties
            </h2>
            <div className="grid grid-cols-2 gap-8 lg:gap-10 items-center">
              <div className="space-y-4">
                <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed">
                  Your new Lexus comes with world-class mechanical protection designed to cover
                  manufacturing defects:
                </p>
                <ul className="space-y-1 list-none">
                  <li>
                    <BulletRow>
                      <strong>Basic Warranty:</strong> 48 months / 50,000 miles covering components
                      other than normal wear.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Powertrain:</strong> 72 months / 70,000 miles for engine,
                      transmission, and drive systems.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Hybrid/EV:</strong> Up to 10 years / 150,000 miles for the hybrid
                      battery components.
                    </BulletRow>
                  </li>
                </ul>
                <p className="text-[10px] text-white/30 italic mt-4">
                  *Subject to Lexus terms and conditions. Focuses on mechanical reliability.
                </p>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video shadow-2xl max-h-[40vh]">
                <img src={images[2]} alt="Warranty" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Slide 3: Priorities For Life */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col px-8 md:px-10 lg:px-16 py-10 md:py-12 lg:py-16 relative"
          id="rs3"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 max-w-6xl mx-auto w-full ${activeSlide === 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.3em] block mb-2 uppercase">
              The Priority Advantage
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold uppercase tracking-[0.14em] mb-6 pb-4 border-b border-white/10">
              Priorities For Life
            </h2>
            <div className="grid grid-cols-2 gap-8 lg:gap-10 items-center">
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video shadow-2xl max-h-[40vh]">
                <img src={images[3]} alt="Service" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4">
                <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed">
                  We’ve ensured your vehicle’s mechanical health and maintenance are handled for the
                  long haul:
                </p>
                <ul className="space-y-1 list-none">
                  <li>
                    <BulletRow>
                      <strong>Engine For Life:</strong> Lifetime coverage on engine components.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Oil & Filter Changes:</strong> Provided for as long as you own your
                      vehicle.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>VA State Inspections:</strong> Annual safety inspections covered for
                      life.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Towing For Life:</strong> Within a 50-mile radius of any Priority
                      dealership.
                    </BulletRow>
                  </li>
                </ul>
                <div className="bg-blue-600/10 border-l-4 border-blue-600 p-4 rounded-r-xl backdrop-blur-xl mt-4 shadow-lg">
                  <p className="text-sm lg:text-base italic font-light text-blue-100 leading-snug">
                    "Now that your mechanical maintenance is secured, let's protect the aesthetic
                    integrity."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 4: Warranty Gap */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col px-8 md:px-10 lg:px-16 py-10 md:py-12 lg:py-16 relative"
          id="rs4"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 max-w-6xl mx-auto w-full ${
              activeSlide === 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.3em] block mb-2 uppercase">
              The Gap
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold uppercase tracking-[0.14em] mb-6 pb-4 border-b border-white/10">
              Appearance Damage Isn’t Mechanical
            </h2>
            <div className="grid grid-cols-2 gap-8 lg:gap-10 items-center">
              <div className="space-y-4">
                <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed">
                  Lexus warranties protect manufacturing defects — but most real-world ownership
                  pain comes from environmental exposure, road hazards, and interior wear.
                </p>
                <ul className="space-y-1 list-none">
                  <li>
                    <BulletRow>
                      <strong>Environmental Etching:</strong> Bird droppings, tree sap, and
                      industrial fallout can permanently damage clear coat.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Rock Chips:</strong> Highway debris causes impact points that lead to
                      paint failure.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Interior Wear:</strong> Stains, tears, and burns directly reduce
                      trade-in equity.
                    </BulletRow>
                  </li>
                </ul>
                <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-xl backdrop-blur-md shadow-lg">
                  <p className="text-red-400 font-black text-[10px] uppercase mb-1 tracking-widest">
                    Coverage Reality
                  </p>
                  <p className="text-xs text-white/90 leading-tight font-light">
                    These are typically considered <strong>appearance</strong> or{" "}
                    <strong>environmental</strong>
                    issues — not mechanical defects.
                  </p>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video shadow-2xl max-h-[40vh]">
                <img
                  src={images[4]}
                  alt="Protection overview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Slide 5: Regional Science */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col px-8 md:px-10 lg:px-16 py-10 md:py-12 lg:py-16 relative"
          id="rs5"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 max-w-6xl mx-auto w-full ${activeSlide === 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.3em] block mb-2 uppercase">
              Coastal Science
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold uppercase tracking-[0.14em] mb-4 pb-4 border-b border-white/10">
              The "Coastal Corrosion" Reality
            </h2>
            <div className="grid grid-cols-2 gap-8 lg:gap-10 items-start">
              <div className="relative rounded-xl overflow-hidden border border-white/10 h-[280px] lg:h-[350px] shadow-2xl">
                <img
                  src={images[5]}
                  alt="VA Beach Science"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-2xl shadow-inner">
                  <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Atom size={14} /> Electrochemical Facts
                  </h3>
                  <ul className="space-y-1 list-none">
                    <li>
                      <BulletRow>
                        <strong>Salt Air:</strong> Particles suspended for 50+ miles, seeking paint
                        pores.
                      </BulletRow>
                    </li>
                    <li>
                      <BulletRow>
                        <strong>Magnesium Chloride:</strong> Road brines are{" "}
                        <strong>10x more corrosive</strong> than salt.
                      </BulletRow>
                    </li>
                    <li>
                      <BulletRow>
                        <strong>Humid Catalyst:</strong> Coastal humidity accelerates oxidation
                        speed on raw metal.
                      </BulletRow>
                    </li>
                    <li>
                      <BulletRow>
                        <strong>Industrial Fallout:</strong> Industrial port soot creates aggressive
                        clarity etching.
                      </BulletRow>
                    </li>
                    <li>
                      <BulletRow>
                        <strong>Well Water:</strong> Regional mineral content causes permanent
                        mineral "water spots."
                      </BulletRow>
                    </li>
                  </ul>
                </div>
                <div className="bg-red-500/10 border-l-4 border-red-500 p-3 rounded-r-xl backdrop-blur-md shadow-lg">
                  <p className="text-red-400 font-black text-[10px] uppercase mb-1 tracking-widest">
                    FACTORY WARRANTY GAP:
                  </p>
                  <p className="text-xs text-white/90 leading-tight font-light">
                    Standard warranties typically do <strong>not</strong> cover environmental
                    etching, salt-air corrosion, or highway rock chips.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 6: RustGuard Pro */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col px-8 md:px-10 lg:px-16 py-10 md:py-12 lg:py-16 relative"
          id="rs6"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 max-w-6xl mx-auto w-full ${activeSlide === 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.4em] block mb-2 uppercase">
              Structural Integrity Shield
            </span>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
              <Zap size={12} className="text-white" aria-hidden="true" />
              CORROSION NEUTRALIZATION TECH
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold uppercase tracking-[0.14em] mb-6 pb-4 border-b border-white/10">
              RustGuard Pro: Foundation Defense
            </h2>

            <div className="grid grid-cols-2 gap-8 lg:gap-10 items-center">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-white text-sm md:text-base font-black uppercase tracking-[0.18em] flex items-center gap-2">
                    <Microscope size={18} className="text-blue-500" aria-hidden="true" />
                    Molecular Barrier
                  </h3>
                  <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed">
                    In our coastal region, the most dangerous damage is the kind you can&apos;t see.
                    RustGuard Pro creates an active chemical barrier that neutralizes oxidation on
                    contact.
                  </p>
                </div>

                <ul className="space-y-1 list-none">
                  <li>
                    <BulletRow>
                      <strong>Salt Air Neutralization:</strong> Active inhibitors stop salt
                      particles from bonding to raw chassis steel.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Magnesium Chloride Defense:</strong> High-density shield against
                      aggressive winter road brines.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Structural Security:</strong> Prevents the &quot;rust-freezing&quot;
                      of critical suspension and braking components.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Hidden Cavity Protection:</strong> Crevice-penetrating formula reaches
                      inner panels where moisture collects.
                    </BulletRow>
                  </li>
                </ul>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                    <Anchor size={24} className="text-blue-500 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        Coastal Immunity
                      </h4>
                      <p className="text-[9px] text-white/40 leading-tight mt-1">
                        Engineered for Virginia Beach humidity catalysts.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                    <ShieldAlert
                      size={24}
                      className="text-blue-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        Equity Insurance
                      </h4>
                      <p className="text-[9px] text-white/40 leading-tight mt-1">
                        A clean undercarriage protects trade-in value.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video shadow-2xl max-h-[38vh]">
                <img
                  src={images[6]}
                  alt="RustGuard Pro Chassis Protection"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,145,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,145,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute bottom-4 right-4 text-blue-500/40">
                  <ThermometerSnowflake size={48} strokeWidth={1} aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="mt-4 bg-blue-600/10 border-l-4 border-blue-600 p-3 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between gap-6">
              <p className="text-xs lg:text-sm text-white/90 font-light italic max-w-2xl">
                &quot;By protecting the structural foundation of your Lexus, RustGuard ensures your
                vehicle remains safe, silent, and structurally sound for the life of your
                ownership.&quot;
              </p>
              <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest border-l border-white/10 pl-6 shrink-0">
                <ShieldCheck size={16} aria-hidden="true" />
                LIFETIME STRUCTURE WARRANTY
              </div>
            </div>
          </div>
        </div>

        {/* Slide 7: ToughGuard */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col px-8 md:px-10 lg:px-16 py-10 md:py-12 lg:py-16 relative"
          id="rs7"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 max-w-6xl mx-auto w-full ${activeSlide === 7 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.4em] block mb-2 uppercase">
              Exterior Protection
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold uppercase tracking-[0.14em] mb-6 pb-4 border-b border-white/10">
              ToughGuard: The Clear Coat Shield
            </h2>
            <div className="grid grid-cols-2 gap-8 lg:gap-10 items-center">
              <div className="space-y-4">
                <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed">
                  Modern clear coats are porous. ToughGuard Premium creates a permanent chemical
                  bond that seals those pores for good.
                </p>
                <ul className="space-y-1 list-none">
                  <li>
                    <BulletRow>
                      <strong>One-Time Application:</strong> No more annual waxing or polishing.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Environmental Shield:</strong> Covers damage from bird droppings, tree
                      sap, and fallout.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Chemical Resistance:</strong> Guards against Bird Droppings, Tree Sap,
                      and Insects.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Climate Barrier:</strong> Blocks UV Rays, Road Salt, and Acid Rain
                      damage.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>The Finish:</strong> A deep, permanent "Liquid-Glass" shine.
                    </BulletRow>
                  </li>
                </ul>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video shadow-2xl max-h-[38vh]">
                <img src={images[7]} alt="ToughGuard" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="mt-4 bg-blue-600/10 border-l-4 border-blue-600 p-3 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-end">
              <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest shrink-0">
                <ShieldCheck size={16} aria-hidden="true" />
                5-YEAR SURFACE GUARANTEE
              </div>
            </div>
          </div>
        </div>

        {/* Slide 8: InteriorGuard (Cabin Preservation) */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col px-8 md:px-10 lg:px-16 py-10 md:py-12 lg:py-16 relative"
          id="rs8"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 max-w-6xl mx-auto w-full ${activeSlide === 8 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.4em] block mb-2 uppercase">
              Signature Interior Defense
            </span>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
              <Zap size={12} className="text-white" aria-hidden="true" />
              NANO-CERAMIC TEXTILE SHIELD
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold uppercase tracking-[0.14em] mb-6 pb-4 border-b border-white/10">
              InteriorGuard: Cabin Preservation
            </h2>

            <div className="grid grid-cols-2 gap-8 lg:gap-10 items-center">
              <div className="space-y-5">
                <div className="space-y-2">
                  <h3 className="text-white text-sm md:text-base font-black uppercase tracking-[0.18em] flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-500" aria-hidden="true" />
                    Advanced Polymer Barrier
                  </h3>
                  <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed">
                    Luxury interiors require a sophisticated defense. InteriorGuard life-proofs your
                    cabin by sealing fibers and surfaces against the moments that impact trade-in
                    value.
                  </p>
                </div>

                <ul className="space-y-1 list-none">
                  <li>
                    <BulletRow>
                      <strong>Stain Hydrophobicity:</strong> Immediate repulsion of water and
                      oil-based spills (coffee, soda, and food dye).
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>UV Inhibition:</strong> Prevents leather cracking and vinyl
                      discoloration from intense coastal solar heat.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Antimicrobial Shield:</strong> Inhibits the growth of bacteria, mold,
                      and mildew within deep seat fibers.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Material Conditioning:</strong> Maintains the soft, supple factory
                      feel of NuLuxe and Semi-Aniline leathers.
                    </BulletRow>
                  </li>
                </ul>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                    <Droplets
                      size={24}
                      className="text-blue-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        Spill Security
                      </h4>
                      <p className="text-[9px] text-white/40 leading-tight mt-1">
                        Guaranteed protection against 100+ daily accidental stains.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                    <UserCheck
                      size={24}
                      className="text-blue-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        Resale Edge
                      </h4>
                      <p className="text-[9px] text-white/40 leading-tight mt-1">
                        A pristine, scent-free interior is the highest valued trade-in factor.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video shadow-2xl max-h-[34vh] bg-[#111]">
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <img
                  src={images[8]}
                  alt="InteriorGuard Cabin Protection"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,145,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,145,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute bottom-4 right-4 text-blue-500/40 pointer-events-none">
                  <Sun size={48} strokeWidth={1} aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="mt-4 bg-blue-600/10 border-l-4 border-blue-600 p-3 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between gap-6">
              <p className="text-xs lg:text-sm text-white/90 font-light italic max-w-2xl">
                &quot;By sealing your vehicle&apos;s most intimate surfaces, InteriorGuard ensures
                your Lexus remains as inviting and vibrant as the day you first sat in the
                driver&apos;s seat.&quot;
              </p>
              <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest border-l border-white/10 pl-6 shrink-0">
                <ShieldCheck size={16} aria-hidden="true" />
                5-YEAR INTERIOR GUARANTEE
              </div>
            </div>
          </div>
        </div>

        {/* Slide 9: Diamond Shield (Windshield Protection) */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col px-8 md:px-10 lg:px-16 py-10 md:py-12 lg:py-16 relative"
          id="rs9"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 max-w-6xl mx-auto w-full ${activeSlide === 9 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.4em] block mb-2 uppercase">
              Structural Glass Defense
            </span>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
              <Zap size={12} className="text-white" aria-hidden="true" />
              NANO-MOLECULAR BONDING
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold uppercase tracking-[0.14em] mb-6 pb-4 border-b border-white/10">
              Diamond Shield: Windshield Protection
            </h2>

            <div className="grid grid-cols-2 gap-8 lg:gap-10 items-center">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-white text-sm md:text-base font-black uppercase tracking-[0.18em] flex items-center gap-2">
                    <Maximize size={18} className="text-blue-500" aria-hidden="true" />
                    Liquid-Glass Resilience
                  </h3>
                  <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed">
                    Diamond Shield uses an advanced polymer to seal microscopic pores, creating a
                    smooth, high-tension surface that deflects impacts.
                  </p>
                </div>

                <ul className="space-y-1 list-none">
                  <li>
                    <BulletRow>
                      <strong>Impact Resistance:</strong> Reduces the likelihood of rock chips and
                      spider-web cracks.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Pitting &amp; Sand-Clouding:</strong> Defends against coastal
                      &quot;sand-blasting&quot; at highway speeds.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Hydrophobic Clarity:</strong> Sheds water, snow, and ice for improved
                      foul-weather visibility.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Optically Clear:</strong> Enhances night-driving clarity by reducing
                      glare and refraction.
                    </BulletRow>
                  </li>
                </ul>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video shadow-2xl max-h-[38vh]">
                <img
                  src={images[9]}
                  alt="Diamond Shield Glass Protection"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="mt-4 bg-blue-600/10 border-l-4 border-blue-600 p-3 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between gap-6">
              <p className="text-xs lg:text-sm text-white/90 font-light italic max-w-2xl">
                &quot;Diamond Shield strengthens the structural integrity of your glass while
                providing a self-cleaning surface that preserves your visibility and your
                vehicle&apos;s clean history.&quot;
              </p>
              <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest border-l border-white/10 pl-6 shrink-0">
                <ShieldCheck size={16} aria-hidden="true" />
                Fully Warrantied Protection
              </div>
            </div>
          </div>
        </div>

        {/* Slide 10: Impact Protection */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col px-8 md:px-10 lg:px-16 py-10 md:py-12 lg:py-16 relative"
          id="rs10"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 ${
              activeSlide === 10 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="max-w-6xl mx-auto w-full">
              <span className="text-blue-500 font-bold text-xs tracking-[0.4em] block mb-2 uppercase">
                Advanced Ballistic Shield
              </span>
              <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
                <Zap size={12} className="text-white" aria-hidden="true" />
                8-MIL OPTICAL POLYURETHANE
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold uppercase tracking-[0.14em] mb-6 pb-4 border-b border-white/10">
                Highway Hazards: Suntek Film
              </h2>

              <div className="grid grid-cols-2 gap-8 lg:gap-10 items-center">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h3 className="text-white text-sm md:text-base font-black uppercase tracking-[0.18em] flex items-center gap-2">
                      <Maximize size={18} className="text-blue-500" aria-hidden="true" />
                      Kinetic Impact Defense
                    </h3>
                    <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed">
                      I-264 construction and coastal sand effectively &apos;sand-blast&apos; your
                      front-end at highway speeds. Suntek Ultra provides a sacrificial barrier that
                      absorbs high-velocity impacts.
                    </p>
                  </div>

                  <ul className="space-y-1 list-none">
                    <li>
                      <BulletRow>
                        <strong>Rock Chip Immunity:</strong> 8-mil invisible physical barrier stops
                        gravel and road debris from reaching the paint.
                      </BulletRow>
                    </li>
                    <li>
                      <BulletRow>
                        <strong>Self-Healing Technology:</strong> Specialized top-coat allows minor
                        surface scratches to disappear with ambient solar heat.
                      </BulletRow>
                    </li>
                    <li>
                      <BulletRow>
                        <strong>Stain Resistance:</strong> Hydrophobic properties repel bird
                        droppings, insects, and road grime to prevent etching.
                      </BulletRow>
                    </li>
                    <li>
                      <BulletRow>
                        <strong>Total Coverage:</strong> Precision-cut focus on high-impact areas:
                        Hood, Bumpers, Mirrors, and Door Cups.
                      </BulletRow>
                    </li>
                  </ul>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                      <ThermometerSun
                        size={24}
                        className="text-blue-500 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                          Self-Healing
                        </h4>
                        <p className="text-[9px] text-white/40 leading-tight mt-1">
                          Swirl marks and light scratches vanish automatically in the sun.
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                      <ShieldAlert
                        size={24}
                        className="text-blue-500 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                          Value Shield
                        </h4>
                        <p className="text-[9px] text-white/40 leading-tight mt-1">
                          Preserves factory paint finish for maximum future trade-in equity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video shadow-2xl max-h-[38vh] bg-[#111] group">
                  {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                  <img
                    src={images[10]}
                    alt="Suntek Ultra Paint Protection Film"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/10 uppercase tracking-widest pointer-events-none">
                    Impact Protection: MENU6.png
                  </div>
                  <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,rgba(0,145,255,0.1)_0%,transparent_70%)]" />
                  <div className="absolute top-4 right-4 text-blue-500/40">
                    <Car size={48} strokeWidth={1} aria-hidden="true" />
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-blue-600/10 border-l-4 border-blue-600 p-4 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between gap-6">
                <p className="text-xs lg:text-sm text-white/90 font-light italic max-w-2xl">
                  &quot;Suntek Ultra ensures your Lexus front-end remains in showroom condition,
                  effectively neutralizing the abrasive reality of regional highway travel.&quot;
                </p>
                <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest border-l border-white/10 pl-6 shrink-0">
                  <ShieldCheck size={16} aria-hidden="true" />
                  10-YEAR MANUFACTURER WARRANTY
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 11: Evernew (Appearance Protection) */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col px-8 md:px-10 lg:px-16 py-10 md:py-12 lg:py-16 relative"
          id="rs11"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 max-w-6xl mx-auto w-full ${activeSlide === 11 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.4em] block mb-2 uppercase">
              Premium Aesthetic Restoration
            </span>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
              <Zap size={12} className="text-white" aria-hidden="true" />
              HIGH-LINE PRECISION SCANNING
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold uppercase tracking-[0.14em] mb-6 pb-4 border-b border-white/10">
              Evernew: Appearance Protection
            </h2>

            <div className="grid grid-cols-2 gap-8 lg:gap-10 items-center">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-white text-sm md:text-base font-black uppercase tracking-[0.18em] flex items-center gap-2">
                    <Maximize size={18} className="text-blue-500" aria-hidden="true" />
                    Digital Reconditioning
                  </h3>
                  <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed">
                    Evernew uses high-precision scanning to identify and neutralize surface
                    imperfections before they compromise your vehicle&apos;s value.
                  </p>
                </div>

                <ul className="space-y-1 list-none">
                  <li>
                    <BulletRow>
                      <strong>Scratch, Chip &amp; Dent Repair:</strong> Master-level reconditioning
                      for everyday road-borne impacts.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Eliminate Insurance Claims:</strong> Avoid the deductibles and premium
                      hikes of minor dollar repairs.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>Shield Your CARFAX:</strong> Keep cosmetic reconditioning off
                      permanent history reports.
                    </BulletRow>
                  </li>
                  <li>
                    <BulletRow>
                      <strong>We Come to You:</strong> Elite mobile service—professional repairs at
                      your home or office.
                    </BulletRow>
                  </li>
                </ul>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                    <Truck size={24} className="text-blue-500 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        Total Mobility
                      </h4>
                      <p className="text-[9px] text-white/40 leading-tight mt-1">
                        Professional on-site service at your convenience.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                    <FileWarning
                      size={24}
                      className="text-blue-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        Equity Defense
                      </h4>
                      <p className="text-[9px] text-white/40 leading-tight mt-1">
                        Preserve resale status with cleaner history reports.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video shadow-2xl max-h-[34vh]">
                <img
                  src={images[11]}
                  alt="Evernew Digital Reconditioning"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="mt-4 bg-blue-600/10 border-l-4 border-blue-600 p-3 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between gap-6">
              <p className="text-xs lg:text-sm text-white/90 font-light italic max-w-2xl">
                &quot;Evernew helps keep your Lexus in a perpetual state of
                &apos;newness&apos;—preserving factory paint integrity and peak trade-in equity for
                the long haul.&quot;
              </p>
              <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest border-l border-white/10 pl-6 shrink-0">
                <ShieldCheck size={16} aria-hidden="true" />
                Covered for 5 Years
              </div>
            </div>
          </div>
        </div>

        {/* Slide 12: Conclusion */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col bg-black px-8 md:px-10 lg:px-16 py-10 md:py-12 lg:py-16 relative"
          id="rs12"
        >
          <div
            className={`m-auto text-center max-w-5xl z-10 transition-all duration-1000 ${activeSlide === 12 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <h2 className="text-4xl lg:text-6xl font-bold text-blue-500 uppercase tracking-widest mb-6">
              Empowering Ownership
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-white/55 mb-10 font-light leading-relaxed max-w-3xl mx-auto">
              Based on your driving habits, we have organized our protection into three tailored
              tiers.
            </p>

            <div className="grid grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: <Crown size={32} />,
                  label: "ELITE",
                  desc: "Total regional immunity & max trade-in equity.",
                },
                {
                  icon: <Gem size={32} />,
                  label: "PLATINUM",
                  desc: "Complete appearance shield defense.",
                },
                {
                  icon: <ShieldAlert size={32} />,
                  label: "GOLD",
                  desc: "Essential Choice for Primary Needs.",
                },
              ].map((tier, i) => (
                <div
                  key={i}
                  className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl group hover:border-blue-500/50 transition-all duration-700 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="text-blue-500 mb-6 flex justify-center group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                    {tier.icon}
                  </div>
                  <div className="font-bold text-xl lg:text-2xl mb-2 tracking-widest">
                    {tier.label}
                  </div>
                  <p className="text-xs text-white/35 uppercase tracking-[0.16em] font-bold leading-snug">
                    {tier.desc}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={onComplete}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-base uppercase tracking-[0.25em] px-12 py-6 rounded-full shadow-[0_20px_60px_rgba(0,145,255,0.4)] transition-all duration-500 hover:scale-105 group"
            >
              {reviewCtaName ? (
                <span className="inline-flex flex-col items-center">
                  <span>REVIEW PERSONALIZED OPTIONS FOR</span>
                  <span className="mt-2 text-white/90">{reviewCtaName}</span>
                </span>
              ) : (
                "Review Package Options"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ValuePresentation };
export default ValuePresentation;
