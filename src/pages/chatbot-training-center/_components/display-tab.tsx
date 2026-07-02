import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ChatbotDetail, ChatbotColorConfig } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';
import { chatbotTrainingCenterService } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';

interface DisplayTabProps {
  chatbot: ChatbotDetail;
  onSaved: (updated: Partial<ChatbotDetail>) => void;
}

type FormValues = {
  header_text: string;
  welcome_message: string;
  floating_message: string;
  placeholder_text: string;
  header_bg_color: string;
  header_text_color: string;
  bot_bg_color: string;
  bot_text_color: string;
  user_bg_color: string;
  user_text_color: string;
  bubble_bg_color: string;
  bg_color: string;
};

const COLOR_FIELDS: { key: keyof ChatbotColorConfig; label: string }[] = [
  { key: 'header_bg_color', label: 'Header background' },
  { key: 'header_text_color', label: 'Header text' },
  { key: 'bot_bg_color', label: 'Bot message background' },
  { key: 'bot_text_color', label: 'Bot message text' },
  { key: 'user_bg_color', label: 'User message background' },
  { key: 'user_text_color', label: 'User message text' },
  { key: 'bubble_bg_color', label: 'Bubble color' },
  { key: 'bg_color', label: 'Chat background' },
];

export function DisplayTab({ chatbot, onSaved }: DisplayTabProps) {
  const cc = chatbot.color_config ?? {};

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<FormValues>({
    defaultValues: {
      header_text: chatbot.header_text ?? '',
      welcome_message: chatbot.welcome_message ?? '',
      floating_message: chatbot.floating_message ?? '',
      placeholder_text: chatbot.placeholder_text ?? '',
      header_bg_color: cc.header_bg_color ?? '#ffffff',
      header_text_color: cc.header_text_color ?? '#000000',
      bot_bg_color: cc.bot_bg_color ?? '#f3f4f6',
      bot_text_color: cc.bot_text_color ?? '#111827',
      user_bg_color: cc.user_bg_color ?? '#3b82f6',
      user_text_color: cc.user_text_color ?? '#ffffff',
      bubble_bg_color: cc.bubble_bg_color ?? '#3b82f6',
      bg_color: cc.bg_color ?? '#ffffff',
    },
  });

  useEffect(() => {
    const c = chatbot.color_config ?? {};
    reset({
      header_text: chatbot.header_text ?? '',
      welcome_message: chatbot.welcome_message ?? '',
      floating_message: chatbot.floating_message ?? '',
      placeholder_text: chatbot.placeholder_text ?? '',
      header_bg_color: c.header_bg_color ?? '#ffffff',
      header_text_color: c.header_text_color ?? '#000000',
      bot_bg_color: c.bot_bg_color ?? '#f3f4f6',
      bot_text_color: c.bot_text_color ?? '#111827',
      user_bg_color: c.user_bg_color ?? '#3b82f6',
      user_text_color: c.user_text_color ?? '#ffffff',
      bubble_bg_color: c.bubble_bg_color ?? '#3b82f6',
      bg_color: c.bg_color ?? '#ffffff',
    });
  }, [chatbot, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: Partial<ChatbotDetail> = {
        header_text: values.header_text,
        welcome_message: values.welcome_message,
        floating_message: values.floating_message,
        placeholder_text: values.placeholder_text,
        color_config: {
          ...(chatbot.color_config ?? {}),
          header_bg_color: values.header_bg_color,
          header_text_color: values.header_text_color,
          bot_bg_color: values.bot_bg_color,
          bot_text_color: values.bot_text_color,
          user_bg_color: values.user_bg_color,
          user_text_color: values.user_text_color,
          bubble_bg_color: values.bubble_bg_color,
          bg_color: values.bg_color,
        },
      };
      await chatbotTrainingCenterService.updateChatbot(chatbot.id, payload);
      return payload;
    },
    onSuccess: (payload) => {
      toast.success('Display settings saved');
      onSaved(payload);
      reset(undefined, { keepValues: true });
    },
    onError: () => toast.error('Failed to save display settings'),
  });

  return (
    <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-8">
      {/* Text content */}
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Text content
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              { name: 'header_text', label: 'Header text', placeholder: 'e.g. How can I help you?' },
              { name: 'welcome_message', label: 'Welcome message', placeholder: 'e.g. Hello! How can I assist?' },
              { name: 'floating_message', label: 'Floating message', placeholder: 'e.g. Chat with us' },
              { name: 'placeholder_text', label: 'Input placeholder', placeholder: 'e.g. Type a message…' },
            ] as const
          ).map(({ name, label, placeholder }) => (
            <div key={name} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <Input
                {...register(name)}
                placeholder={placeholder}
                className="border-grey-100"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Colors */}
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colors</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  {...register(key as keyof FormValues)}
                  className="h-8 w-10 cursor-pointer rounded border border-grey-100 p-0.5"
                />
                <Input
                  {...register(key as keyof FormValues)}
                  className="h-8 border-grey-100 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end border-t border-grey-100 pt-4">
        <Button type="submit" disabled={saveMutation.isPending || !isDirty}>
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save display settings
        </Button>
      </div>
    </form>
  );
}
