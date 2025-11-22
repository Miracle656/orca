import { Link, useLocation } from "react-router-dom";
import { ConnectButton } from '@mysten/dapp-kit';
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import orcaMascot from "../assets/orca-mascot.png";

export function Navigation() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    { id: '/', label: 'Home' },
    { id: '/collections', label: 'Collections' },
    { id: '/create', label: 'Create' },
    // { id: '/mint', label: 'Mint' },
    { id: '/launchpad', label: 'Launchpad' },
    { id: '/tokens', label: 'Tokens' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 md:gap-4 group" onClick={closeMenu}>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <img
                src={orcaMascot}
                alt="Orca Mascot"
                className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              />
            </motion.div>

            <span className="text-3xl md:text-5xl font-black text-black appname drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]" style={{ WebkitTextStroke: "2px black", color: "white" }}>
              ORCA
            </span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden lg:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.id}
                className={`px-3 xl:px-4 py-2 text-sm xl:text-base font-bold transition-all duration-200 border-2 border-black ${isActive(tab.id)
                  ? 'bg-neo-yellow text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                  : 'bg-white text-black hover:bg-neo-pink hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1'
                  }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Connect Button - Right Side */}
          <div className="hidden lg:block">
            <div className="neo-border bg-neo-blue shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <ConnectButton className="!bg-transparent !text-black !font-bold !px-4 xl:!px-6 !py-3 !border-none !shadow-none" />
            </div>
          </div>

          {/* Mobile Menu Button & Connect */}
          <div className="flex lg:hidden items-center gap-3">
            <div className="neo-border bg-neo-blue shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <ConnectButton className="!bg-transparent !text-black !font-bold !px-3 !py-2 !border-none !shadow-none !text-sm" />
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t-2 border-black bg-white overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.id}
                  onClick={closeMenu}
                  className={`block w-full px-4 py-3 text-lg font-bold transition-all border-2 border-black ${isActive(tab.id)
                    ? 'bg-neo-yellow text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-black hover:bg-neo-pink hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}