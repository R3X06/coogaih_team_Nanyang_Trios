import { useState, useEffect } from 'react';
import { getSubjects, getChaptersBySubject, getTopicsByChapter, updateSession } from '@/services/api';
import type { Tables } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';

interface Props {
  sessionId: string;
  currentSubjectId?: string | null;
  currentChapterId?: string | null;
  currentTopicId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export default function SessionMappingModal({ sessionId, currentSubjectId, currentChapterId, currentTopicId, open, onOpenChange, onSaved }: Props) {
  const [subjects, setSubjects] = useState<Tables<'subjects'>[]>([]);
  const [chapters, setChapters] = useState<Tables<'chapters'>[]>([]);
  const [topics, setTopics] = useState<Tables<'topics'>[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(currentSubjectId || '');
  const [selectedChapter, setSelectedChapter] = useState(currentChapterId || '');
  const [selectedTopic, setSelectedTopic] = useState(currentTopicId || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      getSubjects().then(setSubjects).catch(console.error);
      setSelectedSubject(currentSubjectId || '');
      setSelectedChapter(currentChapterId || '');
      setSelectedTopic(currentTopicId || '');
    }
  }, [open, currentSubjectId, currentChapterId, currentTopicId]);

  useEffect(() => {
    if (selectedSubject) {
      getChaptersBySubject(selectedSubject).then(setChapters).catch(console.error);
      if (selectedSubject !== currentSubjectId) { setSelectedChapter(''); setSelectedTopic(''); setTopics([]); }
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedChapter) {
      getTopicsByChapter(selectedChapter).then(setTopics).catch(console.error);
      if (selectedChapter !== currentChapterId) setSelectedTopic('');
    }
  }, [selectedChapter]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSession(sessionId, {
        subject_id: selectedSubject || null,
        chapter_id: selectedChapter || null,
        primary_topic_id: selectedTopic || null,
      } as any);
      onSaved?.();
      onOpenChange(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Map Session to Subject</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="bg-accent/30"><SelectValue placeholder="Select subject..." /></SelectTrigger>
              <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {chapters.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Chapter</label>
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger className="bg-accent/30"><SelectValue placeholder="Select chapter..." /></SelectTrigger>
                <SelectContent>{chapters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {topics.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Topic</label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="bg-accent/30"><SelectValue placeholder="Select topic..." /></SelectTrigger>
                <SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground font-semibold">
            {saving ? 'Saving...' : 'Save Mapping'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
