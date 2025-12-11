
export interface StakingRecommendation {
    units: number; // 0.0 to 5.0 (max stake)
    message: string;
    riskType: 'Aggressive' | 'Standard' | 'Conservative' | 'Pass';
}

/**
 * Calculates optimal stake size using Kelly Criterion
 * @param winProbability Model's confidence (0.00 to 1.00)
 * @param odds Decimal odds (e.g., 1.91 for -110)
 * @param fractionalKelly Safety multiplier (default 0.25 to be safe)
 */
export const calculateKellyStake = (
    winProbability: number,
    odds: number = 1.91, // Standard -110 odds
    fractionalKelly: number = 0.25
): StakingRecommendation => {

    // Kelly Formula: f = (bp - q) / b
    // b = net odds (decimal odds - 1)
    // p = probability of winning
    // q = probability of losing (1 - p)

    const b = odds - 1;
    const p = winProbability;
    const q = 1 - p;

    const fullKelly = (b * p - q) / b;

    // If negative edge, don't bet
    if (fullKelly <= 0) {
        return {
            units: 0,
            message: 'Negative edge - DO NOT BET',
            riskType: 'Pass'
        };
    }

    // Apply safety fraction
    const safeStakePct = fullKelly * fractionalKelly;

    // Convert percentage to "Units" (assuming 1 Unit = 1% of bankroll for standard)
    // But let's simplify: Max standard bet = 3-5 units
    // Let's interpret the result:
    // If safeStakePct is 0.05 (5%), typically that's a HUGE bet (5 units or so)

    let units = safeStakePct * 100; // Convert to raw units (approx 1% = 1u)

    // Clamp to reasonable limits
    if (units > 5) units = 5.0; // Max whale bet
    if (units < 0.25) units = 0.0; // Noise floor

    // Round to nearest 0.1
    units = Math.round(units * 10) / 10;

    let riskType: StakingRecommendation['riskType'] = 'Standard';
    let message = `Bet ${units} units`;

    if (units === 0) {
        riskType = 'Pass';
        message = 'Edge too small to bet';
    } else if (units >= 3.0) {
        riskType = 'Aggressive';
        message = '🔥 MAX BET Opportunity';
    } else if (units <= 0.5) {
        riskType = 'Conservative';
        message = 'Small value play';
    }

    return {
        units,
        message,
        riskType
    };
};
