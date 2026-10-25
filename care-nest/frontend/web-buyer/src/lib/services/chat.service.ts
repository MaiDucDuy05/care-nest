/**
 * CareNest Real-time Chat Service (Frontend Client)
 * Connects to Chat Service via Socket.IO & REST API with resilient fallback.
 */
import { io, Socket } from 'socket.io-client';

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
    try {
      const res = await fetch(`${CHAT_API_URL}/api/v1/chat/conversations`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load conversations');
      return await res.json();
    } catch {
      return getFallbackConversations();
    }
  },

  async getOrCreateConversation(dto: {
    sellerId?: string;
    title?: string;
    metadata?: Record<string, any>;
    initialMessage?: string;
  }): Promise<ConversationItem> {
    try {
      const res = await fetch(`${CHAT_API_URL}/api/v1/chat/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error('Failed to create conversation');
      return await res.json();
    } catch {
      return {
        id: 'mock-conv-' + (dto.sellerId || 'support'),
        type: 'BUYER_SELLER',
        title: dto.title || 'MedTech Healthcare Vietnam (CareNest Mall)',
        sellerId: dto.sellerId || 'seller-medtech-01',
        seller: {
          id: dto.sellerId || 'seller-medtech-01',
          storeName: dto.title || 'MedTech Healthcare Vietnam',
          storeSlug: 'medtech-vietnam',
          ratingAvg: 4.9,
        },
        lastMessage: {
          id: 'mock-msg-init',
          content: dto.initialMessage || 'Xin chào! Dược sĩ sẵn sàng tư vấn cho bạn.',
          type: 'TEXT',
          createdAt: new Date().toISOString(),
        },
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        metadata: dto.metadata,
      };
    }
  },

  async getMessages(conversationId: string, cursor?: string): Promise<ChatMessageItem[]> {
    try {
      const query = new URLSearchParams();
      if (cursor) query.set('cursor', cursor);
      const res = await fetch(`${CHAT_API_URL}/api/v1/chat/conversations/${conversationId}/messages?${query.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return await res.json();
    } catch {
      return getFallbackMessages(conversationId);
    }
  },

  async sendMessage(conversationId: string, content: string, type: string = 'TEXT', metadata?: any): Promise<ChatMessageItem> {
    try {
      const res = await fetch(`${CHAT_API_URL}/api/v1/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type, metadata }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return await res.json();
    } catch {
      return {
        id: 'msg-' + Date.now(),
        conversationId,
        senderId: 'current-user',
        type: type as any,
        content,
        metadata,
        status: 'SENT',
        createdAt: new Date().toISOString(),
        sender: {
          id: 'current-user',
          fullName: 'Tôi',
          role: 'BUYER',
        },
      };
    }
  },

  async markAsRead(conversationId: string): Promise<void> {
    try {
      await fetch(`${CHAT_API_URL}/api/v1/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch {
      /* swallow */
    }
  },
};

// Fallback datasets for smooth UX
function getFallbackConversations(): ConversationItem[] {
  return [
    {
      id: 'mock-conv-medtech',
      type: 'BUYER_SELLER',
      title: 'MedTech Healthcare Vietnam (Mall)',
      sellerId: 'seller-medtech-01',
      seller: {
        id: 'seller-medtech-01',
        storeName: 'MedTech Healthcare Vietnam',
        storeSlug: 'medtech-vietnam',
        ratingAvg: 4.9,
      },
      lastMessage: {
        id: 'fallback-01',
        content: 'Dạ hoàn toàn được ạ! Dòng HEM-7156T trang bị Bluetooth kết nối trực tiếp với CareNest...',
        type: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      },
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      unreadCount: 1,
    },
    {
      id: 'mock-conv-wonlex',
      type: 'BUYER_SELLER',
      title: 'Wonlex Smartcare Official Store',
      sellerId: 'seller-wonlex-02',
      seller: {
        id: 'seller-wonlex-02',
        storeName: 'Wonlex Smartcare Official Store',
        storeSlug: 'wonlex-vietnam',
        ratingAvg: 4.8,
      },
      lastMessage: {
        id: 'fallback-02',
        content: 'Đồng hồ định vị KT17 đã được cài sẵn gói SIM 4G Viettel 12 tháng.',
        type: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      unreadCount: 0,
    },
  ];
}

function getFallbackMessages(conversationId: string): ChatMessageItem[] {
  return [
    {
      id: 'mock-msg-01',
      conversationId,
      senderId: 'seller-medtech-01',
      type: 'TEXT',
      content: 'Dạ xin chào anh/chị! Em là Dược sĩ Lê Thu Trang từ MedTech Healthcare Vietnam. Shop có thể tư vấn dòng thiết bị y tế hay hướng dẫn kết nối ứng dụng CareNest cho gia đình mình ạ?',
      status: 'READ',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      sender: {
        id: 'seller-medtech-01',
        fullName: 'Dược Sĩ Lê Thu Trang (MedTech)',
        role: 'SELLER',
      },
    },
    {
      id: 'mock-msg-02',
      conversationId,
      senderId: 'current-user',
      type: 'TEXT',
      content: 'Shop cho mình hỏi máy đo huyết áp Omron HEM-7156T có tự động gửi cảnh báo khi phát hiện huyết áp cao bất thường không?',
      status: 'READ',
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      sender: {
        id: 'current-user',
        fullName: 'Tôi',
        role: 'BUYER',
      },
    },
    {
      id: 'mock-msg-03',
      conversationId,
      senderId: 'seller-medtech-01',
      type: 'PRODUCT_SNIPPET',
      content: 'Máy Đo Huyết Áp Bắp Tay Omron HEM-7156T (Bluetooth kết nối CareNest)',
      metadata: {
        productId: 'omron-hem-7156t',
        productName: 'Máy Đo Huyết Áp Bắp Tay Omron HEM-7156T',
        price: 1450000,
        originalPrice: 1750000,
        rating: 4.9,
        warranty: 'Bảo hành chính hãng 5 năm',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
      },
      status: 'READ',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      sender: {
        id: 'seller-medtech-01',
        fullName: 'Dược Sĩ Lê Thu Trang (MedTech)',
        role: 'SELLER',
      },
    },
    {
      id: 'mock-msg-04',
      conversationId,
      senderId: 'seller-medtech-01',
      type: 'TEXT',
      content: 'Dạ có ạ! Khi đo, nếu huyết áp tâm thu vượt 135 mmHg hoặc phát hiện nhịp tim không đều, máy sẽ phát tín hiệu Bluetooth sang ứng dụng CareNest và đẩy ngay thông báo khẩn cấp đến điện thoại của toàn bộ con cháu trong gia đình ạ.',
      status: 'SENT',
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      sender: {
        id: 'seller-medtech-01',
        fullName: 'Dược Sĩ Lê Thu Trang (MedTech)',
        role: 'SELLER',
      },
    },
  ];
}

