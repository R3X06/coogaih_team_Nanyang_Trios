import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudySessions } from '@/hooks/useStudyData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, Plus, X, ArrowRight } from 'lucide-react';

export default function SessionDebrief() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { updateSession, getSession } = useStudySessions();
  const session = sessionId ? getSession(sessionId) : null;

  const [topics, setTopics] = useState<string[]>(['']);
  const [keyPoints, setKeyPoints] = useState<string[]>(['']);
  const [confusionAreas, setConfusionAreas] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');

  const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, '']);
  };

  const updateField = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    setter(prev => prev.map((v, i) => i === index ? value : v));
  };

  const removeField = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!sessionId) return;
    const debrief = {
      topics: topics.filter(t => t.trim()),
      keyPoints: keyPoints.filter(k => k.trim()),
      confusionAreas: confusionAreas.filter(c => c.trim()),
      notes: notes.trim() || undefined,
    };
    updateSession(sessionId, { debrief, status: 'completed' });
    navigate(`/session/quiz/${sessionId}`);
  };

  const duration = session?.duration
    ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s`
    : 'Unknown';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-gradient mb-1">Session Debrief</h1>
        <p className="text-muted-foreground text-sm">Duration: {duration} · {session?.telemetry.length || 0} telemetry readings</p>
      </div>

      {/* Topics */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Topics Studied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topics.map((t, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={t}
                onChange={e => updateField(setTopics, i, e.target.value)}
                placeholder="e.g., Linear Algebra"
                className="bg-accent/30"
              />
              {topics.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeField(setTopics, i)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => addField(setTopics)} className="text-primary">
            <Plus className="h-3 w-3 mr-1" /> Add topic
          </Button>
        </CardContent>
      </Card>

      {/* Key Points */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-sm">Key Points & Takeaways</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {keyPoints.map((k, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={k}
                onChange={e => updateField(setKeyPoints, i, e.target.value)}
                placeholder="What did you learn?"
                className="bg-accent/30"
              />
              {keyPoints.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeField(setKeyPoints, i)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => addField(setKeyPoints)} className="text-primary">
            <Plus className="h-3 w-3 mr-1" /> Add point
          </Button>
        </CardContent>
      </Card>

      {/* Confusion Areas */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-sm">Confusion Areas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {confusionAreas.map((c, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={c}
                onChange={e => updateField(setConfusionAreas, i, e.target.value)}
                placeholder="What was confusing?"
                className="bg-accent/30"
              />
              {confusionAreas.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeField(setConfusionAreas, i)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => addField(setConfusionAreas)} className="text-primary">
            <Plus className="h-3 w-3 mr-1" /> Add area
          </Button>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-sm">Additional Notes (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any other observations..."
            rows={3}
            className="bg-accent/30"
          />
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground font-semibold shadow-glow" size="lg">
        Generate Micro-Check <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
