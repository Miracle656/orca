import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { FeatureCard } from "../components/FeatureCard";
import { OrcaMascot } from "../components/OrcaMascot";
import nft1 from "../assets/nfts/nft1.jpg";
import nft2 from "../assets/nfts/nft2.jpg";
import nft3 from "../assets/nfts/nft3.jpg";
import nft4 from "../assets/nfts/nft4.jpg";
import nft5 from "../assets/nfts/nft5.jpg";
import nft6 from "../assets/nfts/nft6.jpg";
import nft7 from "../assets/nfts/nft7.jpg";
import nft8 from "../assets/nfts/nft8.jpg";
import nft9 from "../assets/nfts/nft9.jpg";
import suicoin from "../assets/coins/suicoin.png";
import walcoin from "../assets/coins/walcoin.png";
import scoin from "../assets/coins/scoin.png";
import Footer from "@/components/Footer";

export function Home() {
  const floatingVariants: Variants = {
    initial: { opacity: 0, scale: 0.8, y: 80 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 1, ease: "easeOut" },
    },
  };

  const floatAnimation = {
    y: [0, -24, 0] as number[],
    transition: {
      y: {
        duration: 7,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut" as const,
      },
    },
  } satisfies import("framer-motion").TargetAndTransition;

  // Pop-out animation for hidden assets
  const popOutVariants: Variants = {
    hidden: { opacity: 0, scale: 0.6, y: 20, rotate: -10 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      rotate: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.45,
        ease: "easeOut",
      },
    }),
  };


  const features = [
    {
      title: "Create NFT Collections",
      description:
        "Launch your own NFT collection with customizable royalties and metadata",
      route: "/create",
      hoverAssets: [nft5, nft6, nft7, nft8],
    },
    {
      title: "Launch Tokens",
      description:
        "Create and manage your own tokens with full control over supply",
      route: "/launchpad",
      hoverAssets: [scoin, walcoin],
    },
    {
      title: "Mint & Trade",
      description:
        "Mint NFTs with decentralized storage on Walrus and trade on the marketplace",
      route: "/mint",
      hoverAssets: [nft9, suicoin],
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white">



      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="relative z-10"
        >
          <p className="appname text-6xl sm:text-8xl md:text-9xl lg:text-[18rem] font-black tracking-tighter text-black leading-none drop-shadow-[8px_8px_0px_rgba(0,0,0,0.2)]" style={{ WebkitTextStroke: "4px black", color: "white" }}>
            ORCA
          </p>
        </motion.div>

        {/* Floating Background NFTs - Responsive */}
        <div className="relative -mt-16 sm:-mt-24 md:-mt-32 lg:-mt-48 h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] pointer-events-none select-none">
          {[
            {
              src: nft1,
              pos: "top-4 sm:top-8 right-2 sm:right-4 md:right-20",
              size: "w-32 sm:w-40 md:w-56 lg:w-72",
              delay: 0.4,
            },
            {
              src: nft2,
              pos: "bottom-8 sm:bottom-12 left-2 sm:left-4 md:left-16",
              size: "w-28 sm:w-36 md:w-52 lg:w-64",
              delay: 0.6,
            },
            {
              src: nft3,
              pos: "top-1/3 right-1/4 md:right-1/3",
              size: "w-36 sm:w-48 md:w-60 lg:w-80",
              delay: 0.8,
            },
            {
              src: nft4,
              pos: "top-2 sm:top-4 left-2 sm:left-6 md:left-20",
              size: "w-24 sm:w-32 md:w-44 lg:w-56 opacity-100",
              delay: 1.0,
            },
          ].map((nft, i) => (
            <motion.div
              key={i}
              variants={floatingVariants}
              initial="initial"
              animate={["animate", floatAnimation] as any}
              transition={{ delay: nft.delay }}
              whileHover={{ scale: 1.2, rotate: 8 }}
              className={`absolute ${nft.pos}`}
            >
              <img
                src={nft.src}
                alt=""
                className={`${nft.size} border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-1 md:p-2`}
              />
            </motion.div>
          ))}
        </div>

        {/* Hero Subtitle - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative z-10 -mt-12 sm:-mt-16 md:-mt-20 lg:-mt-32 bg-neo-yellow border-2 md:border-4 border-black p-4 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] inline-block rotate-1 max-w-[90%] sm:max-w-none"
        >
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-4 text-black uppercase tracking-tighter heromotto">
            the future of digital assets
          </h3>
          <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-black max-w-4xl mx-auto leading-relaxed font-bold">
            Create, mint, and trade NFTs with decentralized storage on Walrus.
            <br className="hidden sm:block" />
            Launch your own tokens. All on Sui blockchain.
          </p>
        </motion.div>

        {/* Interactive Feature Cards - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 mt-16 md:mt-32 max-w-7xl mx-auto relative z-20">
          {features.map((feature, idx) => (
            <FeatureCard
              key={idx}
              feature={feature}
              idx={idx}
              popOutVariants={popOutVariants}
            />
          ))}
        </div>

        {/* About Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-20 text-left">
          <div className="order-2 md:order-1">
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-black uppercase tracking-tighter">
              What is Orca?
            </h2>
            <p className="text-xl text-black font-medium leading-relaxed mb-6">
              Orca is the premier platform for digital assets on Sui. We provide a seamless experience for creators to launch NFT collections and tokens with ease.
            </p>
            <p className="text-xl text-black font-medium leading-relaxed">
              With decentralized storage powered by Walrus, your assets are safe, permanent, and truly yours. Join the revolution of digital ownership.
            </p>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <OrcaMascot />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
