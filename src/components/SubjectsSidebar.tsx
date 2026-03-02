import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getSubjects, getLatestSnapshotPerTopic, getTopicsBySubject } from '@/services/api';
import type { Tables } from '@/integrations/supabase/types';
import { BookOpen, AlertTriangle, Plus } from 'lucide-react';

interface SubjectWithMetrics {
  subject: Tables<'subjects'>;
  mastery: number;
  stability: number;
  risk: number;
}

export default function SubjectsSidebar() {
  const { user } = useUser();
  const [subjects, setSubjects] = useState<SubjectWithMetrics[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [allSubjects, snapshots] = await Promise.all([
          getSubjects(),
          getLatestSnapshotPerTopic(user.id),
        ]);
        const snapMap = new Map<string, Tables<'state_snapshots'>>();
        snapshots.forEach(s => snapMap.set(s.topic_tag, s));

        const withMetrics = await Promise.all(allSubjects.map(async (subject) => {
          const topics = await getTopicsBySubject(subject.id);
          const topicSnaps = topics.map(t => snapMap.get(t.id) || snapMap.get(t.name)).filter(Boolean) as Tables<'state_snapshots'>[];
          const avg = (key: keyof Tables<'state_snapshots'>) =>
            topicSnaps.length > 0 ? topicSnaps.reduce((a, s) => a + ((s[key] as number) || 0), 0) / topicSnaps.length : 0;
          return { subject, mastery: avg('concept_strength'), stability: avg('stability'), risk: avg('risk_score') };
        }));
        setSubjects(withMetrics);
      } catch (e) { console.error(e); }
      setLoaded(true);
    })();
  }, [user]);

  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-1.5">Subjects</p>
      {subjects.map(({ subject, mastery, risk }) => (
        <Link
          key={subject.id}
          to={`/subject/${subject.id}`}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent/50 transition-colors group"
        >
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: subject.color_accent || '#f97316' }} />
          <span className="flex-1 truncate text-foreground">{subject.name}</span>
          <span className="text-[10px] text-muted-foreground">{(mastery * 100).toFixed(0)}%</span>
          {risk >= 0.6 && <AlertTriangle className="h-3 w-3 text-destructive" />}
        </Link>
      ))}
      <Link
        to="/manage/subjects"
        className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-primary hover:bg-accent/50 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>{subjects.length === 0 ? 'Add Subject' : 'Manage Subjects'}</span>
      </Link>
    </div>
  );
}
