import axios from 'axios';
import { Game } from '@/types';

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl';

export class NHLAPI {
    /**
     * Get current NHL scoreboard
     */
    static async getScoreboard(seasonYear?: number, date?: string) {
        try {
            let url = `${ESPN_API_BASE}/scoreboard`;
            const params: any = {};

            if (date) {
                params.dates = date.replace(/-/g, ''); // ESPN expects YYYYMMDD
            }

            const response = await axios.get(url, { params });
            return response.data;
        } catch (error) {
            console.error('NHL API Error:', error);
            throw error;
        }
    }

    /**
     * Get team details (Stub for compatibility)
     */
    static async getTeam(teamId: string) {
        // Basic implementation or placeholder
        return {};
    }

    /**
     * Transform ESPN game data to our Game type
     * Note: NHL doesn't strictly have "weeks" like NFL, but we'll map current date context
     */
    static transformToGame(espnGame: any): Game {
        const competition = espnGame.competitions?.[0];
        const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
        const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

        return {
            id: espnGame.id,
            season: parseInt(espnGame.season?.year || new Date().getFullYear()),
            week: 1, // Placeholder for NHL (daily sport)
            homeTeam: {
                id: homeTeam?.team?.id || '',
                name: homeTeam?.team?.displayName || '',
                abbreviation: homeTeam?.team?.abbreviation || '',
                logo: homeTeam?.team?.logo || '',
                conference: 'NHL', // Generic for now
                division: '',
            },
            awayTeam: {
                id: awayTeam?.team?.id || '',
                name: awayTeam?.team?.displayName || '',
                abbreviation: awayTeam?.team?.abbreviation || '',
                logo: awayTeam?.team?.logo || '',
                conference: 'NHL',
                division: '',
            },
            gameTime: new Date(espnGame.date),
            venue: competition?.venue?.fullName || '',
            homeScore: parseInt(homeTeam?.score || 0),
            awayScore: parseInt(awayTeam?.score || 0),
            status: this.mapGameStatus(espnGame.status?.type?.state),
        };
    }

    private static mapGameStatus(espnStatus: string): Game['status'] {
        switch (espnStatus?.toLowerCase()) {
            case 'pre':
                return 'scheduled';
            case 'in':
                return 'in_progress';
            case 'post':
                return 'completed';
            default:
                return 'scheduled';
        }
    }

    /**
     * Get games for a specific date (or "today" if no date)
     */
    static async getGames(date?: string): Promise<Game[]> {
        const scoreboard = await this.getScoreboard(undefined, date);
        return scoreboard.events?.map((event: any) => this.transformToGame(event)) || [];
    }
}
