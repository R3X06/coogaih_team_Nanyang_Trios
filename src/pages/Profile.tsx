import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Settings, Shield, Brain, Download, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

const OWL_AVATARS = [
  { id: 'owl_scholar', label: 'Scholar', emoji: '🦉' },
  { id: 'owl_engineer', label: 'Engineer', emoji: '⚙️' },
  { id: 'owl_nightcoder', label: 'Night Coder', emoji: '🌙' },
  { id: 'owl_librarian', label: 'Librarian', emoji: '📚' },
  { id: 'owl_quant', label: 'Quant', emoji: '📊' },
  { id: 'owl_stoic', label: 'Stoic', emoji: '🏛️' },
  { id: 'owl_hacker', label: 'Hacker', emoji: '💻' },
  { id: 'owl_cartographer', label: 'Cartographer', emoji: '🗺️' },
  { id: 'owl_analyst', label: 'Analyst', emoji: '🔬' },
  { id: 'owl_alchemist', label: 'Alchemist', emoji: '⚗️' },
  { id: 'owl_sensei', label: 'Sensei', emoji: '🥋' },
  { id: 'owl_explorer', label: 'Explorer', emoji: '🧭' },
];

const FAILURE_MODES = [
  'careless mistakes', 'rushing', 'overthinking', 'forgetting steps',
  'low focus', 'time pressure', 'concept gaps',
];

export default function Profile() {
  const { user, profile, authUser, refreshProfile } = useUser();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (profile) setForm({ ...profile });
  }, [profile]);

  const update = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const toggleFailureMode = (mode: string) => {
    const current = form.common_failure_mode || [];
    update('common_failure_mode', current.includes(mode) ? current.filter((m: string) => m !== mode) : [...current, mode]);
  };

  const handleSave = async () => {
    if (!authUser) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update(form).eq('user_id', authUser.id);
      if (error) throw error;
      if (form.preferred_name) {
        await supabase.from('users').update({ display_name: form.preferred_name }).eq('id', authUser.id);
      }
      await refreshProfile();
      toast.success('Profile saved');
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const handleExport = async () => {
    if (!authUser) return;
    const [{ data: sessions }, { data: logs }, { data: snaps }] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', authUser.id),
      supabase.from('manual_logs').select('*').eq('user_id', authUser.id),
      supabase.from('state_snapshots').select('*').eq('user_id', authUser.id),
    ]);
    const blob = new Blob([JSON.stringify({ user, profile: form, sessions, manual_logs: logs, state_snapshots: snaps }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coogaih-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  const selectedAvatar = OWL_AVATARS.find(a => a.id === form.avatar_id) || OWL_AVATARS[0];

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <h1 className="font-display text-3xl text-gradient">Profile</h1>

      {/* Summary Card */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full glass flex items-center justify-center text-4xl border-2 border-primary/30">
              {selectedAvatar.emoji}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground">{form.preferred_name || user?.display_name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{form.education_level || '—'} {form.institution ? `· ${form.institution}` : ''}</p>
              <p className="text-xs text-muted-foreground mt-1">Goal: {form.primary_goal || '—'} · Style: {form.preferred_guidance_style || '—'}</p>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={(form.profile_completion || 0) * 100} className="h-1.5 flex-1 max-w-[120px]" />
                <span className="text-[10px] text-muted-foreground">{Math.round((form.profile_completion || 0) * 100)}% complete</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Selector */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Choose Your Owl</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {OWL_AVATARS.map(owl => (
              <button
                key={owl.id}
                onClick={() => update('avatar_id', owl.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                  form.avatar_id === owl.id
                    ? 'glass-active border border-primary/40'
                    : 'glass glass-hover'
                }`}
              >
                <span className="text-2xl">{owl.emoji}</span>
                <span className="text-[10px] text-muted-foreground">{owl.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editable Sections */}
      <Tabs defaultValue="preferences">
        <TabsList>
          <TabsTrigger value="preferences" className="gap-1.5"><Settings className="h-3.5 w-3.5" /> Preferences</TabsTrigger>
          <TabsTrigger value="constraints" className="gap-1.5"><Brain className="h-3.5 w-3.5" /> Constraints</TabsTrigger>
          <TabsTrigger value="calibration" className="gap-1.5"><User className="h-3.5 w-3.5" /> Calibration</TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences">
          <Card>
            <CardContent className="py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Name</Label>
                  <Input value={form.preferred_name || ''} onChange={e => update('preferred_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Education Level</Label>
                  <Select value={form.education_level || ''} onValueChange={v => update('education_level', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="poly">Polytechnic</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Goal</Label>
                  <Select value={form.primary_goal || ''} onValueChange={v => update('primary_goal', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exam">Exam prep</SelectItem>
                      <SelectItem value="coursework">Coursework</SelectItem>
                      <SelectItem value="skills">Skills</SelectItem>
                      <SelectItem value="consistency">Consistency</SelectItem>
                      <SelectItem value="tracking">Tracking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Guidance Style</Label>
                  <Select value={form.preferred_guidance_style || 'tutor'} onValueChange={v => update('preferred_guidance_style', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutor">Tutor</SelectItem>
                      <SelectItem value="consultant">Consultant</SelectItem>
                      <SelectItem value="tracker">Tracker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Feedback Tone</Label>
                <Select value={form.preferred_feedback_tone || 'neutral'} onValueChange={v => update('preferred_feedback_tone', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="encouraging">Encouraging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="constraints">
          <Card>
            <CardContent className="py-5 space-y-4">
              <div className="space-y-2">
                <Label>Weekday study time: {form.typical_available_minutes_weekday || 60} min</Label>
                <Slider value={[form.typical_available_minutes_weekday || 60]} onValueChange={([v]) => update('typical_available_minutes_weekday', v)} min={15} max={240} step={15} />
              </div>
              <div className="space-y-2">
                <Label>Weekend study time: {form.typical_available_minutes_weekend || 120} min</Label>
                <Slider value={[form.typical_available_minutes_weekend || 120]} onValueChange={([v]) => update('typical_available_minutes_weekend', v)} min={15} max={360} step={15} />
              </div>
              <div className="space-y-2">
                <Label>Preferred session length: {form.preferred_session_length_minutes || 25} min</Label>
                <Slider value={[form.preferred_session_length_minutes || 25]} onValueChange={([v]) => update('preferred_session_length_minutes', v)} min={10} max={120} step={5} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Peak Focus Time</Label>
                  <Select value={form.peak_focus_time || 'evening'} onValueChange={v => update('peak_focus_time', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="late_night">Late Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Study Environment</Label>
                  <Select value={form.study_environment || 'quiet'} onValueChange={v => update('study_environment', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiet">Quiet</SelectItem>
                      <SelectItem value="noisy">Noisy</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calibration">
          <Card>
            <CardContent className="py-5 space-y-4">
              <div className="space-y-2">
                <Label>Self-reported Strength</Label>
                <Select value={form.self_reported_strength || 'unsure'} onValueChange={v => update('self_reported_strength', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concepts">Concepts</SelectItem>
                    <SelectItem value="practice">Practice</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="unsure">Unsure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Common Failure Modes</Label>
                <div className="flex flex-wrap gap-2">
                  {FAILURE_MODES.map(mode => (
                    <Badge
                      key={mode}
                      variant={(form.common_failure_mode || []).includes(mode) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${(form.common_failure_mode || []).includes(mode) ? 'bg-primary text-primary-foreground' : 'hover:border-primary/50'}`}
                      onClick={() => toggleFailureMode(mode)}
                    >
                      {mode}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Confidence Style</Label>
                  <Select value={form.confidence_style || 'unsure'} onValueChange={v => update('confidence_style', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="often_overconfident">Overconfident</SelectItem>
                      <SelectItem value="often_underconfident">Underconfident</SelectItem>
                      <SelectItem value="calibrated">Calibrated</SelectItem>
                      <SelectItem value="unsure">Unsure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Persistence Style</Label>
                  <Select value={form.persistence_style || 'take_break_then_return'} onValueChange={v => update('persistence_style', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="push_through">Push through</SelectItem>
                      <SelectItem value="avoid_when_stuck">Avoid when stuck</SelectItem>
                      <SelectItem value="take_break_then_return">Break then return</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Distraction risk: {form.distraction_risk_self_rating || 3}/5</Label>
                <Slider value={[form.distraction_risk_self_rating || 3]} onValueChange={([v]) => update('distraction_risk_self_rating', v)} min={1} max={5} step={1} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardContent className="py-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow AI to use debrief data</Label>
                  <p className="text-xs text-muted-foreground">Used for personalized recommendations</p>
                </div>
                <Switch checked={form.allow_ai_use_of_debrief ?? true} onCheckedChange={v => update('allow_ai_use_of_debrief', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow notes indexing</Label>
                  <p className="text-xs text-muted-foreground">Index uploaded notes for AI search</p>
                </div>
                <Switch checked={form.allow_notes_indexing ?? true} onCheckedChange={v => update('allow_notes_indexing', v)} />
              </div>
              <div className="space-y-2">
                <Label>Telemetry Level</Label>
                <Select value={form.telemetry_level || 'basic_domain_only'} onValueChange={v => update('telemetry_level', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="basic_domain_only">Basic</SelectItem>
                    <SelectItem value="enhanced_titles_optional">Enhanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data retention: {form.data_retention_days || 365} days</Label>
                <Slider value={[form.data_retention_days || 365]} onValueChange={([v]) => update('data_retention_days', v)} min={30} max={730} step={30} />
              </div>
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" /> Export My Data
                </Button>
                <Button variant="destructive" onClick={() => toast.info('Contact support to delete your data.')}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete My Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground font-semibold shadow-glow">
          {saving ? <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save Profile</>}
        </Button>
      </div>
    </div>
  );
}
