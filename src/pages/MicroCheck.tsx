import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudySessions, useLearningState } from '@/hooks/useStudyData';
import { generateQuiz } from '@/services/api';
import type { MicroCheckQuiz, QuizQuestion } from '@/types/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowRight, Star } from 'lucide-react';

export default function MicroCheck() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { getSession, updateSession } = useStudySessions();
  const { updateAfterQuiz } = useLearningState();
  const session = sessionId ? getSession(sessionId) : null;

  const [quiz, setQuiz] = useState<MicroCheckQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.debrief) {
      generateQuiz(session.debrief.topics, session.debrief.keyPoints).then(q => {
        setQuiz(q);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleSubmit = () => {
    if (!quiz || !sessionId) return;
    const graded = quiz.questions.map(q => ({
      ...q,
      userAnswer: answers[q.id],
      confidence: confidence[q.id] || 3,
    }));
    const correct = graded.filter(q => q.userAnswer === q.correctAnswer).length;
    const score = Math.round((correct / graded.length) * 100);
    
    const completedQuiz: MicroCheckQuiz = {
      questions: graded,
      completedAt: new Date().toISOString(),
      score,
    };

    updateSession(sessionId, { quiz: completedQuiz });
    updateAfterQuiz(score, session?.debrief?.topics || []);
    setQuiz(completedQuiz);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Generating quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No debrief data found. Please complete a session first.</p>
        <Button onClick={() => navigate('/session/start')} className="mt-4" variant="outline">
          Start Session
        </Button>
      </div>
    );
  }

  const score = quiz.score;
  const allAnswered = quiz.questions.every(q => answers[q.id] !== undefined);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-gradient mb-1">Micro-Check</h1>
        <p className="text-muted-foreground text-sm">
          {submitted ? `Score: ${score}%` : `${quiz.questions.length} questions · Rate your confidence`}
        </p>
      </div>

      {quiz.questions.map((q, qi) => (
        <Card key={q.id} className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              <span className="text-primary mr-2">Q{qi + 1}.</span>
              {q.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.options.map((opt, oi) => {
              const selected = (submitted ? q.userAnswer : answers[q.id]) === oi;
              const isCorrect = submitted && oi === q.correctAnswer;
              const isWrong = submitted && selected && oi !== q.correctAnswer;

              return (
                <button
                  key={oi}
                  onClick={() => !submitted && setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                  disabled={submitted}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-sm flex items-center gap-2 ${
                    isCorrect
                      ? 'border-success bg-success/10 text-success'
                      : isWrong
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-muted-foreground/30 text-foreground'
                  }`}
                >
                  {isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  {isWrong && <XCircle className="h-4 w-4 shrink-0" />}
                  <span>{opt}</span>
                </button>
              );
            })}

            {/* Confidence */}
            {!submitted && (
              <div className="pt-3 border-t border-border mt-3">
                <p className="text-xs text-muted-foreground mb-2">Confidence</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => setConfidence(prev => ({ ...prev, [q.id]: level }))}
                      className="p-1"
                    >
                      <Star
                        className={`h-4 w-4 transition-colors ${
                          (confidence[q.id] || 0) >= level ? 'text-primary fill-primary' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {!submitted ? (
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="w-full gradient-primary text-primary-foreground font-semibold shadow-glow"
          size="lg"
        >
          Submit Answers
        </Button>
      ) : (
        <div className="space-y-3">
          <Card className="shadow-card border-primary/30 gradient-accent">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold text-primary mb-1">{score}%</p>
              <p className="text-sm text-muted-foreground">Learning state updated</p>
            </CardContent>
          </Card>
          <Button
            onClick={() => navigate('/')}
            className="w-full"
            variant="outline"
            size="lg"
          >
            Back to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
