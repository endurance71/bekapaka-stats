import { describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/prisma.js', () => ({ prisma: {} }));
import { updateMatchPresentation } from '../../matchPresentation.js';
import { kalkMatchToListItem } from '../../kalk/kalkGameView.js';
import { resolvePresentation } from '../../../packages/match-presentation/index.js';
describe('Presentation persistence', () => {
 it('uses the composite season identity and writes only override fields', async () => {
  const kalkMatch={findUnique:vi.fn(async () => ({seasonId:'s'})),update:vi.fn(async args => args.data)};
  await updateMatchPresentation({kalkMatch},{source:'kalk',seasonId:'s',id:'42',presentation:{status:'LIVE',scoreUs:0}});
  expect(kalkMatch.update.mock.calls[0][0].where).toEqual({seasonId_id:{seasonId:'s',id:'42'}});
  expect(Object.keys(kalkMatch.update.mock.calls[0][0].data).sort()).toEqual(['presentation','presentationUpdatedAt']);
 });
 it('cannot edit another season or choose an arbitrary model', async () => {
  const game={findUnique:vi.fn(async () => ({seasonId:'other'})),update:vi.fn()};
  expect(await updateMatchPresentation({game},{source:'game',seasonId:'s',id:'42',presentation:null})).toBeNull(); expect(game.update).not.toHaveBeenCalled();
  await expect(updateMatchPresentation({game},{source:'user',seasonId:'s',id:'42',presentation:{}})).rejects.toThrow();
 });
 it('restores SQL NULL without changing imported scores', async () => { const game={findUnique:vi.fn(async () => ({seasonId:'s'})),update:vi.fn(async args=>args.data)}; const result=await updateMatchPresentation({game,jsonNull:'db-null'},{source:'game',seasonId:'s',id:'42',presentation:null});expect(result.presentation).toBe('db-null') });
 it('orients away scores with BeKaPaKa on the left and keeps overrides', () => {
  const row={id:'42',seasonId:'s',date:new Date(),homeTeamName:'Rywal',guestTeamName:'BeKaPaKa Bobolice',scoreHome:20,scoreAway:86,isFinished:true,presentation:{status:'BREAK',scoreUs:0}};
  const list=kalkMatchToListItem(row); expect(list.scoreUs).toBe(86);expect(list.scoreThem).toBe(20);
  const afterImport=resolvePresentation(kalkMatchToListItem({...row,scoreAway:90}));expect(afterImport.status).toBe('BREAK');expect(afterImport.scoreUs).toBe(0);
 });
});
