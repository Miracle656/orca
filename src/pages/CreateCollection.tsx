import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNetworkVariable } from '../config/sui';
import { uploadToWalrus, getWalrusUrl } from '../config/walrus';
import { Loader2, CheckCircle2, Upload, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import nft1 from "../assets/nfts/nft1.jpg";
import nft2 from "../assets/nfts/nft2.jpg";
import nft3 from "../assets/nfts/nft3.jpg";

export function CreateCollection() {
  const account = useCurrentAccount();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxSupply: '',
    royaltyBps: '',
    mintPrice: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const packageId = useNetworkVariable('dropforgePackageId');
  const registryId = useNetworkVariable('dropforgeRegistryId');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    setError('');
    setCurrentImageIndex(0);

    const urls = files.map(file => URL.createObjectURL(file));
    setPreviews(urls);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % previews.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + previews.length) % previews.length);
  };

  const handleUploadAllToWalrus = async (): Promise<string> => {
    setIsUploading(true);
    setError('');

    try {
      setUploadProgress('Uploading images to Walrus...');

      const blobUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        setUploadProgress(`Uploading image ${i + 1}/${images.length}...`);

        try {
          const blobId = await uploadToWalrus(file);
          console.log(`Image ${i + 1} uploaded, blob ID:`, blobId);

          const walrusUrl = getWalrusUrl(blobId);
          blobUrls.push(walrusUrl);

          const verifyRes = await fetch(walrusUrl, { method: 'HEAD' });
          if (!verifyRes.ok) {
            throw new Error(`Image ${i + 1} upload verification failed`);
          }
        } catch (err) {
          console.error(`Failed to upload image ${i + 1}:`, err);
          throw new Error(`Failed to upload image ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      console.log('All images uploaded:', blobUrls);
      setUploadProgress('Creating manifest...');

      const manifest = JSON.stringify(blobUrls, null, 2);
      console.log('Manifest JSON:', manifest);

      const manifestBlob = new Blob([manifest], { type: 'application/json' });
      const manifestFile = new File([manifestBlob], 'manifest.json', { type: 'application/json' });

      console.log('Uploading manifest to Walrus...');
      const manifestBlobId = await uploadToWalrus(manifestFile);
      console.log('Manifest uploaded, blob ID:', manifestBlobId);

      const manifestUrl = getWalrusUrl(manifestBlobId);
      console.log('Manifest URL:', manifestUrl);

      setUploadProgress('Verifying manifest...');
      const verifyManifest = await fetch(manifestUrl);
      if (!verifyManifest.ok) {
        throw new Error('Manifest upload verification failed - manifest not accessible');
      }

      const verifiedManifest = await verifyManifest.json();
      console.log('Verified manifest content:', verifiedManifest);

      if (!Array.isArray(verifiedManifest) || verifiedManifest.length !== blobUrls.length) {
        throw new Error('Manifest verification failed - content mismatch');
      }

      setUploadProgress('All uploads verified!');

      return manifestBlobId;
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      setError('Please connect your wallet');
      return;
    }
    if (!registryId) {
      setError('Registry not loaded');
      return;
    }
    if (!images.length) {
      setError('Please upload at least 1 image');
      return;
    }

    setIsCreating(true);
    setSuccess(false);
    setError('');

    try {
      const manifestBlobId = await handleUploadAllToWalrus();
      console.log('Using manifest blob ID for collection:', manifestBlobId);

      setUploadProgress('Creating collection on-chain...');

      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::dropforge::create_collection`,
        arguments: [
          tx.object(registryId),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(formData.name))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(formData.description))),
          tx.pure.u64(BigInt(formData.maxSupply)),
          tx.pure.u16(Number(formData.royaltyBps)),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(manifestBlobId))),
          tx.pure.u64(BigInt(formData.mintPrice)),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            console.log('Transaction success:', result);
            await suiClient.waitForTransaction({ digest: result.digest });

            setSuccess(true);
            setUploadProgress('Collection created successfully!');

            setFormData({ name: '', description: '', maxSupply: '', royaltyBps: '', mintPrice: '' });
            setImages([]);
            setPreviews([]);
            setCurrentImageIndex(0);

            setTimeout(() => {
              setSuccess(false);
              setUploadProgress('');
            }, 5000);
          },
          onError: (err) => {
            console.error('Transaction error:', err);
            setError('Failed to create collection: ' + (err.message || 'Transaction failed'));
          },
        }
      );
    } catch (err: any) {
      console.error('Creation error:', err);
      if (!error) {
        setError('Error: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] overflow-hidden relative">

      {/* Floating Background NFTs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [12, 15, 12] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 right-10 w-48 h-48 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-2 rotate-12 hidden lg:block"
        >
          <img src={nft1} alt="" className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0], rotate: [-6, -3, -6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 left-10 w-40 h-40 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-2 -rotate-6 hidden lg:block"
        >
          <img src={nft2} alt="" className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
          animate={{ y: [0, -15, 0], rotate: [6, 10, 6] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-40 left-20 w-32 h-32 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white p-2 rotate-6 hidden xl:block"
        >
          <img src={nft3} alt="" className="w-full h-full object-cover" />
        </motion.div>
      </div >

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12"
        >
          <div className="text-center mb-10">
            <h2 className="text-5xl md:text-6xl font-black mb-4 uppercase tracking-tighter" style={{ WebkitTextStroke: "2px black", color: "white", textShadow: "4px 4px 0px #000" }}>
              Create <span className="text-neo-yellow" style={{ WebkitTextStroke: "2px black", textShadow: "4px 4px 0px #000" }}>Collection</span>
            </h2>
            <p className="text-xl font-bold border-2 border-black inline-block px-6 py-2 bg-neo-blue text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Upload images and automatically create NFT collection
            </p>
          </div>

          {error && (
            <div className="mb-8 bg-red-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-900 font-black uppercase text-lg">Error</p>
                <p className="text-red-800 font-bold">{error}</p>
              </div>
            </div>
          )}

          {uploadProgress && (
            <div className="mb-8 bg-neo-blue border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 text-white">
              <p className="font-black uppercase flex items-center gap-2">
                <Loader2 className="animate-spin" />
                {uploadProgress}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Image Upload Section */}
            <div className="space-y-3">
              <label className="block text-lg font-black uppercase">
                Upload Images
              </label>
              <div className="border-4 border-dashed border-black bg-gray-50 p-8 text-center hover:bg-neo-yellow/20 transition-colors cursor-pointer group relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer block w-full h-full">
                  <div className="w-20 h-20 mx-auto mb-4 bg-white border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-y-[-4px] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <Upload className="w-10 h-10 text-black" />
                  </div>
                  <p className="text-xl font-black uppercase">Click to upload images</p>
                  <p className="text-sm font-bold text-gray-500 mt-2">
                    {images.length > 0 ? `${images.length} image(s) selected` : 'PNG, JPG up to 10MB each'}
                  </p>
                </label>
              </div>

              {/* Image Gallery with Carousel */}
              {previews.length > 0 && (
                <div className="grid md:grid-cols-2 gap-8 mt-8">
                  {/* Left: Thumbnail Grid */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase bg-black text-white inline-block px-2 py-1">All Images ({previews.length})</h3>
                    <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto p-3 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {previews.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentImageIndex(i)}
                          className={`relative aspect-square border-2 border-black overflow-hidden transition-all ${currentImageIndex === i
                            ? 'ring-4 ring-neo-blue scale-95'
                            : 'hover:opacity-80'
                            }`}
                        >
                          <img
                            src={src}
                            className="w-full h-full object-cover"
                            alt={`Preview ${i + 1}`}
                          />
                          <div className="absolute top-0 right-0 bg-black text-white text-xs px-1 font-bold">
                            #{i + 1}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: Large Carousel */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase bg-black text-white inline-block px-2 py-1">
                      Preview - Image {currentImageIndex + 1}
                    </h3>
                    <div className="relative border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] aspect-square overflow-hidden group">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={currentImageIndex}
                          src={previews[currentImageIndex]}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.2 }}
                          className="w-full h-full object-contain p-4"
                          alt={`Preview ${currentImageIndex + 1}`}
                        />
                      </AnimatePresence>

                      {/* Navigation Buttons */}
                      {previews.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                          >
                            <ChevronLeft className="w-6 h-6 text-black" />
                          </button>
                          <button
                            type="button"
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                          >
                            <ChevronRight className="w-6 h-6 text-black" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-black uppercase mb-2">Collection Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="MY NFT COLLECTION"
                  className="w-full px-4 py-4 border-2 border-black font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 transition-all placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-lg font-black uppercase mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your masterpiece..."
                  rows={3}
                  className="w-full px-4 py-4 border-2 border-black font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 transition-all resize-none placeholder:text-gray-400"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-lg font-black uppercase mb-2">Max Supply</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxSupply}
                    onChange={(e) => setFormData({ ...formData, maxSupply: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-4 border-2 border-black font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-lg font-black uppercase mb-2">
                    Royalty (BPS)
                    <span className="text-sm font-bold text-gray-500 ml-2 normal-case">(500 = 5%)</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="10000"
                    value={formData.royaltyBps}
                    onChange={(e) => setFormData({ ...formData, royaltyBps: e.target.value })}
                    placeholder="500"
                    className="w-full px-4 py-4 border-2 border-black font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-lg font-black uppercase mb-2">
                  Mint Price (MIST)
                  <span className="text-sm font-bold text-gray-500 ml-2 normal-case">(1 SUI = 1,000,000,000 MIST)</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.mintPrice}
                  onChange={(e) => setFormData({ ...formData, mintPrice: e.target.value })}
                  placeholder="1000000000"
                  className="w-full px-4 py-4 border-2 border-black font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating || isUploading || !images.length}
              className="w-full bg-neo-pink border-2 border-black text-black py-5 text-xl font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isCreating || isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {uploadProgress || 'Creating Collection...'}
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  Collection Created!
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" />
                  Upload & Create Collection
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}