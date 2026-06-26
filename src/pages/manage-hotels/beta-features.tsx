import { useState } from 'react';
import { IconFlask } from '@tabler/icons-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

type Feature = {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
};

const DEFAULT_FEATURES: Feature[] = [
  {
    id: 'ai-reply-suggestions',
    name: 'AI Reply Suggestions',
    description: 'Surface real-time AI-generated reply suggestions inside the email inbox.',
    category: 'Email',
    enabled: false,
  },
  {
    id: 'smart-routing',
    name: 'Smart Email Routing',
    description: 'Automatically route incoming emails to the correct department based on intent.',
    category: 'Email',
    enabled: false,
  },
  {
    id: 'guest-sentiment',
    name: 'Guest Sentiment Analysis',
    description: 'Analyse guest messages in real-time and surface sentiment scores.',
    category: 'Analytics',
    enabled: false,
  },
  {
    id: 'chatbot-v2',
    name: 'Chatbot V2 Engine',
    description: 'Next-generation chatbot engine with improved context handling and multilingual support.',
    category: 'Chatbot',
    enabled: false,
  },
  {
    id: 'bulk-campaigns',
    name: 'Bulk Email Campaigns',
    description: 'Send targeted bulk email campaigns to guest segments.',
    category: 'Email',
    enabled: false,
  },
  {
    id: 'pms-sync',
    name: 'Real-time PMS Sync',
    description: 'Continuous two-way sync with your Property Management System.',
    category: 'Integrations',
    enabled: false,
  },
];

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

export default function BetaFeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>(DEFAULT_FEATURES);

  const toggleFeature = (id: string, enabled: boolean) => {
    setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, enabled } : f)));
    const name = features.find((f) => f.id === id)?.name ?? 'Feature';
    toast.success(`${name} ${enabled ? 'enabled' : 'disabled'}`);
  };

  const enabledCount = features.filter((f) => f.enabled).length;
  const categories = [...new Set(features.map((f) => f.category))];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
              <IconFlask className="size-4 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Beta Features</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Enable or disable experimental features across your platform.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Features" value={features.length} />
        <StatCard label="Enabled" value={enabledCount} />
        <StatCard label="Disabled" value={features.length - enabledCount} />
      </div>

      <div className="flex flex-col gap-6">
        {categories.map((category) => (
          <div key={category} className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {category}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {features
                .filter((f) => f.category === category)
                .map((feature) => (
                  <Card key={feature.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-sm font-medium">{feature.name}</CardTitle>
                          <CardDescription className="text-xs">{feature.description}</CardDescription>
                        </div>
                        <Switch
                          checked={feature.enabled}
                          onCheckedChange={(v) => toggleFeature(feature.id, v)}
                          className="mt-0.5 shrink-0"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Badge variant={feature.enabled ? 'default' : 'secondary'} className="text-xs">
                        {feature.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
