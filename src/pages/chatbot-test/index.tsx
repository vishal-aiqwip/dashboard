import { useEffect } from 'react';

export default function ChatbotTestPage() {
  useEffect(() => {
    (window as any).chatbotEmbed = {
      orgId: '8MX0C2cNR0C4nr6Opbwx',
      cbId: '10R6drKc0a2Nf5fFCax5',
      apiUrl: 'https://ai-assistant-backend-507344263091.europe-north1.run.app',
    };

    const script = document.createElement('script');
    script.src = 'https://altek-hospitality-chatbot-agent.web.app/chatbot-embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      delete (window as any).chatbotEmbed;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="text-2xl font-semibold">Chatbot Embed Test</h2>
        <p className="text-sm text-muted-foreground">
          Test page for the chatbot embed script. The chatbot widget should appear on this page.
        </p>
      </div>
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Org ID:</span> 8MX0C2cNR0C4nr6Opbwx
        </p>
        <p>
          <span className="font-medium text-foreground">Chatbot ID:</span> 10R6drKc0a2Nf5fFCax5
        </p>
        <p>
          <span className="font-medium text-foreground">API URL:</span>{' '}
          https://ai-assistant-backend-507344263091.europe-north1.run.app
        </p>
      </div>
    </div>
  );
}
