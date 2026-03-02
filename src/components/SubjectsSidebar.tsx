import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getSubjects, getLatestSnapshotPerTopic, getTopicsBySubject, getChaptersBySubject } from '@/services/api';
import type { Tables } from '@/integrations/supabase/types';
import { AlertTriangle, Plus } from 'lucide-react';

interface SubjectWithMetrics {
  subject: Tables<'subjects'>;
  mastery: number;
  risk: number;
  topicCount: number;
}

export default function SubjectsSidebar() {
  const { user } = useUser();
  const [subjects, setSubjects] = useState<SubjectWithMetrics[]>([]);

  const loadSubjects = async () => {
    if (!user) return;
    try {
      const [allSubjects, snapshots] = await Promise.all([
        getSubjects(),
        getLatestSnapshotPerTopic(user.id),
      ]);
      const snapMap = new Map<string, Tables<'state_snapshots'>>();
      snapshots.forEach(s => snapMap.set(s.topic_tag, s));

      const withMetrics = await Promise.all(allSubjects.map(async (subject) => {
        const [topics, chapters] = await Promise.all([
          getTopicsBySubject(subject.id),
          getChaptersBySubject(subject.id),
        ]);
        const topicSnaps = topics.map(t => snapMap.get(t.id) || snapMap.get(t.name)).filter(Boolean) as Tables<'state_snapshots'>[];
        const avg = (key: keyof Tables<'state_snapshots'>) =>
          topicSnaps.length > 0 ? topicSnaps.reduce((a, s) => a + ((s[key] as number) || 0), 0) / topicSnaps.length : 0;
        return { subject, mastery: avg('concept_strength'), risk: avg('risk_score'), topicCount: topics.length };
      }));
      setSubjects(withMetrics);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadSubjects(); }, [user]);

  // Listen for subject changes via storage event (cross-component refresh)
  useEffect(() => {
    const handler = () => loadSubjects();
    window.addEventListener('subjects-updated', handler);
    return () => window.removeEventListener('subjects-updated', handler);
  }, [user]);

  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-1.5">Subjects</p>
      {subjects.length === 0 && (
        <p className="text-xs text-muted-foreground px-3 py-2">No subjects yet</p>
      )}
      {subjects.map(({ subject, mastery, risk, topicCount }) => (
        <Link
          key={subject.id}
          to={`/subject/${subject.id}`}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent/50 transition-colors group"
        >
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: subject.color_accent || '#f97316' }} />
          <div className="flex-1 min-w-0">
            <span className="block truncate text-foreground">{subject.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {topicCount} topic{topicCount !== 1 ? 's' : ''} · {mastery > 0 ? `${(mastery * 100).toFixed(0)}%` : '—'}
            </span>
          </div>
          {risk >= 0.6 && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
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
