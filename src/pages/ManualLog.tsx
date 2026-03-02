import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getSubjects, getChaptersBySubject, getTopicsByChapter, createManualLog, callQuizGenerate, createQuiz } from '@/services/api';
import type { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Save, ArrowRight, Clock } from 'lucide-react';

const ACTIVITY_TYPES = ['revision', 'practice', 'research', 'notes', 'mixed'] as const;
const ISSUE_CHIPS = ['concept gap', 'careless mistakes', 'time pressure', 'confusion', 'low focus', 'rushing', 'forgot steps', 'overthinking'];

export default function ManualLog() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [durationMin, setDurationMin] = useState(30);
  const [activityType, setActivityType] = useState<string>('mixed');
  const [subjects, setSubjects] = useState<Tables<'subjects'>[]>([]);
  const [chapters, setChapters] = useState<Tables<'chapters'>[]>([]);
  const [topics, setTopics] = useState<Tables<'topics'>[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [whatIDid, setWhatIDid] = useState('');
  const [keyPoints, setKeyPoints] = useState(['', '', '']);
  const [issues, setIssues] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { getSubjects().then(setSubjects).catch(console.error); }, []);
  useEffect(() => {
    if (selectedSubject) { getChaptersBySubject(selectedSubject).then(setChapters).catch(console.error); setSelectedChapter(''); setSelectedTopic(''); setTopics([]); }
  }, [selectedSubject]);
  useEffect(() => {
    if (selectedChapter) { getTopicsByChapter(selectedChapter).then(setTopics).catch(console.error); setSelectedTopic(''); }
  }, [selectedChapter]);

  const toggleIssue = (issue: string) => {
    setIssues(prev => prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]);
  };

  const handleSave = async (generateQuiz: boolean) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const log = await createManualLog({
        user_id: user.id,
        duration_sec: durationMin * 60,
        subject_id: selectedSubject || null,
        chapter_id: selectedChapter || null,
        topic_id: selectedTopic || null,
        activity_type: activityType,
        what_i_did: whatIDid,
        key_points: keyPoints.filter(k => k.trim()),
        issues_faced: issues,
        confidence_post: confidence,
        difficulty_post: difficulty,
        attachment_url: attachmentUrl || null,
      });

      if (generateQuiz) {
        const topicName = topics.find(t => t.id === selectedTopic)?.name || activityType;
        const quizData = await callQuizGenerate({
          topic_tags: [topicName],
          debrief_key_points: keyPoints.filter(k => k.trim()),
          notes_text_optional: whatIDid,
          retrieval_namespace: 'syllabus_and_notes',
        });
        // Create a lightweight session to hold the quiz
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: sess } = await supabase.from('sessions').insert({
          user_id: user.id,
          goal_type: activityType as any,
          session_source: 'manual' as any,
          subject_id: selectedSubject || null,
          chapter_id: selectedChapter || null,
          primary_topic_id: selectedTopic || null,
          duration_sec: durationMin * 60,
          topic_tags: [topicName],
          debrief_key_points: keyPoints.filter(k => k.trim()),
          confidence_post: confidence,
          difficulty_post: difficulty,
          manual_notes: whatIDid,
          issues_faced: issues,
        } as any).select().single();

        if (sess) {
          await createQuiz({ session_id: sess.id, questions_json: quizData.questions, sources_json: quizData.source_references });
          navigate(`/session/quiz/${sess.id}`);
          return;
        }
      }
      navigate('/');
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-gradient mb-1">Manual Study Log</h1>
        <p className="text-muted-foreground text-sm">Log study time without a timer session.</p>
      </div>

      {/* Duration + Activity */}
      <Card className="shadow-card border-border gradient-card">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Duration &amp; Activity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Minutes studied</label>
              <Input type="number" value={durationMin} onChange={e => setDurationMin(Number(e.target.value))} min={1} className="bg-accent/30" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Activity type</label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="bg-accent/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map(a => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject / Chapter / Topic */}
      {subjects.length > 0 && (
        <Card className="shadow-card border-border gradient-card">
          <CardHeader><CardTitle className="text-sm">Subject Mapping (optional)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="bg-accent/30"><SelectValue placeholder="Select subject..." /></SelectTrigger>
              <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            {chapters.length > 0 && (
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger className="bg-accent/30"><SelectValue placeholder="Select chapter..." /></SelectTrigger>
                <SelectContent>{chapters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {topics.length > 0 && (
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="bg-accent/30"><SelectValue placeholder="Select topic..." /></SelectTrigger>
                <SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      )}

      {/* What I Did */}
      <Card className="shadow-card border-border gradient-card">
        <CardHeader><CardTitle className="text-sm">What I Did</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={whatIDid} onChange={e => setWhatIDid(e.target.value)} placeholder="Describe your study session..." rows={3} className="bg-accent/30" />
        </CardContent>
      </Card>

      {/* Key Points */}
      <Card className="shadow-card border-border gradient-card">
        <CardHeader><CardTitle className="text-sm">Key Points (3 bullets)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {keyPoints.map((k, i) => (
            <Input key={i} value={k} onChange={e => setKeyPoints(prev => prev.map((v, idx) => idx === i ? e.target.value : v))} placeholder={`Key point ${i + 1}`} className="bg-accent/30" />
          ))}
        </CardContent>
      </Card>

      {/* Issues Faced */}
      <Card className="shadow-card border-border gradient-card">
        <CardHeader><CardTitle className="text-sm">Issues Faced</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ISSUE_CHIPS.map(issue => (
              <button key={issue} onClick={() => toggleIssue(issue)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${issues.includes(issue) ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-accent/30 text-muted-foreground border border-border hover:bg-accent/50'}`}>
                {issue}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confidence + Difficulty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-card border-border gradient-card">
          <CardHeader><CardTitle className="text-sm">Confidence</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} onClick={() => setConfidence(v)} className="p-1">
                  <Star className={`h-6 w-6 transition-colors ${confidence >= v ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border gradient-card">
          <CardHeader><CardTitle className="text-sm">Difficulty</CardTitle></CardHeader>
          <CardContent>
            <Slider value={[difficulty]} onValueChange={([v]) => setDifficulty(v)} min={1} max={5} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Easy</span><span className="font-bold text-primary">{difficulty}</span><span>Hard</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => handleSave(false)} disabled={submitting} variant="outline" className="flex-1 border-primary/30">
          <Save className="h-4 w-4 mr-2" /> Save Log
        </Button>
        <Button onClick={() => handleSave(true)} disabled={submitting} className="flex-1 gradient-primary text-primary-foreground font-semibold shadow-glow">
          {submitting ? 'Processing...' : 'Save + Micro-Check'} <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
