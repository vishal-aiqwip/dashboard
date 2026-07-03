import { CONFIG } from '@/config';
import type { ChatbotDetail } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';

interface ChatbotPreviewProps {
  chatbot: ChatbotDetail;
  orgId: string;
  refreshKey?: number;
}

export function ChatbotPreview({ chatbot, orgId, refreshKey = 0 }: ChatbotPreviewProps) {
  const previewBase = CONFIG.CHATBOT_PREVIEW_URL;

  const iframeSrc =
    previewBase && orgId && chatbot.id
      ? `${previewBase}?preview=true&cb-id=${encodeURIComponent(chatbot.id)}&org-id=${encodeURIComponent(orgId)}${refreshKey ? `&t=${refreshKey}` : ''}`
      : '';

  return (
    <div className="flex w-full sticky top-0  flex-col items-center gap-3">
  
      <div
        className="w-full max-w-90 overflow-hidden rounded-2xl border border-grey-100 shadow-lg"
        style={{ height: 580 }}
      >
        {iframeSrc ? (
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            title="Chatbot Preview"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted/20">
            <p className="text-xs text-muted-foreground">Preview unavailable</p>
          </div>
        )}
      </div>

    </div>
  );
}
