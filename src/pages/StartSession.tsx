import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { createSession, updateSession, callAttentionAnalyze, getSubjects, getChaptersBySubject, getTopicsByChapter } from '@/services/api';
import type { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Square, Gauge, Activity, Timer } from 'lucide-react';

const GOAL_TYPES = [
  { value: 'revision', label: 'Revision' },
  { value: 'practice', label: 'Practice' },
  { value: 'research', label: 'Research' },
  { value: 'notes', label: 'Notes' },
  { value: 'mixed', label: 'Mixed' },
] as const;

export default function StartSession() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [goalType, setGoalType] = useState<string>('mixed');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Subject/Chapter/Topic selection
  const [subjects, setSubjects] = useState<Tables<'subjects'>[]>([]);
  const [chapters, setChapters] = useState<Tables<'chapters'>[]>([]);
  const [topics, setTopics] = useState<Tables<'topics'>[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  useEffect(() => {
    getSubjects().then(setSubjects).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      getChaptersBySubject(selectedSubject).then(setChapters).catch(console.error);
      setSelectedChapter('');
      setSelectedTopic('');
      setTopics([]);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedChapter) {
      getTopicsByChapter(selectedChapter).then(setTopics).catch(console.error);
      setSelectedTopic('');
    }
  }, [selectedChapter]);

  // Telemetry
  const [researchRatio, setResearchRatio] = useState(0.25);
  const [notesRatio, setNotesRatio] = useState(0.25);
  const [practiceRatio, setPracticeRatio] = useState(0.25);
  const [distractionRatio, setDistractionRatio] = useState(0.25);
  const [fragmentation, setFragmentation] = useState(0.3);
  const [avgFocusBlockMin, setAvgFocusBlockMin] = useState(15);
  const [switchingRate, setSwitchingRate] = useState(0.2);
  const [switchesCount, setSwitchesCount] = useState(5);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Auto-normalize ratios
  const normalize = (changed: string, newVal: number) => {
    const vals: Record<string, number> = { research: researchRatio, notes: notesRatio, practice: practiceRatio, distraction: distractionRatio };
    vals[changed] = newVal;
    const others = Object.keys(vals).filter(k => k !== changed);
    const otherSum = others.reduce((a, k) => a + vals[k], 0);
    const remaining = Math.max(0, 1 - newVal);
    if (otherSum > 0) {
      others.forEach(k => { vals[k] = (vals[k] / otherSum) * remaining; });
    } else {
      others.forEach(k => { vals[k] = remaining / others.length; });
    }
    setResearchRatio(Math.round(vals.research * 1000) / 1000);
    setNotesRatio(Math.round(vals.notes * 1000) / 1000);
    setPracticeRatio(Math.round(vals.practice * 1000) / 1000);
    setDistractionRatio(Math.round(vals.distraction * 1000) / 1000);
  };

  const handleStart = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    setStartTime(now);
    try {
      const session = await createSession({
        user_id: user.id,
        goal_type: goalType as any,
        start_time: now,
        subject_id: selectedSubject || null,
        chapter_id: selectedChapter || null,
        primary_topic_id: selectedTopic || null,
      } as any);
      setSessionId(session.id);
      // Store selection for debrief
      if (selectedTopic) {
        const topicObj = topics.find(t => t.id === selectedTopic);
        if (topicObj) sessionStorage.setItem(`session_topic_${session.id}`, topicObj.name);
      }
      setRunning(true);
      setElapsed(0);
    } catch (e) { console.error(e); }
  };

  const handlePause = () => setRunning(prev => !prev);

  const handleStop = async () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!sessionId) return;
    const endTime = new Date().toISOString();
    try {
      await updateSession(sessionId, {
        end_time: endTime,
        duration_sec: elapsed,
        research_ratio: researchRatio,
        notes_ratio: notesRatio,
        practice_ratio: practiceRatio,
        distraction_ratio: distractionRatio,
        fragmentation,
        avg_focus_block_minutes: avgFocusBlockMin,
        switching_rate: switchingRate,
        switches_count: switchesCount,
      });

      // Call attention analysis endpoint
      try {
        const analysis = await callAttentionAnalyze({
          session_goal: goalType,
          attention_vector: {
            research_ratio: researchRatio,
            practice_ratio: practiceRatio,
            notes_ratio: notesRatio,
            distraction_ratio: distractionRatio,
            fragmentation,
            avg_focus_block_minutes: avgFocusBlockMin,
            switching_rate: switchingRate,
            switches_count: switchesCount,
          },
        });
        // Store analysis in sessionStorage for debrief page to display
        sessionStorage.setItem(`attention_analysis_${sessionId}`, JSON.stringify(analysis));
      } catch (e) { console.warn('Attention analysis failed (non-blocking):', e); }

      navigate(`/session/debrief/${sessionId}`);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => setElapsed(e => e + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const ratioSliders = [
    { label: 'Research', value: researchRatio, key: 'research', color: 'text-info' },
    { label: 'Notes', value: notesRatio, key: 'notes', color: 'text-success' },
    { label: 'Practice', value: practiceRatio, key: 'practice', color: 'text-primary' },
    { label: 'Distraction', value: distractionRatio, key: 'distraction', color: 'text-destructive' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-gradient mb-1">Study Session</h1>
        <p className="text-muted-foreground text-sm">Focus. Learn. Grow.</p>
      </div>

      {/* Goal Type */}
      {!sessionId && (
        <Card className="shadow-card border-border gradient-card">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> Session Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Goal</label>
              <Select value={goalType} onValueChange={setGoalType}>
                <SelectTrigger className="bg-accent/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {subjects.length > 0 && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="bg-accent/30">
                      <SelectValue placeholder="Select subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {chapters.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Chapter</label>
                    <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                      <SelectTrigger className="bg-accent/30">
                        <SelectValue placeholder="Select chapter..." />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {topics.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Primary Topic</label>
                    <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                      <SelectTrigger className="bg-accent/30">
                        <SelectValue placeholder="Select topic..." />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timer */}
      <Card className="shadow-card border-border gradient-card text-center">
        <CardContent className="py-10">
          <div className={`text-7xl font-mono font-bold tracking-wider mb-6 ${running ? 'text-gradient animate-pulse-glow' : 'text-foreground'}`}>
            {formatTime(elapsed)}
          </div>
          <div className="flex flex-col items-center gap-3">
            {!sessionId ? (
              subjects.length === 0 ? (
                <p className="text-muted-foreground text-sm">Create a subject to start tracking.</p>
              ) : !selectedSubject ? (
                <p className="text-muted-foreground text-sm">Select a subject above to start.</p>
              ) : (
                <Button onClick={handleStart} className="gradient-primary text-primary-foreground font-semibold shadow-glow px-8">
                  <Play className="h-4 w-4 mr-2" /> Start
                </Button>
              )
            ) : (
              <>
                <Button onClick={handlePause} variant="secondary" size="lg">
                  {running ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {running ? 'Pause' : 'Resume'}
                </Button>
                <Button onClick={handleStop} variant="destructive" size="lg">
                  <Square className="h-4 w-4 mr-2" /> End Session
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Telemetry Panel */}
      {sessionId && (
        <Card className="shadow-card border-border gradient-card">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" /> Attention Telemetry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Activity ratios */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Activity Distribution (auto-normalized to 100%)</p>
              <div className="space-y-3">
                {ratioSliders.map(s => (
                  <div key={s.key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className={`font-medium ${s.color}`}>{s.label}</span>
                      <span className="text-muted-foreground">{(s.value * 100).toFixed(0)}%</span>
                    </div>
                    <Slider value={[s.value]} onValueChange={([v]) => normalize(s.key, v)} min={0} max={1} step={0.01} />
                  </div>
                ))}
              </div>
            </div>

            {/* Other telemetry */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Fragmentation</label>
                <Slider value={[fragmentation]} onValueChange={([v]) => setFragmentation(v)} min={0} max={1} step={0.01} />
                <span className="text-xs text-muted-foreground">{(fragmentation * 100).toFixed(0)}%</span>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Switching Rate</label>
                <Slider value={[switchingRate]} onValueChange={([v]) => setSwitchingRate(v)} min={0} max={1} step={0.01} />
                <span className="text-xs text-muted-foreground">{(switchingRate * 100).toFixed(0)}%</span>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Avg Focus Block (min)</label>
                <Input type="number" value={avgFocusBlockMin} onChange={e => setAvgFocusBlockMin(Number(e.target.value))} min={0} className="bg-accent/30 h-8" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Switches Count</label>
                <Input type="number" value={switchesCount} onChange={e => setSwitchesCount(Number(e.target.value))} min={0} className="bg-accent/30 h-8" />
              </div>
            </div>

            {/* Visual bar */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Activity Profile</p>
              <div className="flex rounded-lg overflow-hidden h-6">
                <div style={{ width: `${researchRatio * 100}%` }} className="bg-info/70" title="Research" />
                <div style={{ width: `${notesRatio * 100}%` }} className="bg-success/70" title="Notes" />
                <div style={{ width: `${practiceRatio * 100}%` }} className="bg-primary/70" title="Practice" />
                <div style={{ width: `${distractionRatio * 100}%` }} className="bg-destructive/70" title="Distraction" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
