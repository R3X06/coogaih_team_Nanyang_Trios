import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getSubject, getChaptersBySubject, getTopicsByChapter, getLatestSnapshots, getSessionsBySubject, getManualLogsBySubject } from '@/services/api';
import type { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown, Minus, AlertTriangle, BookOpen, Grid3X3, Activity, Play, PenLine, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrajectoryMap from '@/components/TrajectoryMap';
import TopicDetailDrawer from '@/components/TopicDetailDrawer';
import SessionMappingModal from '@/components/SessionMappingModal';

interface ChapterWithTopics {
  chapter: Tables<'chapters'>;
  topics: Tables<'topics'>[];
}

export default function SubjectDetail() {
  const { subjectId } = useParams();
  const { user } = useUser();
  const [subject, setSubject] = useState<Tables<'subjects'> | null>(null);
  const [chaptersData, setChaptersData] = useState<ChapterWithTopics[]>([]);
  const [snapshots, setSnapshots] = useState<Tables<'state_snapshots'>[]>([]);
  const [sessions, setSessions] = useState<Tables<'sessions'>[]>([]);
  const [manualLogs, setManualLogs] = useState<any[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Topic drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTopic, setDrawerTopic] = useState<{ id: string; name: string; chapterName: string; chapterId: string } | null>(null);

  // Session mapping modal
  const [mappingSessionId, setMappingSessionId] = useState<string | null>(null);

  const loadData = async () => {
    if (!subjectId || !user) return;
    setLoading(true);
    try {
      const [subj, chapters, allSnaps, sess, logs] = await Promise.all([
        getSubject(subjectId),
        getChaptersBySubject(subjectId),
        getLatestSnapshots(user.id),
        getSessionsBySubject(user.id, subjectId),
        getManualLogsBySubject(user.id, subjectId),
      ]);
      setSubject(subj);
      setSessions(sess);
      setManualLogs(logs);
      setSnapshots(allSnaps);

      const withTopics: ChapterWithTopics[] = await Promise.all(
        chapters.map(async ch => ({ chapter: ch, topics: await getTopicsByChapter(ch.id) }))
      );
      setChaptersData(withTopics);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [subjectId, user]);

  const allTopicIds = useMemo(() => chaptersData.flatMap(c => c.topics.map(t => t.id)), [chaptersData]);
  const allTopicNames = useMemo(() => {
    const map = new Map<string, string>();
    chaptersData.forEach(c => c.topics.forEach(t => map.set(t.id, t.name)));
    return map;
  }, [chaptersData]);

  const latestByTopic = useMemo(() => {
    const map = new Map<string, Tables<'state_snapshots'>>();
    for (const s of snapshots) {
      if (!map.has(s.topic_tag)) map.set(s.topic_tag, s);
    }
    return map;
  }, [snapshots]);

  const subjectSnapshots = useMemo(() => {
    const topicSet = new Set([...allTopicIds, ...Array.from(allTopicNames.values())]);
    return snapshots.filter(s => topicSet.has(s.topic_tag));
  }, [snapshots, allTopicIds, allTopicNames]);

  const getTopicSnap = (topicId: string, topicName: string) => latestByTopic.get(topicId) || latestByTopic.get(topicName);

  const computeChapterMetrics = (topics: Tables<'topics'>[]) => {
    const snaps = topics.map(t => getTopicSnap(t.id, t.name)).filter(Boolean) as Tables<'state_snapshots'>[];
    if (snaps.length === 0) return { strength: 0, stability: 0, risk: 0, count: 0 };
    const avg = (key: keyof Tables<'state_snapshots'>) => snaps.reduce((a, s) => a + ((s[key] as number) || 0), 0) / snaps.length;
    return { strength: avg('concept_strength'), stability: avg('stability'), risk: avg('risk_score'), count: snaps.length };
  };

  const subjectMetrics = useMemo(() => {
    const allTopics = chaptersData.flatMap(c => c.topics);
    return computeChapterMetrics(allTopics);
  }, [chaptersData, latestByTopic]);

  const velocityArrow = (snap: Tables<'state_snapshots'> | undefined) => {
    if (!snap) return <Minus className="h-3 w-3 text-muted-foreground" />;
    const dir = snap.velocity_direction || 0;
    const mag = snap.velocity_magnitude || 0;
    if (mag < 0.05) return <Minus className="h-3 w-3 text-muted-foreground" />;
    return dir > 0 ? <ArrowUp className="h-3 w-3 text-success" /> : <ArrowDown className="h-3 w-3 text-destructive" />;
  };

  const riskDot = (risk: number) => {
    if (risk >= 0.6) return <span className="h-2.5 w-2.5 rounded-full bg-destructive inline-block" />;
    if (risk >= 0.35) return <span className="h-2.5 w-2.5 rounded-full bg-warning inline-block" />;
    return <span className="h-2.5 w-2.5 rounded-full bg-success inline-block" />;
  };

  const openTopicDrawer = (topic: Tables<'topics'>, chapterName: string, chapterId: string) => {
    setDrawerTopic({ id: topic.id, name: topic.name, chapterName, chapterId });
    setDrawerOpen(true);
  };

  // Combined activity feed
  const activityFeed = useMemo(() => {
    const items = [
      ...sessions.map(s => ({ type: 'session' as const, id: s.id, date: s.start_time, goal: s.goal_type, duration: s.duration_sec, confidence: s.confidence_post, difficulty: s.difficulty_post, mapped: !!s.subject_id })),
      ...manualLogs.map((l: any) => ({ type: 'log' as const, id: l.id, date: l.created_at, goal: l.activity_type, duration: l.duration_sec, confidence: l.confidence_post, difficulty: l.difficulty_post, issues: l.issues_faced, mapped: true })),
    ];
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, manualLogs]);

  if (loading) {
    return <div className="flex justify-center py-16"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!subject) {
    return <p className="text-muted-foreground text-center py-16">Subject not found.</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary mb-1 inline-block">← Dashboard</Link>
          <h1 className="font-display text-3xl text-gradient">{subject.name}</h1>
          <p className="text-muted-foreground text-sm">{subject.description}</p>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{(subjectMetrics.strength * 100).toFixed(0)}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Mastery</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{(subjectMetrics.stability * 100).toFixed(0)}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Stability</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{(subjectMetrics.risk * 100).toFixed(0)}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Risk</p>
          </div>
        </div>
      </div>

      {/* Trajectory Map */}
      {subjectSnapshots.length > 0 && (
        <Card className="shadow-card border-border gradient-card">
          <CardHeader>
            <CardTitle className="font-display text-lg text-gradient">Subject Trajectory</CardTitle>
          </CardHeader>
          <CardContent>
            <TrajectoryMap allSnapshots={subjectSnapshots} />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="chapters">
        <TabsList>
          <TabsTrigger value="chapters" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Chapters</TabsTrigger>
          <TabsTrigger value="gaps" className="gap-1.5"><Grid3X3 className="h-3.5 w-3.5" /> Gap Radar</TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> Activity</TabsTrigger>
        </TabsList>

        {/* CHAPTERS TAB */}
        <TabsContent value="chapters" className="space-y-3 mt-4">
          {chaptersData.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No chapters yet. <Link to="/manage/subjects" className="text-primary hover:underline">Add chapters</Link>.</p>}
          {chaptersData.map(({ chapter, topics }) => {
            const m = computeChapterMetrics(topics);
            const expanded = expandedChapter === chapter.id;
            return (
              <Card key={chapter.id} className="shadow-card border-border gradient-card">
                <button className="w-full text-left" onClick={() => setExpandedChapter(expanded ? null : chapter.id)}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {expanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        <CardTitle className="text-sm font-semibold">{chapter.name}</CardTitle>
                        {m.risk >= 0.6 && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Str: {(m.strength * 100).toFixed(0)}%</span>
                        <span>Stab: {(m.stability * 100).toFixed(0)}%</span>
                        {riskDot(m.risk)}
                      </div>
                    </div>
                    <Progress value={m.strength * 100} className="h-1.5 mt-2" />
                  </CardHeader>
                </button>
                {expanded && (
                  <CardContent className="pt-0 pb-3">
                    <div className="space-y-1.5 ml-6">
                      {topics.map(topic => {
                        const snap = getTopicSnap(topic.id, topic.name);
                        const str = snap?.concept_strength || 0;
                        const stab = snap?.stability || 0;
                        const risk = snap?.risk_score || 0;
                        return (
                          <button
                            key={topic.id}
                            className="w-full flex items-center justify-between py-1.5 px-3 rounded bg-accent/20 text-sm hover:bg-accent/40 transition-colors"
                            onClick={() => openTopicDrawer(topic, chapter.name, chapter.id)}
                          >
                            <div className="flex items-center gap-2">
                              {riskDot(risk)}
                              <span className="text-foreground">{topic.name}</span>
                              {velocityArrow(snap)}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{(str * 100).toFixed(0)}%</span>
                              <span>{(stab * 100).toFixed(0)}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </TabsContent>

        {/* GAP RADAR TAB */}
        <TabsContent value="gaps" className="mt-4">
          <Card className="shadow-card border-border gradient-card">
            <CardHeader><CardTitle className="text-sm text-gradient">Knowledge Gap Heatmap</CardTitle></CardHeader>
            <CardContent>
              <GapHeatmap chaptersData={chaptersData} getTopicSnap={getTopicSnap} onTopicClick={(topicId) => {
                for (const { chapter, topics } of chaptersData) {
                  const t = topics.find(t => t.id === topicId || t.name === topicId);
                  if (t) { openTopicDrawer(t, chapter.name, chapter.id); return; }
                }
              }} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="mt-4 space-y-3">
          {activityFeed.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No sessions or logs for this subject yet.</p>}
          {activityFeed.map(item => (
            <Card key={item.id} className="shadow-card border-border gradient-card">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.type === 'session' ? <Play className="h-3.5 w-3.5 text-primary" /> : <PenLine className="h-3.5 w-3.5 text-primary" />}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(item.date).toLocaleDateString()} · <span className="capitalize">{item.goal}</span>
                        <span className="text-[10px] ml-2 text-muted-foreground">{item.type === 'session' ? 'Timer' : 'Manual'}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.duration ? `${Math.floor(item.duration / 60)}m` : '—'}
                        {item.confidence && ` · Conf: ${item.confidence}/5`}
                        {item.difficulty && ` · Diff: ${item.difficulty}/5`}
                      </p>
                    </div>
                  </div>
                  {item.type === 'session' && !item.mapped && (
                    <Button variant="ghost" size="sm" className="text-primary text-xs" onClick={() => setMappingSessionId(item.id)}>
                      <MapPin className="h-3 w-3 mr-1" /> Map
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Topic Detail Drawer */}
      {drawerTopic && (
        <TopicDetailDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          topicId={drawerTopic.id}
          topicName={drawerTopic.name}
          chapterName={drawerTopic.chapterName}
          subjectName={subject.name}
          subjectId={subject.id}
          chapterId={drawerTopic.chapterId}
        />
      )}

      {/* Session Mapping Modal */}
      {mappingSessionId && (
        <SessionMappingModal
          sessionId={mappingSessionId}
          currentSubjectId={subjectId}
          open={!!mappingSessionId}
          onOpenChange={(open) => { if (!open) setMappingSessionId(null); }}
          onSaved={loadData}
        />
      )}
    </div>
  );
}

// Heatmap sub-component
function GapHeatmap({ chaptersData, getTopicSnap, onTopicClick }: { chaptersData: ChapterWithTopics[]; getTopicSnap: (id: string, name: string) => Tables<'state_snapshots'> | undefined; onTopicClick?: (topicId: string) => void }) {
  const items = chaptersData.flatMap(({ chapter, topics }) =>
    topics.map(t => {
      const snap = getTopicSnap(t.id, t.name);
      return { id: t.id, chapter: chapter.name, topic: t.name, strength: snap?.concept_strength || 0, risk: snap?.risk_score || 0 };
    })
  ).sort((a, b) => b.risk - a.risk);

  if (items.length === 0) return <p className="text-muted-foreground text-sm text-center py-4">No topic data yet.</p>;

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const intensity = Math.max(0.1, 1 - item.strength);
        return (
          <button
            key={item.id}
            className="flex items-center gap-2 text-xs w-full hover:bg-accent/30 rounded p-1 transition-colors"
            onClick={() => onTopicClick?.(item.id)}
          >
            <span className="w-24 truncate text-muted-foreground text-left">{item.chapter}</span>
            <span className="w-32 truncate text-foreground font-medium text-left">{item.topic}</span>
            <div className="flex-1 h-5 rounded overflow-hidden bg-muted/30">
              <div
                className="h-full rounded transition-all"
                style={{
                  width: `${intensity * 100}%`,
                  background: `hsl(${25 - intensity * 25} ${80 + intensity * 15}% ${50 + (1 - intensity) * 15}% / ${0.4 + intensity * 0.5})`,
                }}
              />
            </div>
            <span className="w-10 text-right text-muted-foreground">{(item.strength * 100).toFixed(0)}%</span>
          </button>
        );
      })}
    </div>
  );
}
