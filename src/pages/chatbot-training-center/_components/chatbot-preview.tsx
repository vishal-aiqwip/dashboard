import { CONFIG } from '@/config';
import type { ChatbotDetail } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';

interface ChatbotPreviewProps {
  chatbot: ChatbotDetail;
  orgId: string;
}

export function ChatbotPreview({ chatbot, orgId }: ChatbotPreviewProps) {
  const previewBase = CONFIG.CHATBOT_PREVIEW_URL;

  const iframeSrc =
    previewBase && orgId && chatbot.id
      ? `${previewBase}?preview=true&cb-id=${encodeURIComponent(chatbot.id)}&org-id=${encodeURIComponent(orgId)}`
      : '';

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Live preview
      </p>

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

      <p className="text-xs font-medium text-grey-700">{chatbot.chatbot_name}</p>
    </div>
  );
}
