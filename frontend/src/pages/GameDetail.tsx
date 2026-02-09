import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchJSON, putJSON } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Trophy,
  Download,
  Edit3,
  Save,
  X,
  Zap,
  BarChart2,
  Users,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../shared/lib/utils';
import BkpkCard from '../shared/ui/BkpkCard';
import BkpkButton from '../shared/ui/BkpkButton';
import BoxScoreModern from '../features/games/BoxScoreModern';
import TeamStats from '../components/games/TeamStats';
import DashboardMomentum from '../components/games/DashboardMomentum';
import OpponentComparison from '../components/games/OpponentComparison';

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ notes: '', mvp: '' });
  const [activeTab, setActiveTab] = useState<'bekapaka' | 'opponent'>('bekapaka');
  const [saving, setSaving] = useState(false);

  const fetchGame = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchJSON<any>(`/api/games/${id}`);
      setGame(data);
      setEditData({
        notes: data.notes || '',
        mvp: data.mvp || ''
      });
    } catch (error) {
      console.error('Błąd podczas pobierania meczu:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await putJSON(`/api/games/${id}`, {
        notes: editData.notes,
        mvp: editData.mvp
      });
      await fetchGame();
      setIsEditing(false);
    } catch (error) {
      alert('Błąd podczas zapisywania zmian');
    } finally {
      setSaving(false);
    }
  };

  const bekapaka = useMemo(() => game?.teams?.find((t: any) => t.isBekapaka) || game?.teams?.[0] || { name: 'BeKaPaKa', isBekapaka: true, players: [] }, [game]);
  const opponentTeam = useMemo(() => game?.teams?.find((t: any) => !t.isBekapaka) || game?.teams?.[1] || { name: game?.opponent || 'Rywal', isBekapaka: false, players: [] }, [game]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bkpk-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-bkpk-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-bkpk-text-secondary font-bold uppercase tracking-widest text-xs">Pobieranie danych meczu...</p>
        </div>
      </div>
    );
  }

  if (!game) return null;

  return (
    <div className="min-h-screen bg-bkpk-bg p-4 md:p-8 lg:p-12">
      <div className="max-w-[1400px] mx-auto space-y-12">
        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Link to="/games" className="group flex items-center gap-2 text-bkpk-text-secondary hover:text-bkpk-text-primary transition-colors">
            <div className="w-8 h-8 rounded-full bg-bkpk-surface-tint-2 flex items-center justify-center group-hover:bg-bkpk-surface-tint-4 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span className="font-bold uppercase tracking-wider text-xs">Powrót do Meczy</span>
          </Link>

          <div className="flex items-center gap-3">
            <BkpkButton variant="ghost" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Eksportuj JSON
            </BkpkButton>
            <BkpkButton
              variant={isEditing ? 'primary' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              loading={saving}
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isEditing ? 'Zapisz' : 'Edytuj'}
            </BkpkButton>
            {isEditing && (
              <BkpkButton variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </BkpkButton>
            )}
          </div>
        </div>

        {/* Immersive Scoreboard Header */}
        <section className="relative overflow-hidden rounded-bkpk-lg bg-bkpk-glass border border-bkpk-glass-border shadow-bkpk-glow p-8 md:p-12 lg:p-16">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
            {/* Home Team */}
            <div className="flex-1 flex flex-col items-center md:items-end gap-4">
              <div className="w-20 h-20 bg-bkpk-primary/20 rounded-3xl flex items-center justify-center border border-bkpk-primary/30">
                <span className="text-2xl font-bold text-bkpk-primary">BK</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black font-outfit text-bkpk-text-primary uppercase tracking-tighter">
                {bekapaka.name}
              </h2>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-7xl md:text-8xl font-black font-outfit text-bkpk-text-primary flex items-center gap-6 tabular-nums">
                <span>{game.scoreUs ?? 0}</span>
                <span className="text-white/10 text-4xl">:</span>
                <span>{game.scoreThem ?? 0}</span>
              </div>
              <div className="flex items-center gap-4 text-bkpk-text-secondary font-bold text-xs uppercase tracking-widest bg-bkpk-surface-tint-2 px-4 py-2 rounded-full border border-bkpk-border-strong">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-bkpk-primary" />
                  {new Date(game.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-bkpk-primary" />
                  {game.venue || 'Hala Bobolice'}
                </div>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex-1 flex flex-col items-center md:items-start gap-4">
              <div className="w-20 h-20 bg-bkpk-surface-tint-2 rounded-3xl flex items-center justify-center border border-bkpk-border-strong">
                <span className="text-2xl font-bold text-bkpk-text-secondary">OP</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black font-outfit text-bkpk-text-primary uppercase tracking-tighter">
                {opponentTeam.name}
              </h2>
            </div>
          </div>

          {/* Quarter Scores */}
          <div className="mt-12 flex justify-center gap-2 md:gap-4 overflow-x-auto pb-4">
            {game.quarters?.map((q: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[60px] bg-bkpk-surface-tint-2 border border-bkpk-border-strong px-4 py-2 rounded-xl">
                <span className="text-xs font-bold text-bkpk-text-muted uppercase">Q{i + 1}</span>
                <span className="text-lg font-black font-outfit text-bkpk-text-primary">{q.home}-{q.away}</span>
              </div>
            ))}
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/4 -u-translate-y-1/2 w-[500px] h-[500px] bg-bkpk-primary/10 rounded-full blur-[120px]" />
            <div className="absolute top-1/2 right-1/4 -u-translate-y-1/2 w-[500px] h-[500px] bg-bkpk-success/5 rounded-full blur-[120px]" />
          </div>
        </section>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-12">

            {/* Intelligent Insights */}
            <AnimatePresence>
              {game.insights && game.insights.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-bkpk-warning" />
                    <h3 className="text-xl font-bold text-bkpk-text-primary font-outfit">Inteligentne Wnioski</h3>
                  </div>
                  <div className="grid gap-3">
                    {game.insights.map((insight: any, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                          "p-4 rounded-xl border flex gap-4 items-start",
                          insight.type === 'success' ? "bg-bkpk-success/10 border-bkpk-success/20 text-bkpk-success" :
                            insight.type === 'warning' ? "bg-bkpk-danger/10 border-bkpk-danger/20 text-bkpk-danger" :
                              "bg-bkpk-surface-tint-2 border-bkpk-border-strong text-bkpk-text-secondary"
                        )}
                      >
                        <div className="p-1.5 rounded-lg bg-current/10">
                          {insight.type === 'success' ? '✓' : insight.type === 'warning' ? '!' : 'i'}
                        </div>
                        <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </AnimatePresence>

            {/* Box Score Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-bkpk-primary" />
                  <h3 className="text-xl font-bold text-bkpk-text-primary font-outfit">Statystyki Zawodników (Box Score)</h3>
                </div>

                <div className="flex bg-bkpk-surface-tint-2 p-1 rounded-xl border border-bkpk-border-strong">
                  <button
                    onClick={() => setActiveTab('bekapaka')}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-lg transition-all uppercase tracking-widest",
                      activeTab === 'bekapaka' ? "bg-bkpk-primary-fill text-white" : "text-bkpk-text-secondary"
                    )}
                  >
                    BKPK
                  </button>
                  <button
                    onClick={() => setActiveTab('opponent')}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-lg transition-all uppercase tracking-widest",
                      activeTab === 'opponent' ? "bg-bkpk-primary-fill text-white" : "text-bkpk-text-secondary"
                    )}
                  >
                    OPP
                  </button>
                </div>
              </div>

              <BoxScoreModern
                playerStats={(activeTab === 'bekapaka' ? bekapaka : opponentTeam)?.players?.map((p: any) => ({
                  name: p.name,
                  number: p.number,
                  minutes: p.min,
                  points: p.pts,
                  rebounds: p.reb || (p.orb + p.drb) || 0,
                  assists: p.ast,
                  steals: p.stl,
                  blocks: p.blk,
                  turnovers: p.tov,
                  fg: `${p.fgm}/${p.fga}`,
                  threeP: `${p.three_pm}/${p.three_pa}`,
                  ft: `${p.ftm}/${p.fta}`,
                  plusMinus: p.plusMinus,
                  eval: p.eval
                })) || []}
              />
            </section>
          </div>

          {/* Sidebar Area */}
          <aside className="lg:col-span-4 space-y-12">
            {/* Match MVP */}
            {game.mvp && (
              <BkpkCard variant="glass" className="relative overflow-hidden group">
                <div className="relative z-10 space-y-4 text-center">
                  <span className="text-xs font-bold text-bkpk-warning uppercase tracking-[0.2em]">Najbardziej Wartościowy Zawodnik (MVP)</span>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-bkpk-warning/10 rounded-full flex items-center justify-center border border-bkpk-warning/30 mb-4 group-hover:scale-110 transition-transform">
                      <Trophy className="w-8 h-8 text-bkpk-warning" />
                    </div>
                    <h4 className="text-2xl font-black font-outfit text-bkpk-text-primary uppercase tracking-tight">{game.mvp}</h4>
                  </div>
                </div>
                <div className="absolute -bottom-10 left-1/2 -u-translate-x-1/2 w-48 h-48 bg-bkpk-warning/5 rounded-full blur-3xl pointer-events-none" />
              </BkpkCard>
            )}

            {/* Comparison Cards (Temporary wrappers for legacy sidebar components) */}
            <div className="space-y-8">
              <TeamStats teamStats={bekapaka?.fourFactors || null} />
              <OpponentComparison
                bekapaka={{ ...bekapaka, ...bekapaka.fourFactors }}
                opponent={{ ...opponentTeam, ...opponentTeam.fourFactors }}
              />
              {game.fiveMinute && (
                <DashboardMomentum
                  data={game.fiveMinute}
                  bkCode={bekapaka.id || 'BB'}
                  oppCode={opponentTeam.id || 'PR'}
                />
              )}
            </div>
          </aside>
        </div>

        {/* Coach Notes - Full Width at Bottom */}
        <BkpkCard variant="glass" className="p-8 md:p-12">
          <div className="flex items-center justify-between border-b border-bkpk-border-strong pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-bkpk-primary/10 rounded-xl border border-bkpk-primary/20">
                <FileText className="w-6 h-6 text-bkpk-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-bkpk-text-primary font-outfit">Notatki Trenera</h3>
                <p className="text-sm text-bkpk-text-muted">Szczegółowa analiza i wnioski pomeczowe</p>
              </div>
            </div>
            {!isEditing && (
              <BkpkButton variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edytuj Notatki
              </BkpkButton>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                className="w-full h-[400px] bg-bkpk-overlay-weak border border-bkpk-border-strong rounded-xl p-6 text-bkpk-text-primary text-lg leading-relaxed focus:border-bkpk-primary transition-colors outline-none resize-y placeholder:text-bkpk-text-muted font-mono"
                placeholder="Wpisz szczegółowe notatki, wnioski i analizę..."
              />
              <div className="flex justify-end gap-3">
                <BkpkButton variant="ghost" onClick={() => setIsEditing(false)}>Anuluj</BkpkButton>
                <BkpkButton variant="primary" onClick={handleSave} loading={saving}>Zapisz Notatki</BkpkButton>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none 
              prose-p:text-lg prose-p:leading-8 prose-p:text-bkpk-text-secondary 
              prose-headings:text-bkpk-text-primary prose-strong:text-bkpk-primary
              prose-hr:border-bkpk-border-strong prose-hr:my-8
              prose-ul:list-disc prose-ul:ml-6 prose-ul:space-y-2
              prose-li:text-bkpk-text-secondary prose-li:leading-7
              prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
              prose-blockquote:border-l-4 prose-blockquote:border-bkpk-primary prose-blockquote:bg-bkpk-surface-tint-1 prose-blockquote:p-4 prose-blockquote:rounded-r-lg">
              {game.notes ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {game.notes}
                </ReactMarkdown>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-bkpk-border-strong rounded-2xl">
                  <p className="text-bkpk-text-muted text-lg mb-4">Brak notatek dla tego meczu</p>
                  <BkpkButton variant="outline" onClick={() => setIsEditing(true)}>
                    Dodaj pierwszą notatkę
                  </BkpkButton>
                </div>
              )}
            </div>
          )}
        </BkpkCard>
      </div>
    </div>
  );
}
