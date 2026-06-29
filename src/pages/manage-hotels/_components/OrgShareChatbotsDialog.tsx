import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { chatbotsService } from '@/services/chatbots/chatbots';
import type { Chatbot } from '@/services/chatbots/chatbots';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName?: string;
}

export function OrgShareChatbotsDialog({ open, onOpenChange, organizationId, organizationName }: Props) {
  const [selectedChatbotId, setSelectedChatbotId] = useState('');
  const [shareMethod, setShareMethod] = useState<'link' | 'script' | ''>('');

  const { data: chatbots = [], isLoading, isError } = useQuery<Chatbot[]>({
    queryKey: ['chatbots', organizationId],
    queryFn: () => chatbotsService.listByOrg(organizationId),
    enabled: open && !!organizationId,
    staleTime: 0,
  });

  useEffect(() => {
    if (open && chatbots.length > 0 && !selectedChatbotId) {
      setSelectedChatbotId(chatbots[0].id);
    }
  }, [open, chatbots, selectedChatbotId]);

  const shareContent = useMemo(() => {
    const baseUrl = import.meta.env.VITE_CHATBOT_PREVIEW_URL as string | undefined;
    const apiUrl = import.meta.env.VITE_AI_CHATBOT_API_URL as string | undefined;
    if (!baseUrl || !selectedChatbotId || !shareMethod) return null;
    const selected = chatbots.find((c) => c.id === selectedChatbotId);
    if (!selected) return null;

    if (shareMethod === 'link') {
      return `${baseUrl}?org-id=${organizationId}&cb-id=${selectedChatbotId}`;
    }
    const embedSrc = new URL('chatbot-embed.js', baseUrl).toString();
    return `<script>\n  window.chatbotEmbed = {\n    orgId: '${organizationId}',\n    cbId: '${selectedChatbotId}',\n    apiUrl: '${apiUrl ?? ''}'\n  };\n</script>\n<script src="${embedSrc}" async></script>`;
  }, [chatbots, selectedChatbotId, shareMethod, organizationId]);

  const handleClose = (o: boolean) => {
    if (!o) { setSelectedChatbotId(''); setShareMethod(''); }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share chatbots{organizationName ? ` — ${organizationName}` : ''}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Select chatbot</label>
              <Select value={selectedChatbotId} onValueChange={setSelectedChatbotId}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue
                    placeholder={isLoading ? 'Loading chatbots…' : isError ? 'Failed to load chatbots' : 'Select a chatbot'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {chatbots.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.chatbot_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Share method</label>
              <Select value={shareMethod} onValueChange={(v) => setShareMethod(v as 'link' | 'script')}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Select method…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Direct Link</SelectItem>
                  <SelectItem value="script">Chatbot Bubble</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {shareContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {shareMethod === 'link' ? 'Direct link' : 'Embed snippet'}
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(shareContent);
                    toast.success(shareMethod === 'link' ? 'Link copied' : 'Snippet copied');
                  }}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
              {shareMethod === 'link' ? (
                <Input readOnly value={shareContent} className="font-mono text-xs" />
              ) : (
                <div className="rounded-md border bg-muted/40 max-h-48 overflow-auto ">
                  <pre className="p-3 text-xs max-w-125">{shareContent}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
