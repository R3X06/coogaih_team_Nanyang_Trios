import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSession, updateSession, createQuiz, callQuizGenerate } from '@/services/api';
import type { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ClipboardList, Plus, X, ArrowRight, Star, Upload } from 'lucide-react';

export default function SessionDebrief() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Tables<'sessions'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [keyPoints, setKeyPoints] = useState(['', '', '']);
  const [confusion, setConfusion] = useState('');
  const [confidencePost, setConfidencePost] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [notesUrl, setNotesUrl] = useState('');

  useEffect(() => {
    if (sessionId) {
      getSession(sessionId).then(s => { setSession(s); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [sessionId]);

  const addTopic = () => {
    const t = topicInput.trim();
    if (t && !topics.includes(t)) {
      setTopics(prev => [...prev, t]);
      setTopicInput('');
    }
  };

  const removeTopic = (i: number) => setTopics(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!sessionId || topics.length === 0) return;
    setSubmitting(true);
    try {
      // Update session with debrief data
      await updateSession(sessionId, {
        topic_tags: topics,
        debrief_key_points: keyPoints.filter(k => k.trim()),
        debrief_confusion: confusion || null,
        confidence_post: confidencePost,
        difficulty_post: difficulty,
        notes_file_url: notesUrl || null,
      });

      // Generate quiz via backend
      const quizData = await callQuizGenerate({
        topic_tags: topics,
        debrief_key_points: keyPoints.filter(k => k.trim()),
        notes_text_optional: notesUrl || '',
        retrieval_namespace: 'syllabus_and_notes',
      });

      // Save quiz to DB
      await createQuiz({
        session_id: sessionId,
        questions_json: quizData.questions,
        sources_json: quizData.source_references,
      });

      navigate(`/session/quiz/${sessionId}`);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const duration = session?.duration_sec ? `${Math.floor(session.duration_sec / 60)}m ${session.duration_sec % 60}s` : '—';

  if (loading) {
    return <div className="flex justify-center py-16"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-gradient mb-1">Session Debrief</h1>
        <p className="text-muted-foreground text-sm">Duration: {duration} · Goal: {session?.goal_type || '—'}</p>
      </div>

      {/* Topic Tags */}
      <Card className="shadow-card border-border gradient-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Topics Studied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {topics.map((t, i) => (
              <span key={i} className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                {t}
                <button onClick={() => removeTopic(i)}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTopic())}
              placeholder="Add topic and press Enter"
              className="bg-accent/30"
            />
            <Button variant="ghost" size="icon" onClick={addTopic}><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Points */}
      <Card className="shadow-card border-border gradient-card">
        <CardHeader><CardTitle className="text-sm">Key Points (3 bullets)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {keyPoints.map((k, i) => (
            <Input
              key={i}
              value={k}
              onChange={e => setKeyPoints(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
              placeholder={`Key point ${i + 1}`}
              className="bg-accent/30"
            />
          ))}
        </CardContent>
      </Card>

      {/* Confusion */}
      <Card className="shadow-card border-border gradient-card">
        <CardHeader><CardTitle className="text-sm">Confusion Point</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={confusion} onChange={e => setConfusion(e.target.value)} placeholder="What was most confusing?" rows={2} className="bg-accent/30" />
        </CardContent>
      </Card>

      {/* Confidence + Difficulty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-card border-border gradient-card">
          <CardHeader><CardTitle className="text-sm">Confidence (post-session)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} onClick={() => setConfidencePost(v)} className="p-1">
                  <Star className={`h-6 w-6 transition-colors ${confidencePost >= v ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
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

      {/* Notes upload */}
      <Card className="shadow-card border-border gradient-card">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> Notes URL (optional)</CardTitle></CardHeader>
        <CardContent>
          <Input value={notesUrl} onChange={e => setNotesUrl(e.target.value)} placeholder="https://..." className="bg-accent/30" />
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={topics.length === 0 || submitting} className="w-full gradient-primary text-primary-foreground font-semibold shadow-glow" size="lg">
        {submitting ? 'Generating...' : 'Generate Micro-Check'} <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
