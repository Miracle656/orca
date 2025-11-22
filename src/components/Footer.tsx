import { Link } from 'react-router-dom';
import { Twitter, Send, Globe, Github } from 'lucide-react';
import orcaMascot from "../assets/orca-mascot.png";
import suilogo from "../assets/image001.png"
import walruslogo from "../assets/6864f039b26f4afedada6c10_logo.svg"

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Home', href: '/' },
      { label: 'Collections', href: '/collections' },
      { label: 'Create NFT', href: '/create' },
      { label: 'Mint NFT', href: '/mint' },
    ],
    launchpad: [
      { label: 'Launch Token', href: '/launchpad' },
      { label: 'Browse Tokens', href: '/tokens' },
      { label: 'How It Works', href: '/launchpad' },
    ],
    resources: [
      { label: 'Documentation', href: '#' },
      { label: 'API', href: '#' },
      { label: 'Support', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter', color: 'bg-neo-blue' },
    { icon: Send, href: 'https://t.me', label: 'Telegram', color: 'bg-neo-pink' },
    { icon: Globe, href: '#', label: 'Website', color: 'bg-neo-yellow' },
    { icon: Github, href: 'https://github.com', label: 'GitHub', color: 'bg-neo-green' },
  ];

  return (
    <footer className="bg-white border-t-4 border-black mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                src={orcaMascot}
                alt="Orca"
                className="w-16 h-16 object-contain drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              />
              <span className="text-4xl font-black text-black appname" style={{ WebkitTextStroke: "2px black", color: "white" }}>
                ORCA
              </span>
            </Link>
            <p className="text-gray-700 font-bold mb-6 max-w-sm">
              The ultimate NFT marketplace and token launchpad on Sui. Create, trade, and launch with style! 🚀
            </p>

            {/* Social Links */}
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${social.color} border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all`}
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5 text-black" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-black pb-2">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-gray-700 font-bold hover:text-black hover:translate-x-1 inline-block transition-all"
                  >
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Launchpad Links */}
          <div>
            <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-black pb-2">Launchpad</h3>
            <ul className="space-y-2">
              {footerLinks.launchpad.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-gray-700 font-bold hover:text-black hover:translate-x-1 inline-block transition-all"
                  >
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-black pb-2">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-700 font-bold hover:text-black hover:translate-x-1 inline-block transition-all"
                  >
                    → {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t-2 border-black pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm md:text-base font-bold text-gray-700">
              © {currentYear} ORCA.
            </p>

            <div className="flex flex-wrap gap-4 text-sm font-bold">
              <a href="#" className="text-gray-700 hover:text-black transition-colors">Privacy Policy</a>
              <span className="text-gray-400">•</span>
              <a href="#" className="text-gray-700 hover:text-black transition-colors">Terms of Service</a>
              <span className="text-gray-400">•</span>
              <a href="#" className="text-gray-700 hover:text-black transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>

        {/* Fun Badge */}
        <div className="mt-8 flex justify-center">
          <div className="bg-neo-grey border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] inline-block transform -rotate-2">
            <p className=" flex items-center gap-2 font-black uppercase text-sm">Powered by
              <img className='w-16 h-16 object-contain' src={suilogo} alt="" />
              <img src={walruslogo} alt="" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
