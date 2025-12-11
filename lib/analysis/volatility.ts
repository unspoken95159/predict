
import { Game, WeatherData, BettingLine } from '@/types';

export interface VolatilityScore {
    score: number; // 0-100 (0 = Safe, 100 = Extremely Volatile)
    riskLevel: 'Stable' | 'Moderate' | 'Volatile' | 'High Risk';
    factors: string[];
    color: string;
}

export const calculateVolatility = (
    game: Game,
    activeSpread: number,
    vegasSpread: number
): VolatilityScore => {
    let score = 0;
    let factors: string[] = [];

    // 1. Weather Factor (High Impact)
    if (game.weather) {
        if (game.weather.windSpeed > 15) {
            score += 20;
            factors.push(`High Winds (${game.weather.windSpeed}mph)`);
        } else if (game.weather.windSpeed > 10) {
            score += 10;
            factors.push(`Moderate Winds (${game.weather.windSpeed}mph)`);
        }

        if (game.weather.precipitation > 50) {
            score += 15;
            factors.push('High Precipitation Chance');
        } else if (game.weather.temperature < 32 && !game.weather.isDome) {
            score += 10;
            factors.push('Freezing Conditions');
        }
    }

    // 2. Spread Dynamics (Variance Impact)
    // Large spreads mean higher variance in actual outcome vs covered spread
    const absSpread = Math.abs(activeSpread);
    if (absSpread > 14) {
        score += 15;
        factors.push('Massive Spread (>14 pts)');
    } else if (absSpread > 10) {
        score += 10;
        factors.push('Large Spread (>10 pts)');
    }

    // Check for large divergence between Model and Vegas (Uncertainty)
    const divergence = Math.abs(activeSpread - vegasSpread);
    if (divergence > 7) {
        score += 25;
        factors.push(`High Uncertainty (Model-Vegas Diff: ${divergence.toFixed(1)})`);
    } else if (divergence > 4) {
        score += 10;
        factors.push('Moderate Uncertainty');
    }

    // 3. Game Context
    // Divisional games are often closer and more volatile
    if (game.homeTeam.division === game.awayTeam.division) {
        score += 10;
        factors.push('Divisional Rivalry');
    }

    // Cap score at 100
    score = Math.min(100, score);

    // Determine Risk Level
    let riskLevel: VolatilityScore['riskLevel'] = 'Stable';
    let color = 'text-green-500';

    if (score >= 70) {
        riskLevel = 'High Risk';
        color = 'text-red-600';
    } else if (score >= 45) {
        riskLevel = 'Volatile';
        color = 'text-orange-500';
    } else if (score >= 25) {
        riskLevel = 'Moderate';
        color = 'text-yellow-500';
    }

    return {
        score,
        riskLevel,
        factors,
        color
    };
};
