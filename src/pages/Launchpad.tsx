import { useState, useEffect } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Upload, Rocket, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { uploadToWalrus, getWalrusUrl } from "../config/walrus";
import { motion, AnimatePresence } from 'framer-motion';
import orcacoin from "../assets/coins/orcacoin.png";
import suicoin from "../assets/coins/suicoin.png";

// CONFIGURE THESE WITH YOUR DEPLOYED CONTRACT VALUES
const PACKAGE_ID = "0xcd4378bfafc0abf1360405548f33bf64c46785886fc7fd9a302a4ad3c8051ebd";
const PLATFORM_ID = "0x5fa0c28a7c85fd3af647b3598190d91463c628b8075e9434c53478e85bb37696";
const REGISTRY_ID = "0x3b8a4a1a1f71cdac2238d511971df09c5dcb4ff4d7078d4319d666aa12914162";
const CLOCK_ID = "0x6"; // Sui system clock

// Neobrutalism Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-lg ${type === 'success' ? 'bg-neo-green text-black' : 'bg-red-500 text-white'
        }`}
    >
      {type === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-70">
        <X className="h-5 w-5" />
      </button>
    </motion.div>
  );
};

export default function Launchpad() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    twitter: '',
    telegram: '',
    website: '',
    imageUrl: '',
    reserveRatio: '5000', // Default 50%
  });

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txDigest, setTxDigest] = useState("");
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadIcon = async () => {
    if (!iconFile) return;

    setIsUploading(true);
    setError('');
    try {
      const blobId = await uploadToWalrus(iconFile);
      const imageUrl = getWalrusUrl(blobId);
      setFormData(prev => ({ ...prev, imageUrl }));
      showToast("Icon uploaded to Walrus successfully!", 'success');
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError("Failed to upload icon to Walrus");
      showToast("Failed to upload icon", 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.name || !formData.symbol || !formData.description || !formData.imageUrl) {
        throw new Error('Please fill in all required fields and upload an icon');
      }

      const tx = new Transaction();

      // Split 1 SUI for creation fee
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(1_000_000_000)]);

      // Call the launch_token function
      tx.moveCall({
        target: `${PACKAGE_ID}::launchpad::launch_token`,
        arguments: [
          tx.object(PLATFORM_ID),
          tx.object(REGISTRY_ID),
          tx.pure.string(formData.name),
          tx.pure.string(formData.symbol),
          tx.pure.string(formData.description),
          tx.pure.string(formData.imageUrl),
          tx.pure.string(formData.twitter),
          tx.pure.string(formData.telegram),
          tx.pure.string(formData.website),
          tx.pure.u64(parseInt(formData.reserveRatio)), // Added back reserveRatio!
          coin,
          tx.object(CLOCK_ID),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Transaction successful:', result);
            setSuccess(`Token launched successfully!`);
            setTxDigest(result.digest);
            showToast("Token launched successfully!", 'success');
            setFormData({
              name: '',
              symbol: '',
              description: '',
              twitter: '',
              telegram: '',
              website: '',
              imageUrl: '',
              reserveRatio: '5000',
            });
            setIconFile(null);
            setIconPreview("");
          },
          onError: (err) => {
            console.error('Transaction failed:', err);
            setError(err.message || 'Transaction failed');
            showToast(err.message || 'Transaction failed', 'error');
          },
        }
      );
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 relative overflow-hidden">
      {/* Floating Coins */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 right-10 w-32 h-32 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white p-2 hidden lg:block rotate-12"
        >
          <img src={orcacoin} alt="" className="w-full h-full object-contain" />
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-40 right-20 w-24 h-24 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white p-2 hidden lg:block -rotate-6"
        >
          <img src={suicoin} alt="" className="w-full h-full object-contain" />
        </motion.div>
      </div>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter" style={{ WebkitTextStroke: "2px black", color: "white", textShadow: "4px 4px 0px #000" }}>
            LAUNCH YOUR <span className="text-neo-yellow" style={{ WebkitTextStroke: "2px black", textShadow: "4px 4px 0px #000" }}>TOKEN</span>
          </h1>
          <p className="text-xl font-bold border-2 border-black inline-block px-6 py-2 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Create your own token on Sui in seconds. No coding required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="md:col-span-2">
            <div className="neo-card p-8 bg-white relative">
              {/* Decorative elements */}
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-neo-pink border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10"></div>
              <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-neo-blue border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10"></div>

              <h2 className="text-2xl font-black mb-6 flex items-center gap-2 border-b-4 border-black pb-2">
                <Rocket className="h-6 w-6" />
                TOKEN DETAILS
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold uppercase">Token Image <span className="text-red-500">*</span></label>

                  <div className="border-2 border-black p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                    {iconPreview ? (
                      <div className="relative inline-block">
                        <img
                          src={iconPreview}
                          alt="Icon preview"
                          className="w-32 h-32 object-cover border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIconFile(null);
                            setIconPreview("");
                            setFormData(prev => ({ ...prev, imageUrl: "" }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white border-2 border-black px-2 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px]"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <div className="w-16 h-16 mx-auto mb-2 bg-neo-yellow border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <Upload className="w-8 h-8 text-black" />
                        </div>
                        <p className="font-bold">Click to upload icon</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIconChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {iconFile && !formData.imageUrl && (
                    <button
                      type="button"
                      onClick={handleUploadIcon}
                      disabled={isUploading}
                      className="mt-2 w-full bg-neo-blue border-2 border-black text-white py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                    >
                      {isUploading ? 'Uploading...' : 'Upload to Walrus'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold uppercase">Token Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Orca Coin"
                      className="w-full p-3 border-2 border-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold uppercase">Symbol <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="symbol"
                      value={formData.symbol}
                      onChange={handleInputChange}
                      placeholder="e.g. ORCA"
                      className="w-full p-3 border-2 border-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold uppercase">Description <span className="text-red-500">*</span></label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your token..."
                    rows={4}
                    className="w-full p-3 border-2 border-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all resize-none"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t-2 border-black border-dashed">
                  <h3 className="font-bold uppercase text-sm">Social Links (Optional)</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <input
                      type="text"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      placeholder="Twitter URL"
                      className="w-full p-3 border-2 border-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    />
                    <input
                      type="text"
                      name="telegram"
                      value={formData.telegram}
                      onChange={handleInputChange}
                      placeholder="Telegram URL"
                      className="w-full p-3 border-2 border-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    />
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="Website URL"
                      className="w-full p-3 border-2 border-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100 border-2 border-red-500 text-red-700 p-4 flex items-center gap-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-100 border-2 border-green-500 text-green-700 p-4 flex flex-col gap-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      {success}
                    </div>
                    {txDigest && (
                      <a
                        href={`https://testnet.suivision.xyz/txblock/${txDigest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline hover:text-green-900"
                      >
                        View Transaction: {txDigest.slice(0, 10)}...
                      </a>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !formData.imageUrl}
                  className="w-full bg-neo-pink border-2 border-black py-4 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Launching...' : 'Launch Token (1 SUI)'}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="neo-card p-6 bg-neo-blue text-white">
              <h3 className="font-black text-xl mb-4 uppercase border-b-2 border-black pb-2">How it works</h3>
              <ul className="space-y-4 font-bold">
                <li className="flex items-start gap-3">
                  <div className="bg-white text-black w-8 h-8 flex items-center justify-center border-2 border-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">1</div>
                  <p className='text-black'>Fill in your token details and upload an image.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white text-black w-8 h-8 flex items-center justify-center border-2 border-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">2</div>
                  <p className='text-black'>Pay 1 SUI to create the token and initialize the bonding curve.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white text-black w-8 h-8 flex items-center justify-center border-2 border-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">3</div>
                  <p className='text-black'>People can buy your token immediately!</p>
                </li>
              </ul>
            </div>

            <div className="neo-card p-6 bg-neo-green text-black">
              <h3 className="font-black text-xl mb-4 uppercase border-b-2 border-black pb-2">Fair Launch</h3>
              <p className="font-medium mb-4">
                No presale, no team allocation. Everyone buys at the same time.
              </p>
              <div className="bg-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-bold text-sm uppercase text-gray-500">Initial Price</p>
                <p className="font-black text-2xl">0.000001 SUI</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
