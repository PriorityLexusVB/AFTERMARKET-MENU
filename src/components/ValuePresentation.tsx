import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Home, Crown, Gem, ShieldAlert, Atom } from "lucide-react";

interface ValuePresentationProps {
  onComplete: () => void;
}

/**
 * Technical Restoration: Standardized Bullet Component
 * Ensures 100% UI consistency and vertical alignment for iPad displays.
 */
const BulletItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-white/70 font-light leading-snug mb-1.5">
    <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_10px_rgba(37,99,235,0.6)]" />
    <div className="text-sm lg:text-base">{children}</div>
  </li>
);

const ValuePresentation: React.FC<ValuePresentationProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 10;
  const [activeSlide, setActiveSlide] = useState(1);

  // Mapping for locally saved PNG files in your /public folder
  const images: Record<number, string> = {
    2: "/MENU1.png",
    3: "/MENU2.png",
    4: "/MENU3.png",
    5: "/MENU4.png",
    6: "/MENU5.png",
    7: "/MENU6.png",
    8: "/MENU7.png",
    9: "/MENU8.png",
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

  const scrollToSlide = (index: number) => {
    if (index < 1 || index > totalSlides) return;
    document.getElementById(`rs${index}`)?.scrollIntoView({ behavior: "smooth" });
  };

  const progress = ((currentSlide - 1) / (totalSlides - 1)) * 100;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0d0d0d] overflow-hidden text-white font-sans selection:bg-blue-500/30">
      {/* Premium Executive Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[4px] bg-white/5 z-[10000]">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700 shadow-[0_0_15px_rgba(0,145,255,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navigation Controls */}
      <div className="fixed bottom-6 right-8 flex gap-3 z-[10000]">
        <button
          onClick={() => scrollToSlide(1)}
          className="p-3 rounded-full bg-white/5 hover:bg-blue-600 transition-all backdrop-blur-2xl border border-white/10 shadow-2xl"
        >
          <Home size={18} />
        </button>
        <button
          onClick={() => scrollToSlide(currentSlide - 1)}
          className="p-3 rounded-full bg-white/5 hover:bg-blue-600 transition-all backdrop-blur-2xl border border-white/10 shadow-2xl"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => scrollToSlide(currentSlide + 1)}
          className="p-3 rounded-full bg-white/5 hover:bg-blue-600 transition-all backdrop-blur-2xl border border-white/10 shadow-2xl"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="h-screen overflow-y-auto snap-y snap-mandatory scrollbar-none scroll-smooth overscroll-contain">
        {/* Slide 1: Welcome */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col p-10 lg:p-16 relative overflow-hidden"
          id="rs1"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(0,145,255,0.05)_0%,transparent_50%)]" />
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
            <p className="mt-8 italic text-white/30 font-light text-lg">
              A value overview for the 2025 Lexus Ownership Experience
            </p>
          </div>
          <div className="absolute bottom-8 left-10 text-[10px] uppercase tracking-[0.5em] text-white/20 font-bold">
            Priority Lexus x Commodore Coatings
          </div>
        </div>

        {/* Slide 2: Factory Warranty */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col p-10 lg:p-16 relative"
          id="rs2"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 ${activeSlide === 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.3em] block mb-2 uppercase">
              Factory Coverage
            </span>
            <h2 className="text-2xl lg:text-4xl font-bold uppercase tracking-wider mb-6 pb-4 border-b border-white/10">
              Lexus Manufacturer Warranties
            </h2>
            <div className="grid grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <p className="text-base lg:text-xl text-white/80 font-light leading-relaxed">
                  Your new Lexus comes with world-class mechanical protection designed to cover
                  manufacturing defects:
                </p>
                <ul className="space-y-1">
                  <BulletItem>
                    <strong>Basic Warranty:</strong> 48 months / 50,000 miles covering components
                    other than normal wear.
                  </BulletItem>
                  <BulletItem>
                    <strong>Powertrain:</strong> 72 months / 70,000 miles for engine, transmission,
                    and drive systems.
                  </BulletItem>
                  <BulletItem>
                    <strong>Hybrid/EV:</strong> Up to 10 years / 150,000 miles for the hybrid
                    battery components.
                  </BulletItem>
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
          className="slide-container h-screen w-screen snap-start flex flex-col p-10 lg:p-16 relative"
          id="rs3"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 ${activeSlide === 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.3em] block mb-2 uppercase">
              The Priority Advantage
            </span>
            <h2 className="text-2xl lg:text-4xl font-bold uppercase tracking-wider mb-6 pb-4 border-b border-white/10">
              Priorities For Life
            </h2>
            <div className="grid grid-cols-2 gap-10 items-center">
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video shadow-2xl max-h-[40vh]">
                <img src={images[3]} alt="Service" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4">
                <p className="text-base lg:text-xl text-white/80 font-light leading-relaxed">
                  We’ve ensured your vehicle’s mechanical health and maintenance are handled for the
                  long haul:
                </p>
                <ul className="space-y-1">
                  <BulletItem>
                    <strong>Engine For Life:</strong> Lifetime coverage on engine components.
                  </BulletItem>
                  <BulletItem>
                    <strong>Oil & Filter Changes:</strong> Provided for as long as you own your
                    vehicle.
                  </BulletItem>
                  <BulletItem>
                    <strong>VA State Inspections:</strong> Annual safety inspections covered for
                    life.
                  </BulletItem>
                  <BulletItem>
                    <strong>Towing For Life:</strong> Within a 50-mile radius of any Priority
                    dealership.
                  </BulletItem>
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
          className="slide-container h-screen w-screen snap-start flex flex-col p-10 lg:p-16 relative"
          id="rs4"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 ${
              activeSlide === 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.3em] block mb-2 uppercase">
              The Gap
            </span>
            <h2 className="text-2xl lg:text-4xl font-bold uppercase tracking-wider mb-6 pb-4 border-b border-white/10">
              Appearance Damage Isn’t Mechanical
            </h2>
            <div className="grid grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <p className="text-base lg:text-xl text-white/80 font-light leading-relaxed">
                  Lexus warranties protect manufacturing defects — but most real-world ownership
                  pain comes from environmental exposure, road hazards, and interior wear.
                </p>
                <ul className="space-y-1">
                  <BulletItem>
                    <strong>Environmental Etching:</strong> Bird droppings, tree sap, and industrial
                    fallout can permanently damage clear coat.
                  </BulletItem>
                  <BulletItem>
                    <strong>Rock Chips:</strong> Highway debris causes impact points that lead to
                    paint failure.
                  </BulletItem>
                  <BulletItem>
                    <strong>Interior Wear:</strong> Stains, tears, and burns directly reduce
                    trade-in equity.
                  </BulletItem>
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
          className="slide-container h-screen w-screen snap-start flex flex-col p-10 lg:p-16 relative"
          id="rs5"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 ${activeSlide === 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.3em] block mb-2 uppercase">
              Coastal Science
            </span>
            <h2 className="text-2xl lg:text-4xl font-bold uppercase tracking-wider mb-4 pb-4 border-b border-white/10">
              The "Coastal Corrosion" Reality
            </h2>
            <div className="grid grid-cols-2 gap-10 items-start">
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
                  <ul className="space-y-1">
                    <BulletItem>
                      <strong>Salt Air:</strong> Particles suspended for 50+ miles, seeking paint
                      pores.
                    </BulletItem>
                    <BulletItem>
                      <strong>Magnesium Chloride:</strong> Road brines are{" "}
                      <strong>10x more corrosive</strong> than salt.
                    </BulletItem>
                    <BulletItem>
                      <strong>Humid Catalyst:</strong> Coastal humidity accelerates oxidation speed
                      on raw metal.
                    </BulletItem>
                    <BulletItem>
                      <strong>Industrial Fallout:</strong> Industrial port soot creates aggressive
                      clarity etching.
                    </BulletItem>
                    <BulletItem>
                      <strong>Well Water:</strong> Regional mineral content causes permanent mineral
                      "water spots."
                    </BulletItem>
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

        {/* Slide 6: ToughGuard */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col p-10 lg:p-16 relative"
          id="rs6"
        >
          <div
            className={`my-auto z-10 transition-all duration-1000 ${activeSlide === 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <span className="text-blue-500 font-bold text-xs tracking-[0.4em] block mb-2 uppercase">
              Exterior Protection
            </span>
            <div className="inline-block bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
              5-YEAR SURFACE GUARANTEE
            </div>
            <h2 className="text-2xl lg:text-4xl font-bold uppercase tracking-wider mb-6 pb-4 border-b border-white/10">
              ToughGuard: The Clear Coat Shield
            </h2>
            <div className="grid grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <p className="text-base lg:text-xl text-white/80 font-light leading-relaxed">
                  Modern clear coats are porous. ToughGuard Premium creates a permanent chemical
                  bond that seals those pores for good.
                </p>
                <ul className="space-y-1">
                  <BulletItem>
                    <strong>One-Time Application:</strong> No more annual waxing or polishing.
                  </BulletItem>
                  <BulletItem>
                    <strong>Environmental Shield:</strong> Covers damage from bird droppings, tree
                    sap, and fallout.
                  </BulletItem>
                  <BulletItem>
                    <strong>The Finish:</strong> A deep, permanent "Liquid-Glass" shine.
                  </BulletItem>
                </ul>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video shadow-2xl max-h-[38vh]">
                <img src={images[6]} alt="ToughGuard" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Slides 7-9: Additional Protection Categories */}
        {[7, 8, 9].map((num) => (
          <div
            key={num}
            className="slide-container h-screen w-screen snap-start flex flex-col p-10 lg:p-16 relative"
            id={`rs${num}`}
          >
            <div
              className={`my-auto z-10 transition-all duration-1000 ${
                activeSlide === num ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            >
              <span className="text-blue-500 font-bold text-xs tracking-[0.4em] block mb-2 uppercase">
                {num === 7
                  ? "Impact Protection"
                  : num === 8
                    ? "Life Proofing"
                    : "Structural Protection"}
              </span>
              <div className="inline-block bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 shadow-lg shadow-blue-900/40">
                {num === 7
                  ? "10-YEAR SUNTEK WARRANTY"
                  : num === 8
                    ? "INTERIOR & GLASS GUARANTEE"
                    : "LIFETIME RUST COVERAGE"}
              </div>
              <h2 className="text-2xl lg:text-4xl font-bold uppercase tracking-wider mb-6 pb-4 border-b border-white/10">
                {num === 7
                  ? "Highway Hazards: Suntek Film"
                  : num === 8
                    ? "Shielding the Cabin"
                    : "RustGuard Pro: Foundation"}
              </h2>
              <div className="grid grid-cols-2 gap-10 items-center">
                <div className={`${num % 2 === 0 ? "order-1" : "order-2"} space-y-4`}>
                  <p className="text-base lg:text-xl text-white/80 font-light leading-relaxed">
                    {num === 7
                      ? "I-264 construction and coastal sand effectively 'sand-blast' your front-end at highway speeds."
                      : num === 8
                        ? "Luxury interiors require luxury protection. We focus on the moments that hurt your trade-in value."
                        : "In our coastal region, the most dangerous damage is the kind you can't see. Stop corrosion before it starts."}
                  </p>
                  <ul className="space-y-1">
                    {num === 7 && (
                      <>
                        <BulletItem>
                          <strong>Rock Chip Immunity:</strong> Invisible barrier stops gravel
                          impacts.
                        </BulletItem>
                        <BulletItem>
                          <strong>Self-Healing:</strong> Minor scratches disappear with heat.
                        </BulletItem>
                        <BulletItem>
                          <strong>Total Coverage:</strong> Focused protection on high-impact zones.
                        </BulletItem>
                      </>
                    )}
                    {num === 8 && (
                      <>
                        <BulletItem>
                          <strong>Stain Resistance:</strong> Coverage for coffee, juices, and daily
                          spills.
                        </BulletItem>
                        <BulletItem>
                          <strong>Accidental Coverage:</strong> Protection for rips, tears, and
                          burns.
                        </BulletItem>
                        <BulletItem>
                          <strong>Diamond Shield:</strong> Helps reduce glass pitting and
                          sand-clouding.
                        </BulletItem>
                      </>
                    )}
                    {num === 9 && (
                      <>
                        <BulletItem>
                          <strong>Neutralizes Salt:</strong> Barrier helps stop brine from reaching
                          raw steel.
                        </BulletItem>
                        <BulletItem>
                          <strong>Prevents Fatigue:</strong> Avoids rust-frozen hardware and hidden
                          decay.
                        </BulletItem>
                        <BulletItem>
                          <strong>Resale Edge:</strong> A rust-free chassis protects long-term
                          equity.
                        </BulletItem>
                      </>
                    )}
                  </ul>
                </div>
                <div
                  className={`${num % 2 === 0 ? "order-2" : "order-1"} relative rounded-xl overflow-hidden border border-white/10 aspect-video shadow-2xl max-h-[38vh]`}
                >
                  <img src={images[num]} alt="Visual" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Slide 10: Conclusion */}
        <div
          className="slide-container h-screen w-screen snap-start flex flex-col bg-black p-10 lg:p-16 relative"
          id="rs10"
        >
          <div
            className={`m-auto text-center max-w-5xl z-10 transition-all duration-1000 ${activeSlide === 10 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <h2 className="text-4xl lg:text-6xl font-bold text-blue-500 uppercase tracking-widest mb-6">
              Empowering Ownership
            </h2>
            <p className="text-base lg:text-xl text-white/50 mb-10 font-light leading-relaxed max-w-3xl mx-auto">
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
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold leading-tight">
                    {tier.desc}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={onComplete}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-[0.5em] px-12 py-6 rounded-full shadow-[0_20px_60px_rgba(0,145,255,0.4)] transition-all duration-500 hover:scale-105 group"
            >
              Review Package Options
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ValuePresentation };
export default ValuePresentation;
