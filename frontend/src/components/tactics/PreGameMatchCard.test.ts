import { describe, expect, it } from 'vitest';
import { pregameLogistics, type PreGameData } from './PreGameMatchCard';

const briefing = (o: Partial<PreGameData> = {}): PreGameData => ({
    id: 'b', seasonId: 's', opponentName: 'GMVT TEAM', jerseyColor: '', venue: '', tacticalKeys: [], startingFive: [], generatedByAi: true, ...o
});

describe('odprawa — logistyka', () => {
    it('bez danych nie zmyśla godzin ani stroju', () => {
        expect(pregameLogistics(briefing())).toEqual({ date: '—', tipoff: '—', gathering: '—', kit: 'trener poda', venue: '—' });
    });

    it('terminarz i dzień meczowy mają pierwszeństwo przed zapisem odprawy', () => {
        const l = pregameLogistics(
            briefing({ tipoffTime: '18:30', gatheringTime: '17:45', jerseyColor: 'Czarne', venue: 'Hala Sportowa, Bobolice' }),
            { date: '2026-10-18T12:40:00.000Z', venue: 'ZOS - KOSiR', gatheringTime: '13:55', kit: 'Białe' }
        );
        expect(l).toMatchObject({ tipoff: '14:40', gathering: '13:55', kit: 'Białe', venue: 'ZOS - KOSiR', date: '18.10.2026' });
    });
});
