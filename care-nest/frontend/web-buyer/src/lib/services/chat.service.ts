/**
 * CareNest Real-time Chat Service (Frontend Client)
 * Connects to Chat Service via Socket.IO & REST API with resilient fallback.
 */
import { io, Socket } from 'socket.io-client';
import { getToken } from '@/lib/api-client';

const CHAT_WS_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL || 'http://localhost:3010';
const CHAT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
}

let socket: Socket | null = null;

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) throw new Error('Bạn cần đăng nhập để sử dụng chat');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

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

// Global Event for cross-component triggers (e.g. from Product Page or Storefront Page)
export interface OpenChatPayload {
  sellerId?: string;
  storeName?: string;
  storeSlug?: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
  initialMessage?: string;
}

export function emitOpenChat(payload: OpenChatPayload) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('carenest:open-chat', { detail: payload }));
  }
}

// REST Client methods
export const chatService = {
  async getConversations(): Promise<ConversationItem[]> {
    const res = await fetch(`${CHAT_API_URL}/api/v1/chat/conversations`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load conversations');
    return await res.json();
  },

  async getOrCreateConversation(dto: {
    sellerId?: string;
    title?: string;
    metadata?: Record<string, any>;
    initialMessage?: string;
  }): Promise<ConversationItem> {
    const res = await fetch(`${CHAT_API_URL}/api/v1/chat/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return await res.json();
  },

  async getMessages(conversationId: string, cursor?: string): Promise<ChatMessageItem[]> {
    const query = new URLSearchParams();
    if (cursor) query.set('cursor', cursor);
    const res = await fetch(`${CHAT_API_URL}/api/v1/chat/conversations/${conversationId}/messages?${query.toString()}`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    return await res.json();
  },

  async sendMessage(
    conversationId: string,
    content: string,
    type: string = 'TEXT',
    metadata?: any,
    clientTempId?: string,
  ): Promise<ChatMessageItem> {
    const res = await fetch(`${CHAT_API_URL}/api/v1/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, type, metadata, clientTempId }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return await res.json();
  },

  async markAsRead(conversationId: string): Promise<void> {
    const res = await fetch(`${CHAT_API_URL}/api/v1/chat/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error('Failed to mark conversation as read');
  },
};

