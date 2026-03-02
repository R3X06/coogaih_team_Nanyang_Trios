import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudySessions } from '@/hooks/useStudyData';
import { DEFAULT_USER_ID, type TelemetryEntry } from '@/types/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, Brain, AlertCircle, Gauge } from 'lucide-react';

export default function StartSession() {
  const navigate = useNavigate();
  const { addSession, updateSession } = useStudySessions();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [focusLevel, setFocusLevel] = useState(7);
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>([]);
  const [simMode, setSimMode] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const simRef = useRef<number | null>(null);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    const id = crypto.randomUUID();
    const session = {
      id,
      userId: DEFAULT_USER_ID,
      startTime: new Date().toISOString(),
      status: 'active' as const,
      telemetry: [],
    };
    addSession(session);
    setSessionId(id);
    setRunning(true);
    setElapsed(0);
    setTelemetry([]);
  };

  const handlePause = () => setRunning(prev => !prev);

  const handleStop = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (simRef.current) clearInterval(simRef.current);
    if (sessionId) {
      updateSession(sessionId, {
        endTime: new Date().toISOString(),
        duration: elapsed,
        telemetry,
      });
      navigate(`/session/debrief/${sessionId}`);
    }
  };

  const recordTelemetry = useCallback(() => {
    const entry: TelemetryEntry = {
      timestamp: new Date().toISOString(),
      focusLevel,
      distractionFlag: focusLevel < 4,
    };
    setTelemetry(prev => [...prev, entry]);
  }, [focusLevel]);

  // Timer
  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => setElapsed(e => e + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  // Simulated telemetry
  useEffect(() => {
    if (running && simMode) {
      simRef.current = window.setInterval(() => {
        const simFocus = Math.max(1, Math.min(10, focusLevel + Math.floor(Math.random() * 5) - 2));
        setFocusLevel(simFocus);
        const entry: TelemetryEntry = {
          timestamp: new Date().toISOString(),
          focusLevel: simFocus,
          distractionFlag: simFocus < 4,
        };
        setTelemetry(prev => [...prev, entry]);
      }, 5000);
    } else if (simRef.current) {
      clearInterval(simRef.current);
    }
    return () => { if (simRef.current) clearInterval(simRef.current); };
  }, [running, simMode]);

  const avgFocus = telemetry.length > 0
    ? (telemetry.reduce((a, t) => a + t.focusLevel, 0) / telemetry.length).toFixed(1)
    : '—';

  const distractions = telemetry.filter(t => t.distractionFlag).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-gradient mb-1">Study Session</h1>
        <p className="text-muted-foreground text-sm">Focus. Learn. Grow.</p>
      </div>

      {/* Timer */}
      <Card className="shadow-card border-border text-center">
        <CardContent className="py-10">
          <div className={`text-7xl font-mono font-bold tracking-wider mb-6 ${running ? 'text-primary animate-pulse-glow' : 'text-foreground'}`}>
            {formatTime(elapsed)}
          </div>
          <div className="flex justify-center gap-3">
            {!sessionId ? (
              <Button onClick={handleStart} className="gradient-primary text-primary-foreground font-semibold shadow-glow px-8">
                <Play className="h-4 w-4 mr-2" /> Start
              </Button>
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

      {/* Telemetry Controls */}
      {sessionId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Manual Focus Input */}
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" /> Focus Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider
                value={[focusLevel]}
                onValueChange={([v]) => setFocusLevel(v)}
                min={1} max={10} step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Distracted (1)</span>
                <span className="text-lg font-bold text-primary">{focusLevel}</span>
                <span>Deep Focus (10)</span>
              </div>
              <Button onClick={recordTelemetry} variant="outline" className="w-full" disabled={!running}>
                Record Snapshot
              </Button>
            </CardContent>
          </Card>

          {/* Telemetry Panel */}
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> Attention Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Readings</span>
                <span className="font-medium">{telemetry.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Focus</span>
                <span className="font-medium text-info">{avgFocus}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Distractions</span>
                <span className="font-medium text-destructive">{distractions}</span>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t border-border">
                <input
                  type="checkbox"
                  checked={simMode}
                  onChange={e => setSimMode(e.target.checked)}
                  className="rounded border-border accent-primary"
                />
                <span className="text-muted-foreground">Simulate telemetry</span>
              </label>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Focus Timeline */}
      {telemetry.length > 0 && (
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" /> Focus Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-20">
              {telemetry.slice(-40).map((t, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t transition-all ${t.distractionFlag ? 'bg-destructive/60' : 'bg-primary/60'}`}
                  style={{ height: `${(t.focusLevel / 10) * 100}%` }}
                  title={`Focus: ${t.focusLevel}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
