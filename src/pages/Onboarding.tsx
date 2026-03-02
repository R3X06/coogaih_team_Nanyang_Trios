import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import OwlLogo from '@/components/OwlLogo';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

const FAILURE_MODES = [
  'careless mistakes', 'rushing', 'overthinking', 'forgetting steps',
  'low focus', 'time pressure', 'concept gaps',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { authUser, refreshProfile } = useUser();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    preferred_name: '',
    education_level: '' as string,
    institution: '',
    primary_goal: '' as string,
    preferred_guidance_style: 'tutor' as string,
    typical_available_minutes_weekday: 60,
    typical_available_minutes_weekend: 120,
    preferred_session_length_minutes: 25,
    peak_focus_time: 'evening' as string,
    common_failure_mode: [] as string[],
    confidence_style: 'unsure' as string,
    persistence_style: 'take_break_then_return' as string,
    telemetry_level: 'basic_domain_only' as string,
    allow_notes_indexing: true,
    allow_ai_use_of_debrief: true,
  });

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const toggleFailureMode = (mode: string) => {
    setForm(f => ({
      ...f,
      common_failure_mode: f.common_failure_mode.includes(mode)
        ? f.common_failure_mode.filter(m => m !== mode)
        : [...f.common_failure_mode, mode],
    }));
  };

  const handleFinish = async () => {
    if (!authUser) return;
    setSaving(true);
    try {
      const profileCompletion = [
        form.preferred_name, form.education_level, form.primary_goal,
        form.preferred_guidance_style, form.common_failure_mode.length > 0,
      ].filter(Boolean).length / 5;

      await supabase.from('profiles').update({
        ...form,
        onboarding_completed: true,
        profile_completion: profileCompletion,
      } as any).eq('user_id', authUser.id);

      // Update display name
      if (form.preferred_name) {
        await supabase.from('users').update({
          display_name: form.preferred_name,
        }).eq('id', authUser.id);
      }

      await refreshProfile();
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleSkip = async () => {
    if (!authUser) return;
    await supabase.from('profiles').update({
      onboarding_completed: true,
      profile_completion: 0,
    } as any).eq('user_id', authUser.id);
    await refreshProfile();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <OwlLogo className="h-10 w-10 mx-auto mb-2" />
          <CardTitle className="font-display text-2xl text-gradient">Welcome to Coogaih</CardTitle>
          <p className="text-muted-foreground text-sm">Step {step} of 3 — {step === 1 ? 'Identity & Goals' : step === 2 ? 'Study Constraints' : 'Calibration & Privacy'}</p>
          {/* Progress */}
          <div className="flex gap-1 mt-3">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Preferred Name</Label>
                <Input placeholder="What should we call you?" value={form.preferred_name} onChange={e => update('preferred_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Education Level</Label>
                <Select value={form.education_level} onValueChange={v => update('education_level', v)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="poly">Polytechnic</SelectItem>
                    <SelectItem value="university">University</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Institution (optional)</Label>
                <Input placeholder="Your school / university" value={form.institution} onChange={e => update('institution', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Primary Goal</Label>
                <Select value={form.primary_goal} onValueChange={v => update('primary_goal', v)}>
                  <SelectTrigger><SelectValue placeholder="What drives you?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Exam preparation</SelectItem>
                    <SelectItem value="coursework">Coursework mastery</SelectItem>
                    <SelectItem value="skills">Skill building</SelectItem>
                    <SelectItem value="consistency">Study consistency</SelectItem>
                    <SelectItem value="tracking">Progress tracking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Guidance Style</Label>
                <Select value={form.preferred_guidance_style} onValueChange={v => update('preferred_guidance_style', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tutor">Tutor — step-by-step plans</SelectItem>
                    <SelectItem value="consultant">Consultant — strategic insights</SelectItem>
                    <SelectItem value="tracker">Tracker — concise metrics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Available weekday study time: {form.typical_available_minutes_weekday} min</Label>
                <Slider value={[form.typical_available_minutes_weekday]} onValueChange={([v]) => update('typical_available_minutes_weekday', v)} min={15} max={240} step={15} />
              </div>
              <div className="space-y-2">
                <Label>Available weekend study time: {form.typical_available_minutes_weekend} min</Label>
                <Slider value={[form.typical_available_minutes_weekend]} onValueChange={([v]) => update('typical_available_minutes_weekend', v)} min={15} max={360} step={15} />
              </div>
              <div className="space-y-2">
                <Label>Preferred session length: {form.preferred_session_length_minutes} min</Label>
                <Slider value={[form.preferred_session_length_minutes]} onValueChange={([v]) => update('preferred_session_length_minutes', v)} min={10} max={120} step={5} />
              </div>
              <div className="space-y-2">
                <Label>Peak Focus Time</Label>
                <Select value={form.peak_focus_time} onValueChange={v => update('peak_focus_time', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="late_night">Late Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Common Failure Modes (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {FAILURE_MODES.map(mode => (
                    <Badge
                      key={mode}
                      variant={form.common_failure_mode.includes(mode) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${form.common_failure_mode.includes(mode) ? 'bg-primary text-primary-foreground' : 'hover:border-primary/50'}`}
                      onClick={() => toggleFailureMode(mode)}
                    >
                      {mode}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confidence Style</Label>
                <Select value={form.confidence_style} onValueChange={v => update('confidence_style', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="often_overconfident">Often overconfident</SelectItem>
                    <SelectItem value="often_underconfident">Often underconfident</SelectItem>
                    <SelectItem value="calibrated">Well calibrated</SelectItem>
                    <SelectItem value="unsure">Not sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Privacy Controls</p>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Allow AI to use debrief data</Label>
                  <Switch checked={form.allow_ai_use_of_debrief} onCheckedChange={v => update('allow_ai_use_of_debrief', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Allow notes indexing</Label>
                  <Switch checked={form.allow_notes_indexing} onCheckedChange={v => update('allow_notes_indexing', v)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Telemetry Level</Label>
                  <Select value={form.telemetry_level} onValueChange={v => update('telemetry_level', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="basic_domain_only">Basic (domain only)</SelectItem>
                      <SelectItem value="enhanced_titles_optional">Enhanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                Skip for now
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)} className="gradient-primary text-primary-foreground">
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving} className="gradient-primary text-primary-foreground">
                {saving ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Check className="h-4 w-4 mr-1" /> Finish Setup</>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
