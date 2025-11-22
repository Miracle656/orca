import React from "react"
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function FeatureCard({ feature, idx, popOutVariants }: any) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 + idx * 0.2 }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={feature.route}
        className="block relative bg-white p-6 md:p-12 neo-card overflow-visible h-full flex flex-col justify-between"
      >
        {/* Hover Background Color Change */}
        <motion.div
          className="absolute inset-0 -z-10 bg-neo-pink"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
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
          <motion.button
            className="inline-block text-lg font-bold bg-neo-yellow border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            animate={{ x: isHovered ? 10 : 0, y: isHovered ? -5 : 0, boxShadow: isHovered ? "6px 6px 0px 0px rgba(0,0,0,1)" : "4px 4px 0px 0px rgba(0,0,0,1)" }}
            transition={{ duration: 0.2 }}
          >
            GO →
          </motion.button>
        </div>
      </Link>

      {/* Hover Assets */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 pointer-events-none w-[280px] sm:w-[500px] h-96 z-50">
        {feature.hoverAssets.map((asset: string, i: number) => (
          <motion.img
            key={i}
            src={asset}
            alt=""
            custom={i}
            variants={popOutVariants}
            initial="hidden"
            animate={isHovered ? "visible" : "hidden"}
            className={`absolute border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] object-cover bg-white ${idx === 0
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
              transform: `rotate(${(i - 1.5) * 20}deg)`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}