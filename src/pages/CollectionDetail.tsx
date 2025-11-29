import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNetworkVariable } from '../config/sui';
import { getWalrusUrl } from '../config/walrus';
import { Loader2, CheckCircle2, AlertCircle, Wallet, Share2, X, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollectionData {
    id: string;
    name: string;
    description: string;
    creator: string;
    maxSupply: number;
    mintedCount: number;
    mintPrice: string;
    baseUri: string;
}

export function CollectionDetail() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const account = useCurrentAccount();
    const client = useSuiClient();
    const packageId = useNetworkVariable('dropforgePackageId');
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const [collection, setCollection] = useState<CollectionData | null>(null);
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mintingIndex, setMintingIndex] = useState<number | null>(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Share Modal State
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareIndex, setShareIndex] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

    // Auto-mint State
    const [autoMintTriggered, setAutoMintTriggered] = useState(false);

    const fetchCollectionData = async () => {
        if (!id) return;
        try {
            const obj = await client.getObject({
                id,
                options: { showContent: true }
            });

            if (obj.data?.content?.dataType !== 'moveObject') {
                throw new Error('Invalid object');
            }

            const fields = obj.data.content.fields as any;

            const collectionData: CollectionData = {
                id: obj.data.objectId,
                name: fields.name,
                description: fields.description,
                creator: fields.creator,
                maxSupply: Number(fields.max_supply),
                mintedCount: Number(fields.minted_count),
                mintPrice: fields.mint_price,
                baseUri: fields.base_uri
            };

            setCollection(collectionData);

            // Fetch Manifest
            const manifestUrl = getWalrusUrl(collectionData.baseUri);
            const res = await fetch(manifestUrl);
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Collection data has expired on Walrus testnet. The storage period has ended. Please contact the creator to refresh the collection.');
                }
                throw new Error(`Failed to load manifest: ${res.status} ${res.statusText}`);
            }
            const manifest = await res.json();

            if (Array.isArray(manifest)) {
                setImages(manifest);
            }

        } catch (err: any) {
            console.error('Error fetching collection:', err);
            setError(err?.message || 'Failed to load collection details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollectionData();
    }, [id, client]);

    // Auto-Mint Logic
    useEffect(() => {
        const mintIndexParam = searchParams.get('mintIndex');
        if (mintIndexParam && collection && images.length > 0 && !autoMintTriggered) {
            const index = parseInt(mintIndexParam);
            if (!isNaN(index) && index >= 0 && index < images.length) {
                // Check if already minted
                if (index >= collection.mintedCount) {
                    if (account) {
                        setAutoMintTriggered(true);
                        handleMint(index, images[index]);
                    }
                } else {
                    setError(`NFT #${index + 1} has already been minted.`);
                }
            }
        }
    }, [searchParams, collection, images, account, autoMintTriggered]);

    const handleMint = async (index: number, imageUrl: string) => {
        if (!account || !collection) return;

        setMintingIndex(index);
        setError('');
        setSuccessMsg('');

        try {
            const tx = new Transaction();

            // Split coin for exact payment
            const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(collection.mintPrice)]);

            const nftName = `${collection.name} #${index + 1}`;

            tx.moveCall({
                target: `${packageId}::dropforge::mint_nft`,
                arguments: [
                    tx.object(collection.id),
                    tx.pure.vector('u8', Array.from(new TextEncoder().encode(nftName))),
                    tx.pure.vector('u8', Array.from(new TextEncoder().encode(collection.description))),
                    tx.pure.vector('u8', Array.from(new TextEncoder().encode(imageUrl))),
                    payment,
                    tx.pure.address(account.address)
                ]
            });

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        await client.waitForTransaction({ digest: result.digest });
                        setSuccessMsg(`Successfully minted ${nftName}!`);
                        fetchCollectionData(); // Refresh state
                    },
                    onError: (err) => {
                        console.error('Mint error:', err);
                        setError('Minting failed: ' + err.message);
                    }
                }
            );
        } catch (err: any) {
            setError('Minting failed: ' + err.message);
        } finally {
            setMintingIndex(null);
        }
    };

    const openShareModal = (index: number) => {
        setShareIndex(index);
        setShareModalOpen(true);
        setCopied(false);
    };

    const copyShareLink = () => {
        if (shareIndex === null) return;
        const url = `${window.location.origin}${window.location.pathname}?mintIndex=${shareIndex}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-32 flex justify-center">
                <Loader2 className="w-12 h-12 animate-spin" />
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="min-h-screen pt-32 text-center">
                <h1 className="text-3xl font-bold">Collection not found</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-20 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black uppercase mb-2">{collection.name}</h1>
                            <p className="text-xl font-bold text-gray-600 max-w-2xl">{collection.description}</p>
                            <div className="mt-4 flex gap-4 text-sm font-bold">
                                <span className="bg-neo-blue text-white px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    Supply: {collection.mintedCount} / {collection.maxSupply}
                                </span>
                                <span className="bg-neo-green text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    Price: {Number(collection.mintPrice) / 1e9} SUI
                                </span>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-500 uppercase">Creator</p>
                            <p className="font-mono font-bold bg-gray-100 px-2 py-1 border-2 border-black">{collection.creator.slice(0, 6)}...{collection.creator.slice(-4)}</p>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-8 bg-red-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <p className="text-red-800 font-bold">{error}</p>
                    </div>
                )}

                {successMsg && (
                    <div className="mb-8 bg-green-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <p className="text-green-800 font-bold">{successMsg}</p>
                    </div>
                )}

                {/* Auto-Mint Prompt for Disconnected Users */}
                {searchParams.get('mintIndex') && !account && !autoMintTriggered && (
                    <div className="mb-8 bg-neo-yellow border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center animate-pulse">
                        <p className="text-xl font-black uppercase mb-2">You've been invited to mint NFT #{parseInt(searchParams.get('mintIndex')!) + 1}!</p>
                        <p className="font-bold">Connect your wallet to claim it instantly.</p>
                    </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {images.map((imgUrl, i) => {
                        const isMinted = i < collection.mintedCount;
                        const isMinting = mintingIndex === i;

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col ${isMinted ? 'opacity-75' : ''}`}
                            >
                                <div className="aspect-square border-b-4 border-black overflow-hidden relative">
                                    <img src={imgUrl} alt={`${collection.name} #${i + 1}`} className="w-full h-full object-cover" />
                                    {isMinted && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="bg-red-500 text-white font-black uppercase px-4 py-2 border-2 border-white -rotate-12 text-xl">
                                                Sold Out
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                                    <div>
                                        <h3 className="font-black text-lg uppercase">#{i + 1}</h3>
                                    </div>

                                    {isMinted ? (
                                        <button disabled className="w-full bg-gray-300 border-2 border-black font-bold py-2 cursor-not-allowed">
                                            Minted
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleMint(i, imgUrl)}
                                                disabled={isMinting || !account}
                                                className="flex-1 bg-neo-pink text-black border-2 border-black font-black uppercase py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                            >
                                                {isMinting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : !account ? (
                                                    <>
                                                        <Wallet className="w-4 h-4" /> Connect
                                                    </>
                                                ) : (
                                                    'Mint'
                                                )}
                                            </button>
                                            <button
                                                onClick={() => openShareModal(i)}
                                                className="bg-neo-yellow text-black border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                                title="Share Mint Link"
                                            >
                                                <Share2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Share Modal */}
                <AnimatePresence>
                    {shareModalOpen && shareIndex !== null && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full relative"
                            >
                                <button
                                    onClick={() => setShareModalOpen(false)}
                                    className="absolute top-4 right-4 p-1 hover:bg-gray-100 border-2 border-transparent hover:border-black transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <h2 className="text-2xl font-black uppercase mb-6 text-center">Share to Mint #{shareIndex + 1}</h2>

                                <div className="bg-white border-4 border-black p-4 mb-6 mx-auto w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?mintIndex=${shareIndex}`)}`}
                                        alt="QR Code"
                                        className="w-48 h-48"
                                    />
                                </div>

                                <p className="text-center font-bold mb-4">Scan to mint instantly!</p>

                                <button
                                    onClick={copyShareLink}
                                    className="w-full bg-neo-blue text-white border-2 border-black font-bold py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                                >
                                    {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    {copied ? 'Link Copied!' : 'Copy Link'}
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
