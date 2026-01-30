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
  Layers,
  Waves,
  Truck,
  FileWarning,
  ShieldCheck,
  CircleDollarSign,
  TrendingDown,
  ShieldX,
  Settings,
  HeartPulse,
  Wrench,
  MapPin,
  Activity,
  Gauge,
  Microscope,
  Anchor,
  ThermometerSun,
  Droplets,
  Sparkles,
  CheckCircle2,
  FlaskConical,
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
const ExecutiveBulletRow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-3 text-white/70 font-light leading-snug">
    <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
    <div className="text-sm lg:text-base leading-relaxed">{children}</div>
  </div>
);

const SlidePhoto = ({
  src,
  alt,
  className,
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}) => (
  <div
    className={`relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/30 ${
      className ?? "aspect-video max-h-[40vh]"
    }`}
  >
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover object-center"
      draggable={false}
    />
    {children}
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

  const handleClearCustomerInfo = () => {
    onSaveCustomerInfo?.({ name: "", year: "", make: "", model: "" });
  };

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
      <div className="fixed inset-x-0 bottom-0 z-[10000] pointer-events-none">
        <div className="pointer-events-auto mx-auto w-full max-w-screen-2xl px-4 md:px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/30 backdrop-blur-2xl border border-white/10 shadow-2xl px-3 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onComplete}
                aria-label="Back to menu"
                title="Back to menu"
                className="min-h-[44px] px-4 rounded-xl bg-blue-600/25 hover:bg-blue-600/40 transition-all border border-blue-400/20 flex items-center gap-2"
              >
                <PresentationBoardIcon className="w-[18px] h-[18px] text-white" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-white">
                  Menu
                </span>
              </button>

              <div className="text-xs sm:text-sm font-bold uppercase tracking-[0.22em] text-white/70 truncate">
                Slide {currentSlide} / {totalSlides}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollToSlide(1)}
                aria-label="Go to first slide"
                title="Go to first slide"
                className="p-3 rounded-full bg-white/5 hover:bg-blue-600 transition-all backdrop-blur-2xl border border-white/10"
              >
                <Home size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollToSlide(currentSlide - 1)}
                aria-label="Previous slide"
                title="Previous slide"
                className="p-3 rounded-full bg-white/5 hover:bg-blue-600 transition-all backdrop-blur-2xl border border-white/10"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollToSlide(currentSlide + 1)}
                aria-label="Next slide"
                title="Next slide"
                className="p-3 rounded-full bg-white/5 hover:bg-blue-600 transition-all backdrop-blur-2xl border border-white/10"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
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
              {(preparedForName || preparedForVehicle) && (
                <button
                  type="button"
                  onClick={handleClearCustomerInfo}
                  aria-label="Clear prepared for name and vehicle"
                  title="Clear"
                  className="min-h-[32px] px-3 rounded-full bg-white/5 hover:bg-white/10 text-white/55 hover:text-white/80 transition text-[10px] font-black uppercase tracking-[0.25em] border border-white/10"
                >
                  Clear
                </button>
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
            <p className="text-blue-500 font-bold text-[10px] tracking-[0.4em] uppercase mb-6">
              2-Minute Protection Overview
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-[0.06em] lg:tracking-[0.08em] mb-5 leading-none">
              Protect
              <br />
              Your Lexus
            </h1>
            <div className="w-16 h-0.5 bg-blue-600 mx-auto opacity-50" />

            <div className="mt-8">
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-black">
                Prepared for
              </p>
              <p className="mt-2 text-lg lg:text-2xl text-white/80 font-light">
                {preparedForName || "__________"}
              </p>
              {preparedForVehicle ? (
                <p className="mt-2 text-sm lg:text-base text-white/45 font-light">
                  on their {preparedForVehicle}
                </p>
              ) : null}
            </div>

            <p className="mt-8 italic text-white/35 font-light text-lg">
              We'll focus on what real-world driving can do, and how to keep your Lexus looking new.
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
            {/* Header Section */}
            <span className="text-blue-500 font-bold text-[10px] tracking-[0.4em] block mb-2 uppercase">
              Factory Coverage
            </span>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
              <Zap size={12} className="text-white" aria-hidden="true" />
              WORLD-CLASS MECHANICAL ASSURANCE
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.06em] lg:tracking-[0.08em] mb-6 lg:mb-8 pb-6 border-b border-white/10 leading-none">
              The Lexus Manufacturer Warranties
            </h2>

            {/* Content Grid */}
            <div className="grid grid-cols-2 gap-10 lg:gap-12 items-center">
              <div className="space-y-6">
                <div>
                  <h3 className="text-white text-sm md:text-base font-black uppercase tracking-[0.18em] flex items-center gap-2">
                    <Settings size={18} className="text-blue-500" aria-hidden="true" />
                    Engineering Reliability
                  </h3>
                  <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed mt-2">
                    Your Lexus is built to the highest standards of automotive precision. The
                    factory coverage is designed to protect your investment against manufacturing
                    defects.
                  </p>
                  <ul className="space-y-2 list-none mt-4">
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Basic Warranty:</strong> 48 Months / 50,000 Miles covering most
                        non-wear vehicle components.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Powertrain Coverage:</strong> 72 Months / 70,000 Miles for Engine,
                        Transmission, and Drive systems.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Hybrid/EV Resilience:</strong> 10 Years / 150,000 Miles on
                        high-voltage battery components.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Corrosion Perforation:</strong> 72 Months / Unlimited Miles for
                        rust-through on original body panels.
                      </ExecutiveBulletRow>
                    </li>
                  </ul>
                </div>

                {/* Feature Callouts */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                    <Gauge size={24} className="text-blue-500 flex-shrink-0" aria-hidden="true" />
                    <div className="text-left">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        Performance Ops
                      </h4>
                      <p className="text-[9px] text-white/40 leading-tight mt-1">
                        Guaranteed mechanical operation across all drive systems.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                    <Activity
                      size={24}
                      className="text-blue-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div className="text-left">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        Technical Health
                      </h4>
                      <p className="text-[9px] text-white/40 leading-tight mt-1">
                        Lexus Master Technicians handle all warrantied repairs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <SlidePhoto src="/MENU1.png" alt="Menu slide" className="aspect-video max-h-[38vh]" />
            </div>

            {/* Footer/Warranty Callout */}
            <div className="mt-6 bg-blue-600/10 border-l-4 border-blue-600 p-4 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between gap-6">
              <p className="text-xs lg:text-sm text-white/90 font-light italic max-w-2xl">
                "Your factory warranty provides the essential mechanical security of a Lexus,
                ensuring that your vehicle remains technically flawless through its initial years of
                service."
              </p>
              <div className="flex items-center gap-3 text-blue-400 font-black text-xs uppercase tracking-[0.2em] border-l border-white/10 pl-8 shrink-0">
                <ShieldCheck size={16} aria-hidden="true" />
                COMPREHENSIVE FACTORY BACKING
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
            {/* Header Section */}
            <span className="text-blue-500 font-bold text-[10px] tracking-[0.4em] block mb-2 uppercase">
              The Priority Advantage
            </span>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
              <Zap size={12} className="text-white" aria-hidden="true" />
              EXCLUSIVE LIFETIME COMMITMENT
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.06em] lg:tracking-[0.08em] mb-6 lg:mb-8 pb-6 border-b border-white/10 leading-none">
              Priorities For Life
            </h2>

            {/* Content Grid */}
            <div className="grid grid-cols-2 gap-10 lg:gap-12 items-center">
              <div className="space-y-6">
                <div>
                  <h3 className="text-white text-sm md:text-base font-black uppercase tracking-[0.18em] flex items-center gap-2">
                    <HeartPulse size={18} className="text-blue-500" aria-hidden="true" />
                    Ownership Vitality
                  </h3>
                  <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed mt-2">
                    We believe the Lexus experience should be seamless for as long as you own your
                    vehicle. Priorities For Life ensures your mechanical and safety needs are
                    covered permanently.
                  </p>
                  <ul className="space-y-2 list-none mt-4">
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Engine For Life:</strong> Guaranteed lifetime coverage on all
                        internal lubricated engine components.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Oil & Filter Changes:</strong> Complimentary maintenance for the
                        entire duration of your ownership.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong>VA State Inspections:</strong> Annual safety inspections provided
                        on-site at no additional cost.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Towing For Life:</strong> Within a 50-mile radius of any Priority
                        dealership for total peace of mind.
                      </ExecutiveBulletRow>
                    </li>
                  </ul>
                </div>

                {/* Feature Callouts */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                    <Wrench size={24} className="text-blue-500 flex-shrink-0" aria-hidden="true" />
                    <div className="text-left">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        Maintenance Ops
                      </h4>
                      <p className="text-[9px] text-white/40 leading-tight mt-1">
                        Zero-cost routine service and filter replacements.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                    <MapPin size={24} className="text-blue-500 flex-shrink-0" aria-hidden="true" />
                    <div className="text-left">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        Regional Safety
                      </h4>
                      <p className="text-[9px] text-white/40 leading-tight mt-1">
                        Annual Virginia compliance and safety certification.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <SlidePhoto src="/MENU2.png" alt="Menu slide" className="aspect-video max-h-[38vh]" />
            </div>

            {/* Footer/Transition Callout */}
            <div className="mt-6 bg-blue-600/10 border-l-4 border-blue-600 p-4 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between gap-6">
              <p className="text-xs lg:text-sm text-white/90 font-light italic max-w-2xl">
                "Now that your mechanical maintenance is secured through the Priority Advantage,
                let's look at protecting your vehicle's aesthetic and structural integrity."
              </p>
              <div className="flex items-center gap-3 text-blue-400 font-black text-xs uppercase tracking-[0.2em] border-l border-white/10 pl-8 shrink-0">
                <ShieldCheck size={16} aria-hidden="true" />
                LIFETIME MAINTENANCE VALUE
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
            <span className="text-blue-500 font-bold text-[10px] tracking-[0.4em] block mb-2 uppercase">
              Asset Protection
            </span>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
              <Zap size={12} className="text-white" aria-hidden="true" />
              BRIDGING THE WARRANTY DEFICIT
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.06em] lg:tracking-[0.08em] mb-6 lg:mb-8 pb-6 border-b border-white/10 leading-none">
              Most Damage Isn't Mechanical
            </h2>

            <div className="grid grid-cols-2 gap-10 lg:gap-12 items-center">
              <div className="space-y-6">
                <div>
                  <h3 className="text-white text-sm md:text-base font-black uppercase tracking-[0.18em] flex items-center gap-2">
                    <TrendingDown size={18} className="text-blue-500" aria-hidden="true" />
                    The Coverage Reality
                  </h3>
                  <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed mt-2">
                    Lexus warranties protect against manufacturing defects—but most real-world
                    ownership pain comes from environmental exposure, road hazards, and interior
                    wear.
                  </p>
                  <ul className="space-y-2 list-none mt-4">
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Environmental Etching:</strong> Bird droppings, tree sap, and
                        industrial fallout can permanently damage clear coat.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Rock Chips:</strong> Highway debris causes impact points that lead
                        to paint failure and structural degradation.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Interior Wear:</strong> Accidental stains, tears, and burns directly
                        reduce your vehicle's trade-in equity.
                      </ExecutiveBulletRow>
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                    <ShieldX size={24} className="text-blue-500 flex-shrink-0" aria-hidden="true" />
                    <div className="text-left">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        Warranty Exclusion
                      </h4>
                      <p className="text-[9px] text-white/40 leading-tight mt-1">
                        Hazard damage is typically excluded from factory mechanical coverage.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center gap-4">
                    <CircleDollarSign
                      size={24}
                      className="text-blue-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div className="text-left">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        Equity Shield
                      </h4>
                      <p className="text-[9px] text-white/40 leading-tight mt-1">
                        Preserving the physical asset ensures maximum future resale value.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <SlidePhoto
                src="/menu11.png"
                alt="Bridging the Coverage Gap"
                className="aspect-video max-h-[38vh]"
              />
            </div>

            <div className="mt-8 bg-red-500/5 border-l-4 border-red-600 p-5 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between gap-6 border border-white/5">
              <div className="max-w-2xl">
                <p className="text-red-500 font-black text-[10px] uppercase mb-1.5 tracking-[0.25em]">
                  Coverage Reality
                </p>
                <p className="text-sm lg:text-base text-white/80 font-light italic leading-relaxed">
                  "These are typically considered appearance or environmental issues—not mechanical
                  defects. True peace of mind requires securing the gap between the two."
                </p>
              </div>
              <div className="flex items-center gap-3 text-red-500 font-black text-xs uppercase tracking-[0.2em] border-l border-white/10 pl-8 shrink-0">
                <ShieldAlert size={16} aria-hidden="true" />
                CLOSING THE COVERAGE GAP
              </div>
            </div>
          </div>
        </div>

        {/* Slide 5: Regional Science */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col px-8 md:px-10 lg:px-16 py-10 md:py-12 lg:py-16 relative overflow-hidden bg-[#0d0d0d] font-sans text-white"
          id="rs5"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 max-w-6xl mx-auto w-full ${activeSlide === 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <span className="text-blue-500 font-bold text-[10px] tracking-[0.4em] block mb-2 uppercase">
              Coastal Science
            </span>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-5 shadow-lg shadow-blue-900/40 w-fit uppercase">
              <Zap size={12} className="text-white" aria-hidden="true" />
              Electrochemical Degradation
            </div>
            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-[0.06em] lg:tracking-[0.08em] mb-8 pb-8 border-b border-white/10 text-white leading-none">
              The "Coastal Corrosion" Reality
            </h2>

            <div className="grid grid-cols-2 gap-12 items-start">
              <div className="self-start mt-2">
                <SlidePhoto
                  src="/MENU4.png"
                  alt="Coastal Environmental Threats"
                  className="aspect-video max-h-[38vh]"
                >
                  <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,145,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,145,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
                  <div className="absolute bottom-4 right-4 text-blue-500/40 pointer-events-none">
                    <Waves size={48} strokeWidth={1} aria-hidden="true" />
                  </div>
                </SlidePhoto>
              </div>

              <div className="space-y-6">
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-2xl shadow-inner text-left">
                  <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Atom size={16} aria-hidden="true" /> Electrochemical Facts
                  </h3>
                  <ul className="space-y-2 list-none">
                    <li>
                      <ExecutiveBulletRow>
                        <strong className="text-white">Salt Air:</strong> Particles suspended for
                        50+ miles inland, seeking paint pores.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong className="text-white">Magnesium Chloride:</strong> Road brines are{" "}
                        <strong>10x more corrosive</strong> than traditional salt.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong className="text-white">Humid Catalyst:</strong> Coastal humidity
                        accelerates oxidation speed on raw metal.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong className="text-white">Industrial Fallout:</strong> Port soot and
                        heavy minerals cause aggressive clarity etching.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong className="text-white">Well Water:</strong> Regional mineral content
                        causes permanent mineral "water spots."
                      </ExecutiveBulletRow>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 lg:mt-12 bg-red-500/5 border-l-4 border-red-600 p-5 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between border border-white/5">
              <div className="max-w-3xl text-left">
                <p className="text-red-500 font-black text-[10px] uppercase mb-1.5 tracking-[0.25em]">
                  Factory Warranty Gap
                </p>
                <p className="text-sm lg:text-base text-white/80 font-light italic leading-relaxed">
                  "Standard warranties typically do <strong>not</strong> cover environmental
                  etching, salt-air corrosion, or highway rock chips. These are hazards of the
                  environment—not manufacturing defects."
                </p>
              </div>
              <div className="flex items-center gap-3 text-red-500 font-black text-xs uppercase tracking-[0.2em] border-l border-white/10 pl-8 shrink-0">
                <ShieldAlert size={18} aria-hidden="true" /> Defining the Deficit
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
            <span className="text-blue-500 font-bold text-[10px] tracking-[0.4em] block mb-2 uppercase">
              Structural Integrity Shield
            </span>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
              <Zap size={12} className="text-white" aria-hidden="true" />
              CORROSION NEUTRALIZATION TECH
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.06em] lg:tracking-[0.08em] mb-6 lg:mb-8 pb-6 border-b border-white/10 leading-none">
              RustGuard Pro: Foundation Defense
            </h2>

            <div className="grid grid-cols-2 gap-10 lg:gap-12 items-center">
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

                <ul className="space-y-2 list-none">
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Salt Air Neutralization:</strong> Active inhibitors stop salt
                      particles from bonding to raw chassis steel.
                    </ExecutiveBulletRow>
                  </li>
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Magnesium Chloride Defense:</strong> High-density shield against
                      aggressive winter road brines.
                    </ExecutiveBulletRow>
                  </li>
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Structural Security:</strong> Prevents the &quot;rust-freezing&quot;
                      of critical suspension and braking components.
                    </ExecutiveBulletRow>
                  </li>
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Hidden Cavity Protection:</strong> Crevice-penetrating formula reaches
                      inner panels where moisture collects.
                    </ExecutiveBulletRow>
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

              <SlidePhoto src="/MENU8.png" alt="Menu slide" className="aspect-video max-h-[38vh]" />
            </div>

            <div className="mt-6 bg-blue-600/10 border-l-4 border-blue-600 p-4 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between gap-6">
              <p className="text-xs lg:text-sm text-white/90 font-light italic max-w-2xl">
                &quot;By protecting the structural foundation of your Lexus, RustGuard ensures your
                vehicle remains safe, silent, and structurally sound for the life of your
                ownership.&quot;
              </p>
              <div className="flex items-center gap-3 text-blue-400 font-black text-xs uppercase tracking-[0.2em] border-l border-white/10 pl-8 shrink-0">
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
            <span className="text-blue-500 font-bold text-[10px] tracking-[0.4em] block mb-2 uppercase text-left">
              Advanced Surface Science
            </span>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-5 shadow-lg shadow-blue-900/40 w-fit uppercase text-white">
              <Zap size={12} className="text-white" aria-hidden="true" />
              Nano-Ceramic Molecular Barrier
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.06em] lg:tracking-[0.08em] mb-6 pb-6 border-b border-white/10 text-white text-left leading-none">
              ToughGuard: Foundation Protection
            </h2>

            <div className="grid grid-cols-2 gap-10 lg:gap-12 items-start">
              <div className="space-y-6">
                <div>
                  <h3 className="text-white text-xs font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-left">
                    <Layers size={18} className="text-blue-500" aria-hidden="true" />
                    Molecular Hardening
                  </h3>
                  <p className="text-sm lg:text-base text-white/60 font-light leading-relaxed mb-4 text-left max-w-xl">
                    Modern clear coats are naturally porous.{" "}
                    <strong className="text-white">ToughGuard Premium</strong> creates a permanent
                    chemical bond that seals those pores for good, creating a high-gloss shield that
                    becomes an extension of your Lexus.
                  </p>
                  <ul className="space-y-2 list-none">
                    <li>
                      <ExecutiveBulletRow>
                        <strong className="text-white">One-Time Application:</strong> Eliminates the
                        need for annual waxing, buffing, or polishing.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong className="text-white">Environmental Shield:</strong> Complete
                        defense against bird droppings, tree sap, and industrial fallout.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong className="text-white">Climate Barrier:</strong> Blocks UV rays,
                        road salt, and acid rain from reaching the paint.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong className="text-white">The Finish:</strong> Provides a deep,
                        permanent <span className="text-blue-400">"Liquid-Glass"</span> showroom
                        shine.
                      </ExecutiveBulletRow>
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.03] border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-start gap-4">
                    <FlaskConical
                      size={20}
                      className="text-blue-500 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="text-left">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-1">
                        Chemical Resistance
                      </h4>
                      <p className="text-[10px] text-white/40 leading-snug">
                        Industrial-grade resilience against airborne minerals and insects.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-start gap-4">
                    <Droplets
                      size={20}
                      className="text-blue-500 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="text-left">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-1">
                        Self-Cleaning
                      </h4>
                      <p className="text-[10px] text-white/40 leading-snug">
                        Advanced surface tension allows contaminants to wash away with ease.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <SlidePhoto
                src="/MENU5.png"
                alt="ToughGuard Surface Protection"
                className="aspect-video max-h-[38vh] rounded-2xl"
              >
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,145,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,145,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute bottom-4 right-4 text-blue-500/40">
                  <Sparkles size={48} strokeWidth={1} aria-hidden="true" />
                </div>
              </SlidePhoto>
            </div>

            <div className="mt-6 bg-blue-600/10 border-l-4 border-blue-600 p-4 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between border border-white/5 gap-6">
              <div className="max-w-3xl text-left">
                <p className="text-blue-400 font-black text-[10px] uppercase mb-1 tracking-[0.25em]">
                  The Appearance Solution
                </p>
                <p className="text-sm lg:text-base text-white/80 font-light italic leading-relaxed">
                  &quot;By sealing the paint pores and neutralizing environmental catalysts,
                  ToughGuard ensures your Lexus remains aesthetically flawless for life.&quot;
                </p>
              </div>
              <div className="flex items-center gap-3 text-blue-400 font-black text-xs uppercase tracking-[0.2em] border-l border-white/10 pl-8 shrink-0">
                <CheckCircle2 size={18} aria-hidden="true" />
                LIFETIME AESTHETIC WARRANTY
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
            <span className="text-blue-500 font-bold text-[10px] tracking-[0.4em] block mb-2 uppercase">
              Signature Interior Defense
            </span>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
              <Zap size={12} className="text-white" aria-hidden="true" />
              NANO-CERAMIC TEXTILE SHIELD
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.06em] lg:tracking-[0.08em] mb-6 lg:mb-8 pb-6 border-b border-white/10 leading-none">
              InteriorGuard: Cabin Preservation
            </h2>

            <div className="grid grid-cols-2 gap-10 lg:gap-12 items-center">
              <div className="space-y-4">
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

                <ul className="space-y-2 list-none">
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Stain Hydrophobicity:</strong> Immediate repulsion of water and
                      oil-based spills (coffee, soda, and food dye).
                    </ExecutiveBulletRow>
                  </li>
                  <li>
                    <ExecutiveBulletRow>
                      <strong>UV Inhibition:</strong> Prevents leather cracking and vinyl
                      discoloration from intense coastal solar heat.
                    </ExecutiveBulletRow>
                  </li>
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Antimicrobial Shield:</strong> Inhibits the growth of bacteria, mold,
                      and mildew within deep seat fibers.
                    </ExecutiveBulletRow>
                  </li>
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Material Conditioning:</strong> Maintains the soft, supple factory
                      feel of NuLuxe and Semi-Aniline leathers.
                    </ExecutiveBulletRow>
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

              <SlidePhoto src="/MENU7.png" alt="Menu slide" className="aspect-video max-h-[38vh]" />
            </div>

            <div className="mt-6 bg-blue-600/10 border-l-4 border-blue-600 p-4 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between gap-6">
              <p className="text-xs lg:text-sm text-white/90 font-light italic max-w-2xl">
                &quot;By sealing your vehicle&apos;s most intimate surfaces, InteriorGuard ensures
                your Lexus remains as inviting and vibrant as the day you first sat in the
                driver&apos;s seat.&quot;
              </p>
              <div className="flex items-center gap-3 text-blue-400 font-black text-xs uppercase tracking-[0.2em] border-l border-white/10 pl-8 shrink-0">
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
            <span className="text-blue-500 font-bold text-[10px] tracking-[0.4em] block mb-2 uppercase">
              Structural Glass Defense
            </span>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
              <Zap size={12} className="text-white" aria-hidden="true" />
              NANO-MOLECULAR BONDING
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.06em] lg:tracking-[0.08em] mb-6 lg:mb-8 pb-6 border-b border-white/10 leading-none">
              Diamond Shield: Windshield Protection
            </h2>

            <div className="grid grid-cols-2 gap-10 lg:gap-12 items-center">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-white text-sm md:text-base font-black uppercase tracking-[0.18em]">
                    Liquid-Glass Resilience
                  </h3>
                  <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed">
                    Diamond Shield uses an advanced polymer to seal microscopic pores, creating a
                    smooth, high-tension surface that deflects impacts.
                  </p>
                </div>

                <ul className="space-y-2 list-none">
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Impact Resistance:</strong> Reduces the likelihood of rock chips and
                      spider-web cracks.
                    </ExecutiveBulletRow>
                  </li>
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Pitting &amp; Sand-Clouding:</strong> Defends against coastal
                      &quot;sand-blasting&quot; at highway speeds.
                    </ExecutiveBulletRow>
                  </li>
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Hydrophobic Clarity:</strong> Sheds water, snow, and ice for improved
                      foul-weather visibility.
                    </ExecutiveBulletRow>
                  </li>
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Optically Clear:</strong> Enhances night-driving clarity by reducing
                      glare and refraction.
                    </ExecutiveBulletRow>
                  </li>
                </ul>
              </div>

              <SlidePhoto
                src="/MENU10.png"
                alt="Menu slide"
                className="aspect-video max-h-[38vh]"
              />
            </div>

            <div className="mt-6 bg-blue-600/10 border-l-4 border-blue-600 p-4 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between gap-6">
              <p className="text-xs lg:text-sm text-white/90 font-light italic max-w-2xl">
                &quot;Diamond Shield strengthens the structural integrity of your glass while
                providing a self-cleaning surface that preserves your visibility and your
                vehicle&apos;s clean history.&quot;
              </p>
              <div className="flex items-center gap-3 text-blue-400 font-black text-xs uppercase tracking-[0.2em] border-l border-white/10 pl-8 shrink-0">
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
              <span className="text-blue-500 font-bold text-[10px] tracking-[0.4em] block mb-2 uppercase">
                Advanced Ballistic Shield
              </span>
              <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
                <Zap size={12} className="text-white" aria-hidden="true" />
                8-MIL OPTICAL POLYURETHANE
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.06em] lg:tracking-[0.08em] mb-6 lg:mb-8 pb-6 border-b border-white/10 leading-none">
                Highway Hazards: Suntek Film
              </h2>

              <div className="grid grid-cols-2 gap-10 lg:gap-12 items-center">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-white text-sm md:text-base font-black uppercase tracking-[0.18em]">
                      Kinetic Impact Defense
                    </h3>
                    <p className="text-base md:text-base lg:text-xl text-white/80 font-light leading-relaxed">
                      I-264 construction and coastal sand effectively &apos;sand-blast&apos; your
                      front-end at highway speeds. Suntek Ultra provides a sacrificial barrier that
                      absorbs high-velocity impacts.
                    </p>
                  </div>

                  <ul className="space-y-2 list-none">
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Rock Chip Immunity:</strong> 8-mil invisible physical barrier stops
                        gravel and road debris from reaching the paint.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Self-Healing Technology:</strong> Specialized top-coat allows minor
                        surface scratches to disappear with ambient solar heat.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Stain Resistance:</strong> Hydrophobic properties repel bird
                        droppings, insects, and road grime to prevent etching.
                      </ExecutiveBulletRow>
                    </li>
                    <li>
                      <ExecutiveBulletRow>
                        <strong>Total Coverage:</strong> Precision-cut focus on high-impact areas:
                        Hood, Bumpers, Mirrors, and Door Cups.
                      </ExecutiveBulletRow>
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

                <SlidePhoto
                  src="/MENU6.png"
                  alt="Menu slide"
                  className="aspect-video max-h-[38vh]"
                />
              </div>

              <div className="mt-6 bg-blue-600/10 border-l-4 border-blue-600 p-4 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between gap-6">
                <p className="text-xs lg:text-sm text-white/90 font-light italic max-w-2xl">
                  &quot;Suntek Ultra ensures your Lexus front-end remains in showroom condition,
                  effectively neutralizing the abrasive reality of regional highway travel.&quot;
                </p>
                <div className="flex items-center gap-3 text-blue-400 font-black text-xs uppercase tracking-[0.2em] border-l border-white/10 pl-8 shrink-0">
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
            <span className="text-blue-500 font-bold text-[10px] tracking-[0.4em] block mb-2 uppercase">
              Premium Aesthetic Restoration
            </span>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
              <Zap size={12} className="text-white" aria-hidden="true" />
              HIGH-LINE PRECISION SCANNING
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.06em] lg:tracking-[0.08em] mb-6 lg:mb-8 pb-6 border-b border-white/10 leading-none">
              Evernew: Appearance Protection
            </h2>

            <div className="grid grid-cols-2 gap-10 lg:gap-12 items-center">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-white text-sm md:text-base font-black uppercase tracking-[0.18em]">
                    Digital Reconditioning
                  </h3>
                  <p className="text-base md:text-lg lg:text-xl text-white/80 font-light leading-relaxed">
                    Evernew uses high-precision scanning to identify and neutralize surface
                    imperfections before they compromise your vehicle&apos;s value.
                  </p>
                </div>

                <ul className="space-y-2 list-none">
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Scratch, Chip &amp; Dent Repair:</strong> Master-level reconditioning
                      for everyday road-borne impacts.
                    </ExecutiveBulletRow>
                  </li>
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Eliminate Insurance Claims:</strong> Avoid the deductibles and premium
                      hikes of minor dollar repairs.
                    </ExecutiveBulletRow>
                  </li>
                  <li>
                    <ExecutiveBulletRow>
                      <strong>Shield Your CARFAX:</strong> Keep cosmetic reconditioning off
                      permanent history reports.
                    </ExecutiveBulletRow>
                  </li>
                  <li>
                    <ExecutiveBulletRow>
                      <strong>We Come to You:</strong> Elite mobile service—professional repairs at
                      your home or office.
                    </ExecutiveBulletRow>
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

              <SlidePhoto src="/MENU9.png" alt="Menu slide" className="aspect-video max-h-[38vh]" />
            </div>

            <div className="mt-6 bg-blue-600/10 border-l-4 border-blue-600 p-4 rounded-r-xl backdrop-blur-xl shadow-lg flex items-center justify-between gap-6">
              <p className="text-xs lg:text-sm text-white/90 font-light italic max-w-2xl">
                &quot;Evernew helps keep your Lexus in a perpetual state of
                &apos;newness&apos;—preserving factory paint integrity and peak trade-in equity for
                the long haul.&quot;
              </p>
              <div className="flex items-center gap-3 text-blue-400 font-black text-xs uppercase tracking-[0.2em] border-l border-white/10 pl-8 shrink-0">
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
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-blue-500 uppercase tracking-[0.06em] lg:tracking-[0.08em] mb-6 leading-none">
              Choose Your Protection
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-white/65 mb-10 font-light leading-relaxed max-w-3xl mx-auto">
              Pick the coverage level that matches how you drive, then we'll review the exact options
              for your vehicle.
            </p>

            <div className="grid grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: <Crown size={32} />,
                  label: "ELITE",
                  desc: "Maximum protection + maximum trade-in confidence.",
                },
                {
                  icon: <Gem size={32} />,
                  label: "PLATINUM",
                  desc: "Most popular: strong protection for daily driving.",
                },
                {
                  icon: <ShieldAlert size={32} />,
                  label: "GOLD",
                  desc: "Essential coverage for the biggest risks.",
                },
              ].map((tier, i) => (
                <div
                  key={i}
                  className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl group hover:border-blue-500/50 transition-all duration-700 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="text-blue-500 mb-6 flex justify-center group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                    {tier.icon}
                  </div>
                  <div className="font-black text-lg lg:text-xl mb-2 tracking-[0.25em] uppercase">
                    {tier.label}
                  </div>
                  <p className="text-xs text-white/45 uppercase tracking-[0.16em] font-bold leading-snug">
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
