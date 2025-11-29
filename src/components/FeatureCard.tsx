import { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function FeatureCard({ feature, idx }: any) {
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const assetsRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: cardRef });

  const onEnter = contextSafe(() => {
    // Background fill
    gsap.to(bgRef.current, { opacity: 1, duration: 0.2 });

    // Button move
    gsap.to(buttonRef.current, {
      x: 10,
      y: -5,
      boxShadow: "6px 6px 0px 0px rgba(0,0,0,1)",
      duration: 0.2
    });

    // Assets pop out
    if (assetsRef.current) {
      gsap.to(assetsRef.current.children, {
        opacity: 1,
        scale: 1,
        y: 0,
        rotate: (i) => (i - 1.5) * 20, // Re-apply the initial rotation for pop-out
        stagger: 0.1,
        duration: 0.45,
        ease: "back.out(1.7)"
      });
    }
  });

  const onLeave = contextSafe(() => {
    // Background reset
    gsap.to(bgRef.current, { opacity: 0, duration: 0.2 });

    // Button reset
    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
      duration: 0.2
    });

    // Assets hide
    if (assetsRef.current) {
      gsap.to(assetsRef.current.children, {
        opacity: 0,
        scale: 0.6,
        y: 20,
        rotate: (i) => ((i - 1.5) * 20) - 10, // Add -10deg to the initial rotation for "hidden" state
        duration: 0.3,
        ease: "power2.in"
      });
    }
  });

  return (
    <div
      ref={cardRef}
      className="relative"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Link
        to={feature.route}
        className="block relative bg-white p-6 md:p-12 neo-card overflow-visible h-full flex flex-col justify-between"
      >
        {/* Hover Background Color Change */}
        <div
          ref={bgRef}
          className="absolute inset-0 -z-10 bg-neo-pink opacity-0"
        />

        <div>
          <h3 className="text-2xl sm:text-3xl md:text-5xl font-black mb-6 text-black relative z-10 uppercase tracking-tighter border-b-4 border-black pb-4">
            {feature.title}
          </h3>
          <p className="text-lg md:text-xl text-black font-medium relative z-10 leading-relaxed">
            {feature.description}
          </p>
        </div>

        <div className="mt-10 text-right relative z-10">
          <button
            ref={buttonRef}
            className="inline-block text-lg font-bold bg-neo-yellow border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            GO →
          </button>
        </div>
      </Link>

      {/* Hover Assets */}
      <div ref={assetsRef} className="absolute -top-40 left-1/2 -translate-x-1/2 pointer-events-none w-[280px] sm:w-[500px] h-96 z-50">
        {feature.hoverAssets.map((asset: string, i: number) => (
          <img
            key={i}
            src={asset}
            alt=""
            className={`absolute border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] object-cover bg-white opacity-0 scale-60 translate-y-5 ${idx === 0
              ? i === 0
                ? "left-[80px] top-10 w-36 h-36"
                : i === 1
                  ? "right-[60px] top-0 w-36 h-36"
                  : i === 2
                    ? "left-[20px] top-[120px] w-32 h-32"
                    : "right-[20px] top-[110px] w-32 h-32"
              : idx === 1
                ? i === 0
                  ? "left-[60px] top-16 w-40 h-40"
                  : "right-[60px] top-24 w-40 h-40"
                : i === 0
                  ? "left-[40px] top-20 w-36 h-36"
                  : "right-[40px] top-16 w-36 h-36"
              }`}
            style={{
              transform: `rotate(${((i - 1.5) * 20) - 10}deg)`, // Initial rotation for "hidden" state
            }}
          />
        ))}
      </div>
    </div>
  );
}