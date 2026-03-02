import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Settings, Save, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_CONFIG = {
  risk_weights: { volatility: 0.30, fatigue: 0.25, inactivity: 0.20, negative_velocity: 0.15, fragmentation: 0.10 },
  thresholds: { high_risk: 0.60, low_certainty: 0.50 },
  interventions: {
    timed_drills: { duration: '15-20 min', goal: 'increase stability' },
    spaced_recall: { duration: '5 min daily', goal: 'increase retention' },
    concept_deep_dive: { duration: '20-30 min', goal: 'increase concept_strength' },
    short_focus_blocks: { duration: '2x15 min', goal: 'reduce fragmentation + fatigue' },
  },
  prompt_templates: { diagnoser: '(editable text)', planner: '(editable text)', evaluator: '(editable text)' },
};

type SectionKey = 'risk_weights' | 'thresholds' | 'interventions' | 'prompt_templates';

export default function ConfigPage() {
  const [config, setConfig] = useState<any>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);
  const [rawJson, setRawJson] = useState('');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const { data } = await supabase.from('app_config').select('*').eq('key', 'app_config').single();
    if (data?.value) {
      setConfig(data.value);
      setRawJson(JSON.stringify(data.value, null, 2));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    let configToSave = config;

    if (jsonMode) {
      try {
        configToSave = JSON.parse(rawJson);
        setConfig(configToSave);
        setJsonError('');
      } catch {
        setJsonError('Invalid JSON');
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from('app_config')
      .update({ value: configToSave, updated_at: new Date().toISOString() })
      .eq('key', 'app_config');

    if (error) {
      toast.error('Failed to save config');
    } else {
      toast.success('Config saved');
      setRawJson(JSON.stringify(configToSave, null, 2));
    }
    setSaving(false);
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setRawJson(JSON.stringify(DEFAULT_CONFIG, null, 2));
    setJsonError('');
  };

  const updateNestedValue = (section: SectionKey, key: string, value: any, subKey?: string) => {
    setConfig((prev: any) => {
      const updated = { ...prev, [section]: { ...prev[section] } };
      if (subKey) {
        updated[section][key] = { ...updated[section][key], [subKey]: value };
      } else {
        updated[section][key] = value;
      }
      return updated;
    });
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gradient mb-0 flex items-center gap-2">
            <Settings className="h-7 w-7" /> Config
          </h1>
          <p className="text-muted-foreground text-sm">Edit risk weights, thresholds, interventions, and prompt templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setJsonMode(!jsonMode); setRawJson(JSON.stringify(config, null, 2)); }}>
            {jsonMode ? 'Form View' : 'JSON View'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground shadow-glow" size="sm">
            <Save className="h-3 w-3 mr-1" /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {jsonMode ? (
        <Card className="shadow-card border-border gradient-card">
          <CardHeader><CardTitle className="text-sm">Raw JSON</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={rawJson}
              onChange={e => { setRawJson(e.target.value); setJsonError(''); }}
              rows={24}
              className="font-mono text-xs bg-accent/30"
            />
            {jsonError && <p className="text-destructive text-xs mt-2 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{jsonError}</p>}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Risk Weights */}
          <Card className="shadow-card border-border gradient-card">
            <CardHeader><CardTitle className="text-sm font-display text-gradient">Risk Weights</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">Must sum to 1.0. Current sum: {(Object.values(config.risk_weights || {}) as number[]).reduce((a, b) => a + Number(b), 0).toFixed(2)}</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(config.risk_weights || {}).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={val as number}
                      onChange={e => updateNestedValue('risk_weights', key, parseFloat(e.target.value) || 0)}
                      className="bg-accent/30 h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Thresholds */}
          <Card className="shadow-card border-border gradient-card">
            <CardHeader><CardTitle className="text-sm font-display text-gradient">Thresholds</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(config.thresholds || {}).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={val as number}
                      onChange={e => updateNestedValue('thresholds', key, parseFloat(e.target.value) || 0)}
                      className="bg-accent/30 h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interventions */}
          <Card className="shadow-card border-border gradient-card">
            <CardHeader><CardTitle className="text-sm font-display text-gradient">Intervention Templates</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(config.interventions || {}).map(([key, val]: [string, any]) => (
                <div key={key} className="p-3 rounded-lg bg-accent/20 border border-border space-y-2">
                  <p className="text-xs font-semibold text-primary capitalize">{key.replace(/_/g, ' ')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Duration</label>
                      <Input
                        value={val.duration || ''}
                        onChange={e => updateNestedValue('interventions', key, e.target.value, 'duration')}
                        className="bg-accent/30 h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Goal</label>
                      <Input
                        value={val.goal || ''}
                        onChange={e => updateNestedValue('interventions', key, e.target.value, 'goal')}
                        className="bg-accent/30 h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Prompt Templates */}
          <Card className="shadow-card border-border gradient-card">
            <CardHeader><CardTitle className="text-sm font-display text-gradient">Prompt Templates</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(config.prompt_templates || {}).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-muted-foreground capitalize">{key}</label>
                  <Textarea
                    value={val as string}
                    onChange={e => updateNestedValue('prompt_templates', key, e.target.value)}
                    rows={3}
                    className="bg-accent/30 text-xs"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
