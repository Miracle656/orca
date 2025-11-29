import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function OrcaMascot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftEyeRef = useRef<SVGGElement>(null);
  const rightEyeRef = useRef<SVGGElement>(null);
  const leftPupilRef = useRef<SVGCircleElement>(null);
  const rightPupilRef = useRef<SVGCircleElement>(null);
  const leftFinRef = useRef<SVGPathElement>(null);
  const rightFinRef = useRef<SVGPathElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const faceGroupRef = useRef<SVGGElement>(null);
  const jawRef = useRef<SVGGElement>(null);

  useGSAP(() => {
    // Floating animation
    gsap.to(bodyRef.current, {
      y: -10,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Fin wave
    gsap.to(leftFinRef.current, {
      rotation: 10,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      transformOrigin: "right center",
    });
    gsap.to(rightFinRef.current, {
      rotation: -10,
      duration: 3.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      transformOrigin: "left center",
      delay: 0.5
    });

    // Mouse Tracking Logic
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate mouse position relative to center (-1 to 1)
      const mouseX = (e.clientX - centerX) / (window.innerWidth / 2);
      const mouseY = (e.clientY - centerY) / (window.innerHeight / 2);

      // Limit the range
      const clampedX = gsap.utils.clamp(-1, 1, mouseX);
      const clampedY = gsap.utils.clamp(-1, 1, mouseY);

      // Move Pupils (The eyes follow you)
      gsap.to([leftPupilRef.current, rightPupilRef.current], {
        x: clampedX * 8,
        y: clampedY * 8,
        duration: 0.2,
        ease: "power2.out"
      });

      // Move Face Group (Eyes + Brows)
      gsap.to(faceGroupRef.current, {
        x: clampedX * 6,
        y: clampedY * 6,
        duration: 0.5,
        ease: "power2.out"
      });

      // Rotate body slightly for 3D effect
      gsap.to(bodyRef.current, {
        rotation: clampedX * 3,
        x: clampedX * 3,
        duration: 0.8,
        ease: "power2.out"
      });

      // Subtle Jaw movement (ensure we keep the base offset of 260)
      gsap.to(jawRef.current, {
        y: 260 + clampedY * 5,
        x: 200, // Explicitly set X to keep it centered if GSAP touches the transform
        duration: 0.5
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-64 h-64 md:w-96 md:h-96 z-50 cursor-pointer select-none">
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[8px_8px_0px_rgba(0,0,0,1)]"
      >
        <g ref={bodyRef}>
          {/* Dorsal Fin (Back) */}
          <path
            d="M200 50 C 200 50, 240 120, 240 160 L 160 160 C 160 120, 200 50, 200 50 Z"
            fill="black"
            stroke="black"
            strokeWidth="4"
          />

          {/* Side Fins */}
          <path
            ref={leftFinRef}
            d="M80 220 C 40 240, 20 280, 20 300 C 50 300, 100 260, 120 240 Z"
            fill="black"
            stroke="black"
            strokeWidth="4"
          />
          <path
            ref={rightFinRef}
            d="M320 220 C 360 240, 380 280, 380 300 C 350 300, 300 260, 280 240 Z"
            fill="black"
            stroke="black"
            strokeWidth="4"
          />

          {/* Main Body Shape */}
          <ellipse cx="200" cy="200" rx="140" ry="130" fill="white" stroke="black" strokeWidth="8" />

          {/* Black Top Patch (Orca Style) */}
          <path
            d="M60 200 C 60 100, 130 70, 200 70 C 270 70, 340 100, 340 200 C 340 160, 300 120, 200 120 C 100 120, 60 160, 60 200 Z"
            fill="black"
          />

          {/* Face Group */}
          <g ref={faceGroupRef}>
            {/* Eyes Container */}
            <g transform="translate(0, -10)">
              {/* Left Eye */}
              <g ref={leftEyeRef} transform="translate(140, 160)">
                {/* Eye White */}
                <ellipse cx="0" cy="0" rx="20" ry="15" fill="white" stroke="black" strokeWidth="3" />
                {/* Pupil */}
                <circle ref={leftPupilRef} cx="0" cy="0" r="6" fill="black" />
                {/* Eyebrow */}
                <path d="M-20 -15 L 10 0" stroke="black" strokeWidth="4" strokeLinecap="round" />
              </g>

              {/* Right Eye */}
              <g ref={rightEyeRef} transform="translate(260, 160)">
                {/* Eye White */}
                <ellipse cx="0" cy="0" rx="20" ry="15" fill="white" stroke="black" strokeWidth="3" />
                {/* Pupil */}
                <circle ref={rightPupilRef} cx="0" cy="0" r="6" fill="black" />
                {/* Eyebrow */}
                <path d="M20 -15 L -10 0" stroke="black" strokeWidth="4" strokeLinecap="round" />
              </g>
            </g>

            {/* Mouth/Jaw Group - Adjusted Position */}
            <g ref={jawRef} transform="translate(200, 260)">
              {/* Mouth Background */}
              <path
                d="M-80 -20 Q 0 50 80 -20 Q 0 80 -80 -20 Z"
                fill="white"
                stroke="black"
                strokeWidth="4"
              />

              {/* Teeth (Zig Zag) - Simplified and Aligned */}
              <path
                d="M-70 -10 L -60 10 L -50 -10 L -40 10 L -30 -10 L -20 10 L -10 -10 L 0 10 L 10 -10 L 20 10 L 30 -10 L 40 10 L 50 -10 L 60 10 L 70 -10"
                fill="none"
                stroke="black"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
