import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLatestSnapshots, getSessions, getManualLogs } from '@/services/api';
import { useUser } from '@/contexts/UserContext';
import type { Tables } from '@/integrations/supabase/types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Minus, Play, PenLine, X } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  topicName: string;
  chapterName: string;
  subjectName: string;
  subjectId?: string;
  chapterId?: string;
}

export default function TopicDetailDrawer({ open, onOpenChange, topicId, topicName, chapterName, subjectName, subjectId, chapterId }: Props) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<Tables<'state_snapshots'>[]>([]);
  const [linkedSessions, setLinkedSessions] = useState<Tables<'sessions'>[]>([]);
  const [linkedLogs, setLinkedLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const [allSnaps, allSessions, allLogs] = await Promise.all([
        getLatestSnapshots(user.id),
        getSessions(user.id),
        getManualLogs(user.id),
      ]);
      // Filter snapshots for this topic
      const topicSnaps = allSnaps.filter(s => s.topic_tag === topicId || s.topic_tag === topicName).slice(0, 10);
      setSnapshots(topicSnaps);
      // Filter sessions linked to this topic
      setLinkedSessions(allSessions.filter(s => s.primary_topic_id === topicId || (s.topic_tags || []).includes(topicName)).slice(0, 3));
      setLinkedLogs(allLogs.filter((l: any) => l.topic_id === topicId).slice(0, 3));
    })();
  }, [open, user, topicId, topicName]);

  const latest = snapshots[0];
  const vel = latest?.velocity_direction || 0;
  const mag = latest?.velocity_magnitude || 0;

  const handleStartSession = () => {
    // Store preselection in sessionStorage and navigate
    sessionStorage.setItem('preselect_subject', subjectId || '');
    sessionStorage.setItem('preselect_chapter', chapterId || '');
    sessionStorage.setItem('preselect_topic', topicId);
    navigate('/session/start');
    onOpenChange(false);
  };

  const handleManualLog = () => {
    sessionStorage.setItem('preselect_subject', subjectId || '');
    sessionStorage.setItem('preselect_chapter', chapterId || '');
    sessionStorage.setItem('preselect_topic', topicId);
    navigate('/log/manual');
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex items-center justify-between">
          <div>
            <DrawerTitle className="text-lg font-display text-gradient">{topicName}</DrawerTitle>
            <p className="text-xs text-muted-foreground">{subjectName} → {chapterName}</p>
          </div>
          <DrawerClose asChild><Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button></DrawerClose>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-4 overflow-y-auto">
          {/* Skill Vector */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Strength', value: latest?.concept_strength },
              { label: 'Stability', value: latest?.stability },
              { label: 'Risk', value: latest?.risk_score },
            ].map(m => (
              <div key={m.label} className="text-center p-3 rounded-lg bg-accent/30">
                <p className="text-xl font-bold text-foreground">{m.value != null ? `${(m.value * 100).toFixed(0)}%` : '—'}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Extended metrics */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { label: 'Calibration', value: latest?.calibration_gap },
              { label: 'Stamina', value: latest?.stamina },
              { label: 'Recovery', value: latest?.recovery_rate },
              { label: 'Certainty', value: latest?.certainty },
            ].map(m => (
              <div key={m.label} className="p-2 rounded bg-accent/20">
                <p className="font-semibold text-foreground">{m.value != null ? `${(m.value * 100).toFixed(0)}%` : '—'}</p>
                <p className="text-[9px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Velocity */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Velocity:</span>
            {mag < 0.05 ? <Minus className="h-4 w-4 text-muted-foreground" /> : vel > 0 ? <ArrowUp className="h-4 w-4 text-success" /> : <ArrowDown className="h-4 w-4 text-destructive" />}
            <span className="text-foreground">{mag < 0.05 ? 'Flat' : vel > 0 ? 'Improving' : 'Declining'}</span>
          </div>

          {/* Trend sparkline (simple text-based) */}
          {snapshots.length > 1 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Strength Trend (last {snapshots.length} snapshots)</p>
              <div className="flex items-end gap-1 h-8">
                {[...snapshots].reverse().map((s, i) => (
                  <div key={i} className="flex-1 rounded-t bg-primary/60" style={{ height: `${(s.concept_strength || 0) * 100}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* Linked sessions/logs */}
          {(linkedSessions.length > 0 || linkedLogs.length > 0) && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Recent Activity</p>
              <div className="space-y-1.5">
                {linkedSessions.map(s => (
                  <div key={s.id} className="flex items-center gap-2 py-1.5 px-3 rounded bg-accent/20 text-sm">
                    <Play className="h-3 w-3 text-primary" />
                    <span className="text-foreground">{new Date(s.start_time).toLocaleDateString()}</span>
                    <span className="text-muted-foreground text-xs">{s.duration_sec ? `${Math.floor(s.duration_sec / 60)}m` : '—'}</span>
                  </div>
                ))}
                {linkedLogs.map((l: any) => (
                  <div key={l.id} className="flex items-center gap-2 py-1.5 px-3 rounded bg-accent/20 text-sm">
                    <PenLine className="h-3 w-3 text-primary" />
                    <span className="text-foreground">{new Date(l.created_at).toLocaleDateString()}</span>
                    <span className="text-muted-foreground text-xs">{l.duration_sec ? `${Math.floor(l.duration_sec / 60)}m` : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleStartSession} className="flex-1 gradient-primary text-primary-foreground font-semibold shadow-glow">
              <Play className="h-4 w-4 mr-2" /> Start Session
            </Button>
            <Button onClick={handleManualLog} variant="outline" className="flex-1 border-primary/30">
              <PenLine className="h-4 w-4 mr-2" /> Manual Log
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
