import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { ArrowLeft, TrendingUp, Users, DollarSign, Clock, ExternalLink, Loader2, AlertCircle, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PACKAGE_ID = "0xcd4378bfafc0abf1360405548f33bf64c46785886fc7fd9a302a4ad3c8051ebd";
const PLATFORM_ID = "0x5fa0c28a7c85fd3af647b3598190d91463c628b8075e9434c53478e85bb37696";
const CLOCK_ID = "0x6";

interface TokenData {
    id: string;
    tokenId: string;
    name: string;
    symbol: string;
    description: string;
    imageUrl: string;
    creator: string;
    totalSupply: number;
    virtualSuiReserves: number;
    virtualTokenReserves: number;
    realSuiReserves: number;
    price: number;
    marketCap: number;
    volume: number;
    graduated: boolean;
    launchTime: number;
    twitter?: string;
    telegram?: string;
    website?: string;
}

interface TokenBalance {
    objectId: string;
    balance: number;
    tokenId: string;
    metadata: {
        name: string;
        symbol: string;
        image_url: string;
    };
}

interface PricePoint {
    time: string;
    price: number;
}

export function TokenDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const [token, setToken] = useState<TokenData | null>(null);
    const [userTokenBalances, setUserTokenBalances] = useState<TokenBalance[]>([]);
    const [totalUserBalance, setTotalUserBalance] = useState<number>(0);
    const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
    const [buyAmount, setBuyAmount] = useState('');
    const [sellBalanceId, setSellBalanceId] = useState('');
    const [isBuying, setIsBuying] = useState(false);
    const [isSelling, setIsSelling] = useState(false);
    const [txStatus, setTxStatus] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadTokenData();
            loadPriceHistory();
        }
    }, [id]);

    useEffect(() => {
        if (currentAccount?.address && token) {
            loadUserTokenBalances();
        }
    }, [currentAccount, token]);

    const loadTokenData = async () => {
        try {
            setLoading(true);
            const curveObj = await suiClient.getObject({
                id: id!,
                options: { showContent: true }
            });

            if (curveObj.data?.content?.dataType === 'moveObject') {
                const fields = curveObj.data.content.fields as any;

                const totalSupply = parseInt(fields.total_supply);
                const virtualSui = parseInt(fields.virtual_sui_reserves);
                const virtualTokens = parseInt(fields.virtual_token_reserves);
                const price = virtualTokens > 0 ? (virtualSui * 1_000_000_000) / virtualTokens : 1_000_000;
                const marketCap = (totalSupply * price) / 1_000_000_000;

                setToken({
                    id: id!,
                    tokenId: fields.token_id,
                    name: fields.metadata.fields.name,
                    symbol: fields.metadata.fields.symbol,
                    description: fields.metadata.fields.description,
                    imageUrl: fields.metadata.fields.image_url,
                    creator: fields.creator,
                    totalSupply,
                    virtualSuiReserves: virtualSui,
                    virtualTokenReserves: virtualTokens,
                    realSuiReserves: parseInt(fields.real_sui_reserves),
                    price,
                    marketCap,
                    volume: parseInt(fields.total_buy_volume),
                    graduated: fields.graduated,
                    launchTime: parseInt(fields.launch_timestamp),
                    twitter: fields.metadata.fields.twitter,
                    telegram: fields.metadata.fields.telegram,
                    website: fields.metadata.fields.website,
                });
            }
        } catch (err: any) {
            setError('Failed to load token: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadPriceHistory = async () => {
        try {
            const events = await suiClient.queryEvents({
                query: {
                    MoveEventType: `${PACKAGE_ID}::launchpad::TokensPurchased`
                },
                limit: 100,
                order: 'ascending'
            });

            const history: PricePoint[] = [];
            let count = 0;

            for (const event of events.data) {
                const eventData = event.parsedJson as any;
                if (eventData.token_id === id) {
                    history.push({
                        time: count.toString(),
                        price: parseFloat((eventData.new_price / 1_000_000_000).toFixed(6))
                    });
                    count++;
                }
            }

            if (history.length === 0) {
                history.push({ time: '0', price: 0.001 });
            }

            setPriceHistory(history);
        } catch (err) {
            console.error('Failed to load price history:', err);
            setPriceHistory([{ time: '0', price: 0.001 }]);
        }
    };

    const loadUserTokenBalances = async () => {
        if (!currentAccount?.address || !token) return;

        try {
            // Query all TokenBalance objects owned by user
            const objects = await suiClient.getOwnedObjects({
                owner: currentAccount.address,
                filter: {
                    StructType: `${PACKAGE_ID}::launchpad::TokenBalance`
                },
                options: {
                    showContent: true,
                    showType: true,
                }
            });

            const balances: TokenBalance[] = [];
            let total = 0;

            for (const obj of objects.data) {
                if (obj.data?.content?.dataType === 'moveObject') {
                    const fields = obj.data.content.fields as any;

                    // Only include balances for THIS specific token
                    if (fields.token_id === token.tokenId.toString()) {
                        const balance = parseInt(fields.coin.fields.balance);
                        balances.push({
                            objectId: obj.data.objectId,
                            balance,
                            tokenId: fields.token_id,
                            metadata: {
                                name: fields.metadata.fields.name,
                                symbol: fields.metadata.fields.symbol,
                                image_url: fields.metadata.fields.image_url,
                            }
                        });
                        total += balance;
                    }
                }
            }

            setUserTokenBalances(balances);
            setTotalUserBalance(total);
        } catch (err) {
            console.error('Failed to load user token balances:', err);
            setUserTokenBalances([]);
            setTotalUserBalance(0);
        }
    };

    const handleBuy = async () => {
        if (!buyAmount || parseFloat(buyAmount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setIsBuying(true);
        setError(null);
        setTxStatus(null);

        try {
            const suiAmountMist = Math.floor(parseFloat(buyAmount) * 1_000_000_000);
            const tx = new Transaction();

            const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(suiAmountMist)]);

            tx.moveCall({
                target: `${PACKAGE_ID}::launchpad::buy_tokens`,
                arguments: [
                    tx.object(PLATFORM_ID),
                    tx.object(id!),
                    coin,
                    tx.pure.u64(0),
                    tx.object(CLOCK_ID),
                ],
            });

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        setTxStatus('✅ Purchase successful! TokenBalance added to your wallet.');
                        await suiClient.waitForTransaction({ digest: result.digest });
                        setBuyAmount('');
                        loadTokenData();
                        loadUserTokenBalances();
                        loadPriceHistory();
                        setTimeout(() => setTxStatus(null), 5000);
                    },
                    onError: (err) => {
                        setError('Buy failed: ' + err.message);
                    }
                }
            );
        } catch (err: any) {
            setError('Buy failed: ' + err.message);
        } finally {
            setIsBuying(false);
        }
    };

    const handleSell = async () => {
        if (!sellBalanceId) {
            setError('Please select a TokenBalance to sell');
            return;
        }

        setIsSelling(true);
        setError(null);
        setTxStatus(null);

        try {
            const tx = new Transaction();

            tx.moveCall({
                target: `${PACKAGE_ID}::launchpad::sell_tokens`,
                arguments: [
                    tx.object(PLATFORM_ID),
                    tx.object(id!),
                    tx.object(sellBalanceId), // Pass the TokenBalance object
                    tx.pure.u64(0),
                    tx.object(CLOCK_ID),
                ],
            });

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        setTxStatus('✅ Tokens sold successfully!');
                        await suiClient.waitForTransaction({ digest: result.digest });
                        setSellBalanceId('');
                        loadTokenData();
                        loadUserTokenBalances();
                        loadPriceHistory();
                        setTimeout(() => setTxStatus(null), 5000);
                    },
                    onError: (err) => {
                        setError('Sell failed: ' + err.message);
                    }
                }
            );
        } catch (err: any) {
            setError('Sell failed: ' + err.message);
        } finally {
            setIsSelling(false);
        }
    };

    const formatNumber = (num: number) => {
        // First convert from smallest unit to actual tokens (9 decimals)
        const tokens = num / 1e9;

        if (tokens >= 1e9) return (tokens / 1e9).toFixed(2) + 'B';
        if (tokens >= 1e6) return (tokens / 1e6).toFixed(2) + 'M';
        if (tokens >= 1e3) return (tokens / 1e3).toFixed(2) + 'K';
        if (tokens >= 1) return tokens.toFixed(2);
        return tokens.toFixed(4); // Show more decimals for small amounts
    };

    const formatSUI = (mist: number) => {
        return (mist / 1e9).toFixed(4) + ' SUI';
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-20 md:pt-32 flex items-center justify-center bg-white px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-neo-pink mx-auto mb-4"></div>
                    <p className="text-xl font-bold uppercase">Loading token...</p>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen pt-20 md:pt-32 px-4 md:px-6 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                        <p className="font-black text-xl uppercase">Token not found</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 md:pt-32 pb-10 md:pb-20 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <button
                    onClick={() => navigate('/tokens')}
                    className="mb-6 md:mb-8 flex items-center gap-2 bg-white border-2 border-black px-4 py-2 font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-sm md:text-base"
                >
                    <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                    Back
                </button>

                <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Left Column - Token Info */}
                    <div className="lg:col-span-2 space-y-4 md:space-y-6">
                        {/* Header */}
                        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 md:p-8">
                            <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                                <div className="w-20 h-20 md:w-24 md:h-24 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center bg-neo-yellow overflow-hidden flex-shrink-0">
                                    {token.imageUrl ? (
                                        <img src={token.imageUrl} alt={token.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl md:text-4xl font-black">{token.symbol?.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex-1 w-full">
                                    <h1 className="text-2xl md:text-4xl font-black uppercase mb-2 break-words">{token.name}</h1>
                                    <p className="text-lg md:text-xl font-bold border-2 border-black inline-block px-2 md:px-3 py-1 bg-gray-100">${token.symbol}</p>
                                    {token.graduated && (
                                        <div className="mt-3 bg-neo-green border-2 border-black px-3 py-1 inline-block font-black uppercase text-xs md:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            ✨ Graduated
                                        </div>
                                    )}
                                </div>
                            </div>

                            {token.description && (
                                <p className="mt-4 md:mt-6 text-sm md:text-base text-gray-700 font-medium break-words">{token.description}</p>
                            )}

                            {/* Wallet Info */}
                            <div className="mt-4 bg-green-50 border-2 border-green-300 p-3 md:p-4 flex items-start gap-2">
                                <Info className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs md:text-sm">
                                    <p className="font-bold text-green-900 mb-1">✅ Wallet Display Fixed!</p>
                                    <p className="text-green-800">Your {token.symbol} tokens now appear with the correct name and icon in your wallet as TokenBalance objects!</p>
                                </div>
                            </div>

                            {/* Social Links */}
                            {(token.twitter || token.telegram || token.website) && (
                                <div className="mt-4 md:mt-6 flex flex-wrap gap-2 md:gap-3">
                                    {token.twitter && (
                                        <a href={token.twitter} target="_blank" rel="noopener noreferrer" className="bg-neo-blue border-2 border-black px-3 md:px-4 py-2 font-bold uppercase text-xs md:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
                                            Twitter <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                                        </a>
                                    )}
                                    {token.telegram && (
                                        <a href={token.telegram} target="_blank" rel="noopener noreferrer" className="bg-neo-pink border-2 border-black px-3 md:px-4 py-2 font-bold uppercase text-xs md:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
                                            Telegram <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                                        </a>
                                    )}
                                    {token.website && (
                                        <a href={token.website} target="_blank" rel="noopener noreferrer" className="bg-neo-yellow border-2 border-black px-3 md:px-4 py-2 font-bold uppercase text-xs md:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
                                            Website <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {[
                                { label: 'Price', value: formatSUI(token.price), icon: DollarSign },
                                { label: 'Market Cap', value: formatSUI(token.marketCap), icon: TrendingUp },
                                { label: 'Supply', value: formatNumber(token.totalSupply), icon: Users },
                                { label: 'Volume', value: formatSUI(token.volume), icon: Clock },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 md:p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <stat.icon className="h-3 w-3 md:h-4 md:w-4" />
                                        <p className="text-xs md:text-sm font-bold uppercase text-gray-600">{stat.label}</p>
                                    </div>
                                    <p className="text-lg md:text-xl font-black break-all">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Price Chart */}
                        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 md:p-6">
                            <h3 className="font-black text-lg md:text-xl uppercase mb-4">Price Chart</h3>
                            <div className="h-48 md:h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={priceHistory}>
                                        <XAxis dataKey="time" hide />
                                        <YAxis domain={['auto', 'auto']} />
                                        <Tooltip
                                            contentStyle={{
                                                border: '2px solid black',
                                                borderRadius: 0,
                                                fontWeight: 'bold'
                                            }}
                                            formatter={(value: number) => `${value.toFixed(6)} SUI`}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#000"
                                            strokeWidth={2}
                                            dot={{ fill: '#000', r: 3 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Trading */}
                    <div className="space-y-4 md:space-y-6">
                        {/* User Balance */}
                        {currentAccount && (
                            <div className="bg-neo-yellow border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 md:p-6">
                                <h3 className="font-black text-lg md:text-xl uppercase mb-3">Your Balance</h3>
                                <p className="text-2xl md:text-3xl font-black break-all">{formatNumber(totalUserBalance)}</p>
                                <p className="text-xs md:text-sm font-bold text-gray-700 mt-1">{token.symbol} tokens</p>
                                {userTokenBalances.length > 0 && (
                                    <p className="text-xs text-gray-600 mt-2">
                                        ({userTokenBalances.length} TokenBalance object{userTokenBalances.length > 1 ? 's' : ''})
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Trading Tabs */}
                        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex border-b-2 border-black">
                                <button
                                    onClick={() => setActiveTab('buy')}
                                    className={`flex-1 py-3 md:py-4 font-black uppercase text-sm md:text-base ${activeTab === 'buy'
                                        ? 'bg-neo-green'
                                        : 'bg-white hover:bg-gray-50'
                                        } transition-colors`}
                                >
                                    Buy
                                </button>
                                <div className="w-0.5 bg-black"></div>
                                <button
                                    onClick={() => setActiveTab('sell')}
                                    className={`flex-1 py-3 md:py-4 font-black uppercase text-sm md:text-base ${activeTab === 'sell'
                                        ? 'bg-neo-pink'
                                        : 'bg-white hover:bg-gray-50'
                                        } transition-colors`}
                                >
                                    Sell
                                </button>
                            </div>

                            <div className="p-4 md:p-6">
                                {activeTab === 'buy' ? (
                                    <>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Amount in SUI"
                                            value={buyAmount}
                                            onChange={(e) => setBuyAmount(e.target.value)}
                                            className="w-full border-2 border-black px-3 md:px-4 py-2 md:py-3 font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-neo-blue text-sm md:text-base"
                                        />
                                        <button
                                            onClick={handleBuy}
                                            disabled={isBuying || !currentAccount}
                                            className="w-full bg-neo-green border-2 border-black text-black px-4 md:px-6 py-2 md:py-3 font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
                                        >
                                            {isBuying ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                                                    Buying...
                                                </>
                                            ) : (
                                                'Buy Tokens'
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {userTokenBalances.length > 0 ? (
                                            <>
                                                <select
                                                    value={sellBalanceId}
                                                    onChange={(e) => setSellBalanceId(e.target.value)}
                                                    className="w-full border-2 border-black px-3 md:px-4 py-2 md:py-3 font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-neo-pink text-sm md:text-base"
                                                >
                                                    <option value="">Select TokenBalance to sell</option>
                                                    {userTokenBalances.map(balance => (
                                                        <option key={balance.objectId} value={balance.objectId}>
                                                            {formatNumber(balance.balance)} {balance.metadata.symbol}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={handleSell}
                                                    disabled={isSelling || !sellBalanceId}
                                                    className="w-full bg-neo-pink border-2 border-black text-black px-4 md:px-6 py-2 md:py-3 font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
                                                >
                                                    {isSelling ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                                                            Selling...
                                                        </>
                                                    ) : (
                                                        'Sell Tokens'
                                                    )}
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-center py-6 md:py-8">
                                                <p className="text-sm md:text-base font-bold text-gray-600">You don't have any tokens to sell</p>
                                                <button
                                                    onClick={() => setActiveTab('buy')}
                                                    className="mt-4 bg-neo-green border-2 border-black px-4 md:px-6 py-2 font-bold uppercase text-xs md:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                                                >
                                                    Buy Tokens
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Status Messages */}
                        {error && (
                            <div className="bg-red-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 md:p-4 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs md:text-sm font-bold text-red-800 break-words">{error}</p>
                            </div>
                        )}

                        {txStatus && (
                            <div className="bg-green-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 md:p-4">
                                <p className="text-xs md:text-sm font-bold text-green-800 break-words">{txStatus}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
