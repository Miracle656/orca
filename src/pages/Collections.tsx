import { useEffect, useState } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useNetworkVariable } from '../config/sui';
import { Link } from 'react-router-dom';
import { Loader2, Box, User, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

interface CollectionEvent {
    collection_id: string;
    creator: string;
    name: string;
}

export function Collections() {
    const client = useSuiClient();
    const account = useCurrentAccount();
    const packageId = useNetworkVariable('dropforgePackageId');
    const [collections, setCollections] = useState<CollectionEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCollections = async () => {
            if (!account) {
                setLoading(false);
                return;
            }

            try {
                // Query events for CollectionCreated
                const events = await client.queryEvents({
                    query: {
                        MoveEventType: `${packageId}::dropforge::CollectionCreated`
                    },
                    order: 'descending'
                });

                const parsedCollections = events.data
                    .map(event => {
                        const parsedJson = event.parsedJson as any;
                        return {
                            collection_id: parsedJson.collection_id,
                            creator: parsedJson.creator,
                            name: parsedJson.name
                        };
                    })
                    .filter(collection => collection.creator === account.address); // Filter by creator

                setCollections(parsedCollections);
            } catch (err) {
                console.error('Error fetching collections:', err);
                setError('Failed to load collections');
            } finally {
                setLoading(false);
            }
        };

        if (packageId) {
            fetchCollections();
        }
    }, [client, packageId, account]);

    return (
        <div className="min-h-screen pt-32 pb-20 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="max-w-7xl mx-auto px-6">

                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter" style={{ WebkitTextStroke: "2px black", color: "white", textShadow: "4px 4px 0px #000" }}>
                        My <span className="text-neo-pink" style={{ WebkitTextStroke: "2px black", textShadow: "4px 4px 0px #000" }}>Collections</span>
                    </h1>
                    <p className="text-xl font-bold border-2 border-black inline-block px-6 py-2 bg-neo-yellow text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        Manage your created collections
                    </p>
                </div>

                {!account ? (
                    <div className="text-center py-20 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto">
                        <Wallet className="w-16 h-16 mx-auto mb-6 text-black" />
                        <p className="text-2xl font-black uppercase mb-4">Wallet Not Connected</p>
                        <p className="text-lg font-bold text-gray-600 mb-8">Please connect your wallet to view your collections.</p>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-black" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-600 font-black text-2xl">{error}</p>
                    </div>
                ) : collections.length === 0 ? (
                    <div className="text-center py-20 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <p className="text-2xl font-black uppercase mb-4">No Collections Found</p>
                        <p className="text-lg font-bold text-gray-600 mb-8">You haven't created any collections yet.</p>
                        <Link to="/create" className="inline-block bg-neo-blue text-white px-6 py-3 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                            Create your first collection
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {collections.map((collection, index) => (
                            <motion.div
                                key={collection.collection_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link to={`/collections/${collection.collection_id}`} className="block group">
                                    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all h-full flex flex-col">
                                        <div className="h-48 bg-gray-100 border-b-4 border-black flex items-center justify-center relative overflow-hidden group-hover:bg-neo-blue/10 transition-colors">
                                            <Box className="w-20 h-20 text-gray-300 group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute top-4 right-4 bg-neo-green border-2 border-black px-3 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                My Collection
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            <h3 className="text-2xl font-black uppercase mb-2 line-clamp-1" title={collection.name}>
                                                {collection.name}
                                            </h3>

                                            <div className="mt-auto pt-4 border-t-2 border-dashed border-gray-300">
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                                    <User className="w-4 h-4" />
                                                    <span className="truncate font-mono">You</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
