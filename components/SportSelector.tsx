'use client';

import { useState } from 'react';

export type Sport = 'NFL' | 'NHL';

interface SportSelectorProps {
    selectedSport: Sport;
    onSportChange: (sport: Sport) => void;
}

export default function SportSelector({ selectedSport, onSportChange }: SportSelectorProps) {
    return (
        <div className="flex items-center space-x-2 bg-slate-800 rounded-lg p-1">
            <button
                onClick={() => onSportChange('NFL')}
                className={`px-6 py-2 rounded-md font-semibold transition-all ${selectedSport === 'NFL'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
            >
                🏈 NFL
            </button>
            <button
                onClick={() => onSportChange('NHL')}
                className={`px-6 py-2 rounded-md font-semibold transition-all ${selectedSport === 'NHL'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
            >
                🏒 NHL
            </button>
        </div>
    );
}
