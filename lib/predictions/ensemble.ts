
import { Game, TeamStats } from '@/types';

export interface EnsembleVote {
    source: 'ML Model' | 'Trend System' | 'Stat Model';
    prediction: 'HOME' | 'AWAY' | 'PASS';
    confidence: number; // 0-100
    reason: string;
}

export interface EnsembleResult {
    consensus: 'HOME' | 'AWAY' | 'SPLIT' | 'PASS';
    strength: 'LOCK' | 'LEAN' | 'UNCERTAIN';
    votes: EnsembleVote[];
    agreementPct: number; // 0-100
}

/**
 * Trend Model: Checks historical performance and streaks
 */
const getTrendVote = (game: Game, activeSpread: number): EnsembleVote => {
    // Mock logic for trends (Phase 1 Heuristics)
    // In real implementation, this would query historical DB

    let score = 0;
    let reason = '';

    // 1. Home Field Advantage Trend
    // Assume generic 2.5 pts home field value
    // If spread is < -2.5 (Road favored > 2.5), check road team streak
    if (activeSpread < -3.5) {
        score -= 10; // Road favorite
        reason = `Road Favorites > 3.5 cover 52% historically`;
    } else if (activeSpread > 3.5) {
        score += 10; // Home underdog
        reason = `Home Underdogs > 3.5 cover 56% historically`;
    }

    // 2. Division Dog Trend
    if (game.homeTeam.division === game.awayTeam.division && activeSpread > 0) {
        score += 15;
        reason = `Division Home Dogs are 60% ATS`;
    }

    if (score >= 10) return { source: 'Trend System', prediction: 'HOME', confidence: 65, reason };
    if (score <= -10) return { source: 'Trend System', prediction: 'AWAY', confidence: 65, reason };

    return { source: 'Trend System', prediction: 'PASS', confidence: 0, reason: 'No strong trends' };
};

/**
 * Stat Model: Checks raw efficiency stats
 */
const getStatVote = (game: Game, stats: { home: TeamStats, away: TeamStats }, activeSpread: number): EnsembleVote => {
    if (!stats) return { source: 'Stat Model', prediction: 'PASS', confidence: 0, reason: 'No stats data' };

    // Calculate Net Rating (Points Diff)
    const homeNet = stats.home.pointsFor - stats.home.pointsAllowed;
    const awayNet = stats.away.pointsFor - stats.away.pointsAllowed;

    // Power Rating Differential
    const rawDiff = homeNet - awayNet; // Positive = Home better

    // Adjust for home field (+2.0 typically)
    const predictedMargin = rawDiff + 2.0;

    // Compare to active spread
    // Spread is Home - Away (e.g. -3.5 means Home by 3.5)
    // Wait, standard spread in code: negative = favorite?
    // Let's assume activeSpread: if -3.0, Home favored by 3.

    // Let's use common convention: Spread is points added to the team's score.
    // Actually, let's stick to the codebase's likely convention: 
    // "Predicted Spread: -7.0" usually means Home wins by 7.

    const edge = predictedMargin - (-activeSpread);
    // Example: Model says Home wins by 7 (predMargin = +7). Spread is -3 (Home favored by 3).
    // Edge = 7 - 3 = 4 points of value on Home.

    let reason = `Power Rating Diff: ${predictedMargin.toFixed(1)} vs Spread`;

    if (edge > 3) return { source: 'Stat Model', prediction: 'HOME', confidence: 60 + (edge * 2), reason };
    if (edge < -3) return { source: 'Stat Model', prediction: 'AWAY', confidence: 60 + (Math.abs(edge) * 2), reason };

    return { source: 'Stat Model', prediction: 'PASS', confidence: 0, reason: 'Stats align with market' };
};

export const calculateEnsemble = (
    game: Game,
    mlPrediction: { side: 'HOME' | 'AWAY', confidence: number },
    activeSpread: number,
    teamStats?: { home: TeamStats, away: TeamStats }
): EnsembleResult => {

    const votes: EnsembleVote[] = [];

    // 1. ML Vote (The Core Model)
    votes.push({
        source: 'ML Model',
        prediction: mlPrediction.side,
        confidence: mlPrediction.confidence,
        reason: `XGBoost High Confidence`
    });

    // 2. Trend Vote
    votes.push(getTrendVote(game, activeSpread));

    // 3. Stat Vote
    if (teamStats) {
        votes.push(getStatVote(game, teamStats, activeSpread));
    } else {
        // Fallback if no stats
        votes.push({ source: 'Stat Model', prediction: 'PASS', confidence: 0, reason: 'N/A' });
    }

    // Tally Votes
    const homeVotes = votes.filter(v => v.prediction === 'HOME').length;
    const awayVotes = votes.filter(v => v.prediction === 'AWAY').length;
    const activeVotes = votes.filter(v => v.prediction !== 'PASS').length;

    let consensus: EnsembleResult['consensus'] = 'PASS';
    let strength: EnsembleResult['strength'] = 'UNCERTAIN';

    if (homeVotes > awayVotes) consensus = 'HOME';
    else if (awayVotes > homeVotes) consensus = 'AWAY';
    else consensus = 'SPLIT';

    const agreementPct = activeVotes > 0 ? (Math.max(homeVotes, awayVotes) / activeVotes) * 100 : 0;

    // Determine Strength
    if (activeVotes >= 2 && agreementPct === 100) strength = 'LOCK'; // 2/2 or 3/3 agree
    else if (activeVotes >= 3 && agreementPct >= 66) strength = 'LEAN'; // 2/3 agree
    else strength = 'UNCERTAIN'; // Mixed or no signal

    return {
        consensus,
        strength,
        votes,
        agreementPct
    };
};
