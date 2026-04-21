import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatWebSocket, type WebSocketChatCallbacks } from '@/services/chat/websocket-chat';

interface UseWebSocketChatOptions {
  agentId: string | undefined;
  callbacks: WebSocketChatCallbacks;
  /** Connect immediately on mount (default: true) */
  autoConnect?: boolean;
}

export function useWebSocketChat({
  agentId,
  callbacks,
  autoConnect = true,
}: UseWebSocketChatOptions) {
  const wsRef = useRef<ChatWebSocket | null>(null);
  const callbacksRef = useRef(callbacks);
  const [isConnected, setIsConnected] = useState(false);

  // Keep callbacks ref current without re-triggering connect
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!agentId || !autoConnect) return;

    const ws = new ChatWebSocket();
    wsRef.current = ws;

    ws.connect(agentId, {
      onMessageStart: (data) => callbacksRef.current.onMessageStart?.(data),
      onThinking: (data) => callbacksRef.current.onThinking?.(data),
      onContext: (data) => callbacksRef.current.onContext?.(data),
      onContentDelta: (data) => callbacksRef.current.onContentDelta?.(data),
      onMessageEnd: (data) => callbacksRef.current.onMessageEnd?.(data),
      onError: (data) => callbacksRef.current.onError?.(data),
      onConnected: () => {
        setIsConnected(true);
        callbacksRef.current.onConnected?.();
      },
      onDisconnected: () => {
        setIsConnected(false);
        callbacksRef.current.onDisconnected?.();
      },
    });

    return () => {
      ws.disconnect();
      wsRef.current = null;
      setIsConnected(false);
    };
  }, [agentId, autoConnect]);

  const send = useCallback((message: string, conversationId: string | null) => {
    if (!wsRef.current?.isConnected) {
      callbacksRef.current.onError?.({ message: 'WebSocket not connected. Reconnecting...' });
      return;
    }
    wsRef.current.send(message, conversationId);
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    if (!agentId) return;
    wsRef.current?.disconnect();
    const ws = new ChatWebSocket();
    wsRef.current = ws;
    ws.connect(agentId, {
      onMessageStart: (data) => callbacksRef.current.onMessageStart?.(data),
      onThinking: (data) => callbacksRef.current.onThinking?.(data),
      onContext: (data) => callbacksRef.current.onContext?.(data),
      onContentDelta: (data) => callbacksRef.current.onContentDelta?.(data),
      onMessageEnd: (data) => callbacksRef.current.onMessageEnd?.(data),
      onError: (data) => callbacksRef.current.onError?.(data),
      onConnected: () => {
        setIsConnected(true);
        callbacksRef.current.onConnected?.();
      },
      onDisconnected: () => {
        setIsConnected(false);
        callbacksRef.current.onDisconnected?.();
      },
    });
  }, [agentId]);

  return { send, disconnect, reconnect, isConnected };
}
