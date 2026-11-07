/**
 * CareNest Real-time Chat Service (Seller Client)
 * Connects to Chat Service via Socket.IO & REST API with resilient fallback.
 */
import { io, Socket } from 'socket.io-client';
import { CHAT_API, getToken } from '../api-client';

const CHAT_WS_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL || 'http://localhost:3010';

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'TEXT' | 'IMAGE' | 'PRODUCT_SNIPPET' | 'ORDER_SNIPPET' | 'SYSTEM_ALERT';
  content: string;
  metadata?: Record<string, any>;
  status: 'SENT' | 'DELIVERED' | 'READ';
  createdAt: string;
  clientTempId?: string;
  sender?: {
    id: string;
    fullName: string;
    role: string;
  };
}

export interface ConversationItem {
  id: string;
  type: 'BUYER_SELLER' | 'CARE_CIRCLE' | 'PHARMACIST_CONSULT';
  title: string;
  sellerId?: string | null;
  seller?: {
    id: string;
    storeName: string;
    storeSlug: string;
    ratingAvg?: number;
  } | null;
  lastMessage?: {
    id: string;
    content: string;
    type: string;
    createdAt: string;
  } | null;
  lastMessageAt: string;
  unreadCount: number;
  metadata?: Record<string, any>;
  otherParticipant?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  totalOrders?: number;
  totalSpent?: number;
}

let socket: Socket | null = null;

export function getChatSocket(token?: string, userId?: string): Socket {
  if (!socket) {
    socket = io(CHAT_WS_URL, {
      path: '/chat',
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      auth: token ? { token } : undefined,
      query: userId ? { userId } : undefined,
    });
  }
  return socket;
}

export function connectChatSocket(token?: string, userId?: string): Socket {
  const s = getChatSocket(token, userId);
  if (!s.connected) {
    if (token) s.auth = { token };
    s.connect();
  }
  return s;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export const chatService = {
  async getConversations(): Promise<ConversationItem[]> {
    const token = getToken();
    try {
      const res = await fetch(`${CHAT_API}/api/v1/chat/conversations`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to load conversations');
      return await res.json();
    } catch {
      return [];
    }
  },

  async getMessages(conversationId: string, cursor?: string): Promise<ChatMessageItem[]> {
    const token = getToken();
    try {
      const query = new URLSearchParams();
      if (cursor) query.set('cursor', cursor);
      const res = await fetch(`${CHAT_API}/api/v1/chat/conversations/${conversationId}/messages?${query.toString()}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return await res.json();
    } catch {
      return [];
    }
  },

  async sendMessage(
    conversationId: string,
    content: string,
    type: string = 'TEXT',
    metadata?: any,
    clientTempId?: string,
  ): Promise<ChatMessageItem> {
    const token = getToken();
    const res = await fetch(`${CHAT_API}/api/v1/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content, type, metadata, clientTempId }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return await res.json();
  },

  async markAsRead(conversationId: string): Promise<void> {
    const token = getToken();
    try {
      await fetch(`${CHAT_API}/api/v1/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
    } catch {
      /* swallow */
    }
  },
};
