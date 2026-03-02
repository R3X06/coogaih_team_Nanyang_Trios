import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getQuizBySession, getSession, createQuizAttempt, callQuizGrade, callStateUpdate, callAdviceGenerate, upsertSnapshot, createRecommendation } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Star, ArrowRight } from 'lucide-react';

export default function MicroCheck() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const startTimes = useRef<Record<string, number>>({});

  useEffect(() => {
    if (sessionId) {
      getQuizBySession(sessionId).then(q => {
        if (q) {
          setQuiz(q);
          const qs = (q.questions_json as any[]) || [];
          setQuestions(qs);
          const now = Date.now();
          const times: Record<string, number> = {};
          qs.forEach((question: any) => { times[question.id] = now; });
          startTimes.current = times;
        }
        setLoading(false);
      });
    }
  }, [sessionId]);

  const handleSelectAnswer = (qId: string, answerIdx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: answerIdx }));
  };

  const handleSubmit = async () => {
    if (!quiz || !user || !sessionId) return;
    setSubmitting(true);

    const answersList = questions.map(q => answers[q.id] ?? -1);
    const confidenceList = questions.map(q => confidence[q.id] || 3);
    const responseTimes = questions.map(q => {
      const start = startTimes.current[q.id] || Date.now();
      return ((Date.now() - start) / 1000);
    });

    try {
      // 1. Grade quiz
      const gradeResult = await callQuizGrade({ questions, user_answers: answersList });
      setResults(gradeResult);

      // 2. Save attempt
      await createQuizAttempt({
        quiz_id: quiz.id,
        answers_json: answersList,
        confidence_pre_submit_json: confidenceList,
        response_times_json: responseTimes,
        results_json: gradeResult.results,
        overall_score: gradeResult.overall_score,
      });

      // 3. Get session for telemetry
      const session = await getSession(sessionId);
      const topics = session?.topic_tags || [];

      // 4. Update state vectors
      const stateResult = await callStateUpdate({
        user_id: user.id,
        session_id: sessionId,
        topic_tags: topics,
        attention_vector: {
          research_ratio: session?.research_ratio || 0,
          practice_ratio: session?.practice_ratio || 0,
          notes_ratio: session?.notes_ratio || 0,
          distraction_ratio: session?.distraction_ratio || 0,
          fragmentation: session?.fragmentation || 0,
          avg_focus_block_minutes: Number(session?.avg_focus_block_minutes) || 0,
          switching_rate: session?.switching_rate || 0,
          switches_count: session?.switches_count || 0,
        },
        quiz_summary: {
          overall_score: gradeResult.overall_score,
          results: gradeResult.results,
          confidence_pre_submit_json: confidenceList,
          response_times_json: responseTimes,
        },
      });

      // 5. Save snapshots
      for (const topicState of stateResult.updated_state_by_topic) {
        await upsertSnapshot({
          user_id: user.id,
          topic_tag: topicState.topic_tag,
          concept_strength: topicState.skill_vector.concept_strength,
          stability: topicState.skill_vector.stability,
          calibration_gap: topicState.skill_vector.calibration_gap,
          stamina: topicState.skill_vector.stamina,
          recovery_rate: topicState.skill_vector.recovery_rate,
          velocity_magnitude: topicState.velocity.velocity_magnitude,
          velocity_direction: topicState.velocity.velocity_direction,
          risk_score: topicState.risk_score,
          certainty: topicState.certainty,
        });
      }

      // 6. Generate advice
      const adviceResult = await callAdviceGenerate({
        user_id: user.id,
        session_id: sessionId,
        latest_states: stateResult.updated_state_by_topic,
        historical_intervention_effects: { timed_drills: 0.5, spaced_recall: 0.6, concept_deep_dive: 0.4, short_focus_blocks: 0.5 },
      });
      await createRecommendation({
        user_id: user.id,
        session_id: sessionId,
        learner_profile: adviceResult.learner_profile,
        risk_analysis: adviceResult.risk_analysis,
        primary_action_json: adviceResult.primary_action,
        secondary_actions_json: adviceResult.secondary_actions,
        evidence_json: adviceResult.evidence,
        certainty_statement: adviceResult.certainty_statement,
      });

      setSubmitted(true);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No quiz found for this session.</p>
        <Button onClick={() => navigate('/session/start')} className="mt-4" variant="outline">Start Session</Button>
      </div>
    );
  }

  const allAnswered = questions.every(q => answers[q.id] !== undefined);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-gradient mb-1">Micro-Check</h1>
        <p className="text-muted-foreground text-sm">
          {submitted ? `Score: ${(results.overall_score * 100).toFixed(0)}%` : `${questions.length} questions · Rate your confidence`}
        </p>
      </div>

      {questions.map((q: any, qi: number) => {
        const userAnswer = answers[q.id];
        const result = submitted ? results?.results?.[qi] : null;

        return (
          <Card key={q.id} className="shadow-card border-border gradient-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                <span className="text-gradient mr-2">Q{qi + 1}.</span>
                {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(q.options || []).map((opt: string, oi: number) => {
                const selected = userAnswer === oi;
                const isCorrect = submitted && oi === q.correct;
                const isWrong = submitted && selected && oi !== q.correct;

                return (
                  <button
                    key={oi}
                    onClick={() => !submitted && handleSelectAnswer(q.id, oi)}
                    disabled={submitted}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-sm flex items-center gap-2 ${
                      isCorrect ? 'border-success bg-success/10 text-success'
                      : isWrong ? 'border-destructive bg-destructive/10 text-destructive'
                      : selected ? 'border-primary bg-primary/10 text-primary'
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
                      <button key={level} onClick={() => setConfidence(prev => ({ ...prev, [q.id]: level }))} className="p-1">
                        <Star className={`h-4 w-4 transition-colors ${(confidence[q.id] || 0) >= level ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {!submitted ? (
        <Button onClick={handleSubmit} disabled={!allAnswered || submitting} className="w-full gradient-primary text-primary-foreground font-semibold shadow-glow" size="lg">
          {submitting ? 'Grading & Updating...' : 'Submit Answers'}
        </Button>
      ) : (
        <div className="space-y-3">
          <Card className="shadow-card border-primary/30 gradient-accent">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold text-gradient mb-1">{(results.overall_score * 100).toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">Learning state + recommendations updated</p>
            </CardContent>
          </Card>
          <Button onClick={() => navigate('/')} className="w-full" variant="outline" size="lg">
            Back to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
