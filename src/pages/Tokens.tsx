import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, TrendingUp, Users, DollarSign, Rocket, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

// Configuration
const PACKAGE_ID = "0xcd4378bfafc0abf1360405548f33bf64c46785886fc7fd9a302a4ad3c8051ebd";

interface Token {
  id: string;
  tokenId: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  creator: string;
  totalSupply: number;
  price: number;
  marketCap: number;
  volume: number;
  graduated: boolean;
  launchTime: number;
}

export function Tokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const suiClient = useSuiClient();
  const navigate = useNavigate();

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      setLoading(true);

      // Get all TokenLaunched events
      const response = await suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::launchpad::TokenLaunched`
        },
        limit: 50,
        order: 'descending'
      });

      const tokenData = await Promise.all(
        response.data.map(async (event: any) => {
          const curveId = event.parsedJson.curve_id;

          try {
            const curveObj = await suiClient.getObject({
              id: curveId,
              options: { showContent: true }
            });

            if (curveObj.data?.content?.dataType === 'moveObject') {
              const fields = curveObj.data.content.fields as any;

              // Calculate stats
              const totalSupply = parseInt(fields.total_supply);
              const virtualSui = parseInt(fields.virtual_sui_reserves);
              const virtualTokens = parseInt(fields.virtual_token_reserves);
              const price = virtualTokens > 0
                ? (virtualSui * 1_000_000_000) / virtualTokens
                : 1_000_000;
              const marketCap = (totalSupply * price) / 1_000_000_000;

              return {
                id: curveId,
                tokenId: fields.token_id,
                name: fields.metadata.fields.name,
                symbol: fields.metadata.fields.symbol,
                description: fields.metadata.fields.description,
                imageUrl: fields.metadata.fields.image_url,
                creator: fields.creator,
                totalSupply,
                price,
                marketCap,
                volume: parseInt(fields.total_buy_volume),
                graduated: fields.graduated,
                launchTime: parseInt(fields.launch_timestamp),
              };
            }
          } catch (err) {
            console.error('Error loading token:', err);
            return null;
          }
        })
      );

      setTokens(tokenData.filter((t): t is Token => t !== null));
    } catch (err: any) {
      setError('Failed to load tokens: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatSUI = (mist: number) => {
    return (mist / 1e9).toFixed(4) + ' SUI';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-neo-pink mx-auto mb-4"></div>
          <p className="text-xl font-bold uppercase">Loading tokens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1 h-6 w-6" />
            <div>
              <h3 className="font-black text-xl text-red-900 uppercase">Error Loading Tokens</h3>
              <p className="text-red-800 font-medium mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12 text-center">
          <h1 className="text-6xl md:text-7xl font-black mb-4 uppercase tracking-tighter" style={{ WebkitTextStroke: "2px black", color: "white", textShadow: "4px 4px 0px #000" }}>
            Launched <span className="text-neo-yellow" style={{ WebkitTextStroke: "2px black", textShadow: "4px 4px 0px #000" }}>Tokens</span>
          </h1>
          <p className="text-xl font-bold border-2 border-black inline-block px-6 py-2 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Discover and trade newly launched tokens
          </p>
        </div>

        {tokens.length === 0 ? (
          <div className="text-center py-16 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto">
            <Rocket className="mx-auto h-16 w-16 text-black mb-6" />
            <h3 className="text-2xl font-black text-black mb-2 uppercase">No tokens launched yet</h3>
            <p className="text-gray-600 font-bold mb-8 text-lg">Be the first to launch a token!</p>
            <button
              onClick={() => navigate('/launchpad')}
              className="bg-neo-pink border-2 border-black text-black px-8 py-3 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Launch Token
            </button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {tokens.map((token) => (
              <motion.div
                key={token.id}
                whileHover={{ y: -5 }}
                onClick={() => navigate(`/token/${token.id}`)}
                className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer overflow-hidden flex flex-col h-full"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-black font-black text-2xl flex-shrink-0 bg-neo-yellow overflow-hidden">
                      {token.imageUrl ? (
                        <img src={token.imageUrl} alt={token.name} className="w-full h-full object-cover" />
                      ) : (
                        token.symbol?.charAt(0) || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-2xl truncate uppercase">{token.name}</h3>
                      <p className="text-black font-bold border-2 border-black inline-block px-2 bg-gray-100 text-sm">${token.symbol}</p>
                    </div>
                  </div>

                  {token.graduated && (
                    <div className="mb-4 bg-neo-green border-2 border-black p-2 text-center font-black uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      ✨ Graduated
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm border-b-2 border-gray-100 pb-2">
                      <span className="text-gray-600 font-bold flex items-center gap-1 uppercase">
                        <DollarSign className="h-4 w-4" />
                        Price
                      </span>
                      <span className="font-black">{formatSUI(token.price)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm border-b-2 border-gray-100 pb-2">
                      <span className="text-gray-600 font-bold flex items-center gap-1 uppercase">
                        <TrendingUp className="h-4 w-4" />
                        Market Cap
                      </span>
                      <span className="font-black">{formatSUI(token.marketCap)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-bold flex items-center gap-1 uppercase">
                        <Users className="h-4 w-4" />
                        Supply
                      </span>
                      <span className="font-black">{formatNumber(token.totalSupply)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-black bg-gray-50 px-6 py-3 flex items-center justify-center gap-2 font-black uppercase text-sm hover:bg-neo-yellow transition-colors">
                  Trade Now
                  <ExternalLink className="h-4 w-4" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}