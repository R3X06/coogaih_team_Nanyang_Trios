import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getSubjects, createSubject, deleteSubject, getChaptersBySubject, createChapter, deleteChapter, getTopicsByChapter, createTopic, deleteTopic } from '@/services/api';
import type { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ChevronDown, ChevronRight, BookOpen, Layers, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ManageSubjects() {
  const { user } = useUser();
  const [subjects, setSubjects] = useState<Tables<'subjects'>[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Record<string, Tables<'chapters'>[]>>({});
  const [topics, setTopics] = useState<Record<string, Tables<'topics'>[]>>({});

  // Add forms
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#f97316');
  const [newChapterName, setNewChapterName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);

  const loadSubjects = async () => {
    const data = await getSubjects();
    setSubjects(data);
  };

  useEffect(() => { loadSubjects(); }, []);

  const loadChapters = async (subjectId: string) => {
    const data = await getChaptersBySubject(subjectId);
    setChapters(prev => ({ ...prev, [subjectId]: data }));
  };

  const loadTopics = async (chapterId: string) => {
    const data = await getTopicsByChapter(chapterId);
    setTopics(prev => ({ ...prev, [chapterId]: data }));
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim() || !user) return;
    await createSubject({ name: newSubjectName.trim(), description: newSubjectDesc.trim(), color_accent: newSubjectColor, user_id: user.id });
    setNewSubjectName(''); setNewSubjectDesc(''); setNewSubjectColor('#f97316');
    setAddSubjectOpen(false);
    await loadSubjects();
  };

  const handleDeleteSubject = async (id: string) => {
    await deleteSubject(id);
    await loadSubjects();
  };

  const handleAddChapter = async (subjectId: string) => {
    if (!newChapterName.trim() || !user) return;
    const existing = chapters[subjectId] || [];
    await createChapter({ subject_id: subjectId, name: newChapterName.trim(), order_index: existing.length, user_id: user.id });
    setNewChapterName('');
    await loadChapters(subjectId);
  };

  const handleDeleteChapter = async (id: string, subjectId: string) => {
    await deleteChapter(id);
    await loadChapters(subjectId);
  };

  const handleAddTopic = async (chapterId: string) => {
    if (!newTopicName.trim() || !user) return;
    const existing = topics[chapterId] || [];
    await createTopic({ chapter_id: chapterId, name: newTopicName.trim(), order_index: existing.length, user_id: user.id });
    setNewTopicName('');
    await loadTopics(chapterId);
  };

  const handleDeleteTopic = async (id: string, chapterId: string) => {
    await deleteTopic(id);
    await loadTopics(chapterId);
  };

  const toggleSubject = (id: string) => {
    if (expandedSubject === id) { setExpandedSubject(null); return; }
    setExpandedSubject(id);
    if (!chapters[id]) loadChapters(id);
  };

  const toggleChapter = (id: string) => {
    if (expandedChapter === id) { setExpandedChapter(null); return; }
    setExpandedChapter(id);
    if (!topics[id]) loadTopics(id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gradient mb-1">Manage Subjects</h1>
          <p className="text-muted-foreground text-sm">Organize your learning hierarchy.</p>
        </div>
        <Dialog open={addSubjectOpen} onOpenChange={setAddSubjectOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground font-semibold shadow-glow">
              <Plus className="h-4 w-4 mr-2" /> Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Subject</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="Subject name" className="bg-accent/30" />
              <Textarea value={newSubjectDesc} onChange={e => setNewSubjectDesc(e.target.value)} placeholder="Description (optional)" rows={2} className="bg-accent/30" />
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Color:</label>
                <input type="color" value={newSubjectColor} onChange={e => setNewSubjectColor(e.target.value)} className="h-8 w-12 rounded cursor-pointer" />
              </div>
              <Button onClick={handleAddSubject} className="w-full gradient-primary text-primary-foreground">Create Subject</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {subjects.length === 0 && (
        <Card className="shadow-card border-border gradient-card">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No subjects yet. Create your first subject to begin tracking.</p>
          </CardContent>
        </Card>
      )}

      {subjects.map(subject => {
        const isExpanded = expandedSubject === subject.id;
        const subChapters = chapters[subject.id] || [];
        return (
          <Card key={subject.id} className="shadow-card border-border gradient-card">
            <button className="w-full text-left" onClick={() => toggleSubject(subject.id)}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <span className="h-3 w-3 rounded-full" style={{ background: subject.color_accent || '#f97316' }} />
                    <CardTitle className="text-sm font-semibold">{subject.name}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={e => { e.stopPropagation(); handleDeleteSubject(subject.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
            </button>
            {isExpanded && (
              <CardContent className="pt-0 space-y-3">
                {subChapters.map(ch => {
                  const chExpanded = expandedChapter === ch.id;
                  const chTopics = topics[ch.id] || [];
                  return (
                    <div key={ch.id} className="ml-4 border-l-2 border-border pl-3">
                      <button className="w-full text-left flex items-center justify-between py-1.5" onClick={() => toggleChapter(ch.id)}>
                        <div className="flex items-center gap-2 text-sm">
                          {chExpanded ? <ChevronDown className="h-3.5 w-3.5 text-primary" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-foreground font-medium">{ch.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={e => { e.stopPropagation(); handleDeleteChapter(ch.id, subject.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </button>
                      {chExpanded && (
                        <div className="ml-5 space-y-1 mt-1">
                          {chTopics.map(t => (
                            <div key={t.id} className="flex items-center justify-between py-1 px-2 rounded bg-accent/20 text-sm">
                              <div className="flex items-center gap-2">
                                <Tag className="h-3 w-3 text-muted-foreground" />
                                <span className="text-foreground">{t.name}</span>
                              </div>
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteTopic(t.id, ch.id)}>
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-1">
                            <Input value={expandedChapter === ch.id ? newTopicName : ''} onChange={e => setNewTopicName(e.target.value)} placeholder="New topic name" className="bg-accent/30 h-7 text-xs" onKeyDown={e => e.key === 'Enter' && handleAddTopic(ch.id)} />
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddTopic(ch.id)}><Plus className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="ml-4 flex gap-2">
                  <Input value={expandedSubject === subject.id ? newChapterName : ''} onChange={e => setNewChapterName(e.target.value)} placeholder="New chapter name" className="bg-accent/30 h-8 text-xs" onKeyDown={e => e.key === 'Enter' && handleAddChapter(subject.id)} />
                  <Button variant="ghost" size="sm" onClick={() => handleAddChapter(subject.id)}><Plus className="h-3.5 w-3.5 mr-1" /> Chapter</Button>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
