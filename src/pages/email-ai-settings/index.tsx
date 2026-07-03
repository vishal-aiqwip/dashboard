import {
  BookOpen,
  Loader2,
  Mail,
  MessageSquare,
  Settings,
  Sparkles,
  Tags,
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSelector } from '@/redux/hooks';

import { CategoriesTab } from './_components/categories-tab';
import { CustomToolPromptTab } from './_components/custom-tool-prompt-tab';
import { EmailSamplesTab } from './_components/email-samples-tab';
import { MailboxesTab } from './_components/mailboxes-tab';
import { SelfLearningTab } from './_components/self-learning-tab';
import { WritingGuidelinesTab } from './_components/writing-guidelines-tab';

// ── Tab definitions ────────────────────────────────────────────────────────────

const TABS = [
  { value: 'writing-guidelines', label: 'Writing Guidelines', Icon: BookOpen },
  { value: 'email-samples', label: 'Email Samples', Icon: Mail },
  { value: 'custom-tool-prompt', label: 'Custom Tool Prompt', Icon: MessageSquare },
  { value: 'mailboxes', label: 'Mailboxes', Icon: Settings },
  { value: 'self-learning', label: 'Self Learning', Icon: Sparkles },
  { value: 'categories', label: 'Categories', Icon: Tags },
] as const;

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AiEmailSettingsPage() {
  const selectedOrg = useAppSelector((state: any) => state.selectedOrg.selectedOrg);
  const orgId: string = selectedOrg?.id ?? '';

  if (!orgId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-full p-5 sm:p-6">
      {/* Inner sheet — matches old frontend's rounded inner card */}
      <div className="overflow-hidden rounded-[18px] border border-border/50 bg-card shadow-[0_10px_40px_-18px_rgba(15,23,42,0.12),0_1px_0_rgba(15,23,42,0.04)]">
        <div className="p-5 sm:p-6 md:p-8">

          {/* ── Page header ───────────────────────────────────────────────────── */}
          <div className=" space-y-2  text-left ">
          
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              AI Email Settings
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Configure writing guidelines, email samples, mailboxes, and AI learning for your
              organization.
            </p>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────────── */}
          <Tabs defaultValue="writing-guidelines">
            <TabsList variant={'accent-tab'} className='border-border border mt-4' >
              {TABS.map(({ value, label, Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className=""
                >
                  <Icon className="h-3.5 w-3.5  shrink-0" strokeWidth={1.5} />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-4">
              <TabsContent value="writing-guidelines"><WritingGuidelinesTab orgId={orgId} /></TabsContent>
              <TabsContent value="email-samples"><EmailSamplesTab orgId={orgId} /></TabsContent>
              <TabsContent value="custom-tool-prompt"><CustomToolPromptTab orgId={orgId} /></TabsContent>
              <TabsContent value="mailboxes"><MailboxesTab orgId={orgId} /></TabsContent>
              <TabsContent value="self-learning"><SelfLearningTab orgId={orgId} /></TabsContent>
              <TabsContent value="categories"><CategoriesTab orgId={orgId} /></TabsContent>
            </div>
          </Tabs>

        </div>
      </div>
    </div>
  );
}
