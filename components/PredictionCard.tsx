
import React, { useMemo } from 'react';
import { calculateVolatility } from '@/lib/analysis/volatility';
import { calculateKellyStake } from '@/lib/analysis/staking';
import { calculateEnsemble } from '@/lib/predictions/ensemble';
import { Game } from '@/types'; // Assuming this exists or we mock it
import { TrendingUp, Shield, AlertTriangle, DollarSign } from 'lucide-react';

interface PredictionCardProps {
    prediction: any; // Using any for flexibility to match page's data structure
    showAnalysis?: boolean;
}

export default function PredictionCard({ prediction, showAnalysis = true }: PredictionCardProps) {
    const isComplete = prediction.status === 'completed' && prediction.actualHomeScore !== undefined;
    const actualSpread = isComplete ? (prediction.actualHomeScore - prediction.actualAwayScore) : 0;
    const actualTotal = isComplete ? (prediction.actualHomeScore + prediction.actualAwayScore) : 0;

    const gameMock: any = {
        id: prediction.gameId,
        homeTeam: { name: prediction.homeTeam, division: 'Unknown' }, // Division needed for rivalry check
        awayTeam: { name: prediction.awayTeam, division: 'Unknown' },
        weather: { windSpeed: 5, precipitation: 0, temperature: 70, isDome: false } // Default to safe weather if unknown
    };

    // FIX: Normalize Model Spread to Betting Convention
    // Model 'predictedSpread' is usually Home Margin (Positive = Home Win).
    // Vegas 'vegasSpread' is Betting Line (Negative = Home Fav).
    // So we calculate Implied Line = -1 * Predicted Margin.
    const impliedLine = -1 * prediction.predictedSpread;

    // 1. Calculate Volatility
    const volatility = useMemo(() => {
        return calculateVolatility(
            gameMock,
            impliedLine,
            prediction.vegasSpread || impliedLine
        );
    }, [prediction, impliedLine]);

    // 2. Calculate Staking
    const staking = useMemo(() => {
        // Convert confidence (0-100) to decimal (0-1)
        return calculateKellyStake(prediction.confidence / 100, 1.91);
    }, [prediction.confidence]);

    // 3. Calculate Ensemble
    const ensemble = useMemo(() => {
        return calculateEnsemble(
            gameMock,
            { side: prediction.predictedWinner === prediction.homeTeam ? 'HOME' : 'AWAY', confidence: prediction.confidence },
            impliedLine
        );
    }, [prediction, impliedLine]);

    // 4. Calculate Safest Bet (Edge Analysis)
    const safestBet = useMemo(() => {
        // If no Vegas lines, we can't determine an edge vs market
        if (!prediction.vegasSpread || !prediction.vegasTotal) return null;

        // Calculate Edge (Model Diff vs Vegas)
        const spreadEdge = Math.abs(impliedLine - prediction.vegasSpread);
        const totalEdge = Math.abs(prediction.predictedTotal - prediction.vegasTotal);

        if (totalEdge > spreadEdge) {
            const side = prediction.predictedTotal > prediction.vegasTotal ? 'OVER' : 'UNDER';
            return {
                type: 'TOTAL',
                label: `${side} ${prediction.vegasTotal}`,
                edge: totalEdge,
                color: 'text-blue-700 bg-blue-50 border-blue-200'
            };
        } else {
            // Display the line we like.
            const team = impliedLine < prediction.vegasSpread ? prediction.homeTeam : prediction.awayTeam;

            // Show Vegas Line as the bet target
            const lineToBet = prediction.vegasSpread;
            const displayLine = team === prediction.homeTeam ? lineToBet : -lineToBet;
            const sign = displayLine > 0 ? '+' : '';

            return {
                type: 'SPREAD',
                label: `${team} ${sign}${displayLine?.toFixed(1)}`,
                edge: spreadEdge,
                color: 'text-purple-700 bg-purple-50 border-purple-200'
            };
        }
    }, [prediction, impliedLine]);

    return (
        <div className="grid grid-cols-[2fr_60px_1.5fr_1.5fr_1.5fr_1.5fr_100px] gap-2 px-3 py-2 border-b border-gray-200 hover:bg-gray-50 text-xs items-center relative group">

            {/* 1. Matchup Column */}
            <div>
                <div className="text-[10px] text-gray-500 mb-1">
                    {new Date(prediction.gameTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-1.5 mb-0.5">
                    {prediction.awayTeamLogo && <img src={prediction.awayTeamLogo} alt="" className="w-4 h-4" />}
                    <span className="text-gray-900 font-semibold">{prediction.awayTeam}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {prediction.homeTeamLogo && <img src={prediction.homeTeamLogo} alt="" className="w-4 h-4" />}
                    <span className="text-gray-900 font-semibold">{prediction.homeTeam}</span>
                </div>

                {/* NEW: Volatility/Risk Badge */}
                {showAnalysis && (
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                        <div className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${volatility.riskLevel === 'Stable' ? 'bg-green-50 text-green-700 border-green-200' :
                            volatility.riskLevel === 'High Risk' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>
                            <ActivityIcon className="w-2.5 h-2.5" />
                            <span>{volatility.riskLevel}</span>
                        </div>
                        {ensemble.strength === 'LOCK' && (
                            <div className="text-[9px] px-1.5 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-0.5">
                                <Shield className="w-2.5 h-2.5" />
                                <span>LOCK</span>
                            </div>
                        )}
                        {/* Safest Outcome Badge */}
                        {safestBet && (
                            <div className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${safestBet.color}`}>
                                <TargetIcon className="w-2.5 h-2.5" />
                                <span className="font-semibold">Best: {safestBet.label}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 2. Confidence */}
            <div className="text-center">
                <div className="text-blue-600 font-semibold">{prediction.confidence}%</div>
                {/* NEW: Staking Rec */}
                {showAnalysis && !isComplete && (
                    <div className="text-[9px] text-gray-500 mt-0.5 flex flex-col items-center">
                        <span className="bg-blue-50 text-blue-800 px-1 rounded">{staking.units}u</span>
                    </div>
                )}
            </div>

            {/* 3. Predicted Winner */}
            <div className="text-center">
                <div className="font-semibold text-gray-900">{prediction.predictedWinner}</div>
                <div className="text-[10px] text-gray-500">
                    {prediction.predictedAwayScore.toFixed(0)}-{prediction.predictedHomeScore.toFixed(0)}
                </div>
            </div>

            {/* 4. Spread */}
            <div className="text-center">
                <div className="font-semibold text-gray-900">
                    {prediction.homeTeam.split(' ').pop()} {prediction.predictedSpread > 0 ? '+' : ''}{prediction.predictedSpread.toFixed(1)}
                </div>
            </div>

            {/* 5. Vegas Line */}
            <div className="text-center">
                {prediction.vegasSpread ? (
                    <div className="font-semibold text-purple-600">
                        {prediction.vegasSpread > 0 ? '+' : ''}{prediction.vegasSpread.toFixed(1)}
                    </div>
                ) : <span className="text-gray-400">-</span>}
            </div>

            {/* 6. Total */}
            <div className="text-center">
                <div className="font-semibold text-gray-900">{prediction.predictedTotal.toFixed(1)}</div>
            </div>

            {/* 7. Result */}
            <div className="text-center">
                <div className={`text-[10px] font-semibold w-full py-1 rounded ${isComplete ? 'bg-gray-100' : 'bg-blue-50 text-blue-700'
                    }`}>
                    {isComplete ? 'Final' : prediction.status}
                </div>
            </div>
        </div>
    );
}

function ActivityIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}

function TargetIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    );
}
