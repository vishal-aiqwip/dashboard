import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ChatbotDetail } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';
import { chatbotTrainingCenterService } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';

interface BehaviorTabProps {
  chatbot: ChatbotDetail;
  onSaved: (updated: Partial<ChatbotDetail>) => void;
}

export function BehaviorTab({ chatbot, onSaved }: BehaviorTabProps) {
  const [prompt, setPrompt] = useState(chatbot.prompt ?? '');
  const [aiPolicy, setAiPolicy] = useState(chatbot.ai_policy_message ?? '');
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(
    chatbot.initial_suggested_prompts?.length ? chatbot.initial_suggested_prompts : [''],
  );

  useEffect(() => {
    setPrompt(chatbot.prompt ?? '');
    setAiPolicy(chatbot.ai_policy_message ?? '');
    setSuggestedPrompts(
      chatbot.initial_suggested_prompts?.length ? chatbot.initial_suggested_prompts : [''],
    );
  }, [chatbot]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<ChatbotDetail> = {
        prompt,
        ai_policy_message: aiPolicy,
        initial_suggested_prompts: suggestedPrompts.filter(Boolean),
      };
      await chatbotTrainingCenterService.updateChatbot(chatbot.id, payload);
      return payload;
    },
    onSuccess: (payload) => {
      toast.success('Behavior settings saved');
      onSaved(payload);
    },
    onError: () => toast.error('Failed to save behavior settings'),
  });

  const addPrompt = () => setSuggestedPrompts((prev) => [...prev, '']);
  const removePrompt = (i: number) => setSuggestedPrompts((prev) => prev.filter((_, idx) => idx !== i));
  const updatePrompt = (i: number, val: string) =>
    setSuggestedPrompts((prev) => prev.map((p, idx) => (idx === i ? val : p)));

  const isDirty =
    prompt !== (chatbot.prompt ?? '') ||
    aiPolicy !== (chatbot.ai_policy_message ?? '') ||
    JSON.stringify(suggestedPrompts) !== JSON.stringify(chatbot.initial_suggested_prompts ?? ['']);

  return (
    <div className="space-y-8">
      {/* System prompt */}
      <section className="space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            System prompt
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Instructions that define the chatbot's tone, personality, and behaviour.
          </p>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="You are a helpful hotel concierge assistant…"
          className="min-h-64 resize-y border-grey-100 font-mono text-sm leading-relaxed"
        />
      </section>

      {/* Suggested prompts */}
      <section className="space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Suggested prompts
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Starter questions shown to users when they open the chat.
          </p>
        </div>
        <div className="space-y-2">
          {suggestedPrompts.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={p}
                onChange={(e) => updatePrompt(i, e.target.value)}
                placeholder={`Suggested prompt ${i + 1}`}
                className="border-grey-100"
              />
              {suggestedPrompts.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removePrompt(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
          {suggestedPrompts.length < 5 && (
            <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={addPrompt}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add prompt
            </Button>
          )}
        </div>
      </section>

      {/* AI policy message */}
      <section className="space-y-3">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            AI policy message
          </Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Disclaimer shown when the chatbot uses AI-generated content.
          </p>
        </div>
        <Textarea
          value={aiPolicy}
          onChange={(e) => setAiPolicy(e.target.value)}
          placeholder="This response was generated by AI and may not be fully accurate…"
          className="min-h-24 resize-y border-grey-100 text-sm"
        />
      </section>

      <div className="flex justify-end border-t border-grey-100 pt-4">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !isDirty}>
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save behavior settings
        </Button>
      </div>
    </div>
  );
}
