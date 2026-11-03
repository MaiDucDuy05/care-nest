'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  MessageSquare,
  ShieldCheck,
  Check,
  CheckCheck,
  Sparkles,
  ShoppingBag,
  Package,
  Clock,
  User,
  Phone,
  MapPin,
  ExternalLink,
  Tag,
  FileText,
  AlertCircle,
  HelpCircle,
  Heart,
  Activity,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { chatService, connectChatSocket, disconnectChatSocket } from '@/lib/services/chat.service';
import { getToken } from '@/lib/api-client';

interface SellerConversation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  customerTier: 'VIP' | 'REGULAR' | 'NEW';
  totalSpent: number;
  totalOrders: number;
  avatarBg: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  relatedProduct?: {
    id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
  };
  recentOrder?: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
  };
}

interface SellerChatMessage {
  id: string;
  sender: 'customer' | 'seller' | 'system';
  content: string;
  time: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  type?: 'TEXT' | 'PRODUCT_CARD' | 'ORDER_CARD' | 'SYSTEM_EVENT';
  metadata?: any;
}

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

export default function SellerChatPage() {
  const [conversations, setConversations] = useState<SellerConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'VIP'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [sellerNotes, setSellerNotes] = useState('');
  const [isNotesSaved, setIsNotesSaved] = useState(false);
  const [messages, setMessages] = useState<SellerChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isCustomerTyping]);

  // Connect to real Chat WebSocket and fetch real conversations
  useEffect(() => {
    let mounted = true;
    const token = getToken();
    const socket = connectChatSocket(token || undefined);

    const onMessage = (msg: any) => {
      if (!mounted) return;
      const formatted: SellerChatMessage = {
        id: msg.id || 'm-' + Date.now(),
        sender: msg.sender?.role === 'SELLER' ? 'seller' : 'customer',
        content: msg.content,
        time: new Date(msg.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        status: msg.status || 'DELIVERED',
        type: msg.type || 'TEXT',
        metadata: msg.metadata,
      };
      setMessages((prev) => [...prev, formatted]);
    };

    socket.on('chat:message', onMessage);

    (async () => {
      try {
        const serverConvs = await chatService.getConversations();
        if (mounted && serverConvs) {
          const mapped: SellerConversation[] = serverConvs.map((sc) => ({
            id: sc.id,
            customerName: sc.otherParticipant?.fullName || sc.title || 'Khách hàng CareNest',
            customerPhone: sc.otherParticipant?.email || 'CareNest User',
            customerLocation: 'Việt Nam',
            customerTier: 'REGULAR',
            totalSpent: 0,
            totalOrders: 0,
            avatarBg: '#0d9488',
            lastMessage: sc.lastMessage?.content || 'Chưa có tin nhắn',
            lastMessageTime: sc.lastMessageAt ? new Date(sc.lastMessageAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
            unreadCount: sc.unreadCount || 0,
            isOnline: true,
          }));
          setConversations(mapped);
          if (mapped.length > 0) {
            setActiveConvId(mapped[0].id);
          }
        }
      } catch {
        // Failed to load conversations
      }
    })();

    return () => {
      mounted = false;
      socket.off('chat:message', onMessage);
      disconnectChatSocket();
    };
  }, []);

  // Fetch real messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const msgs = await chatService.getMessages(activeConvId);
        if (mounted) {
          const mapped: SellerChatMessage[] = (msgs || []).map((m) => ({
            id: m.id,
            sender: m.sender?.role === 'SELLER' ? 'seller' : 'customer',
            content: m.content,
            time: new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            status: m.status || 'READ',
            type: m.type as any,
            metadata: m.metadata,
          }));
          setMessages(mapped);
        }
      } catch {
        // silent
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activeConvId]);

  const filteredConversations = conversations.filter((c) => {
    if (filterTab === 'UNREAD' && c.unreadCount === 0) return false;
    if (filterTab === 'VIP' && c.customerTier !== 'VIP') return false;
    if (
      searchQuery &&
      !c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.customerPhone.includes(searchQuery)
    ) {
      return false;
    }
    return true;
  });

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setInputText('');

    const newMsg: SellerChatMessage = {
      id: 'm-' + Date.now(),
      sender: 'seller',
      content: text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'SENT',
      type: 'TEXT',
    };

    setMessages((prev) => [...prev, newMsg]);

    // Mark active conversation unread as 0
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvId ? { ...c, unreadCount: 0, lastMessage: text } : c))
    );

    // Call real chat service API
    try {
      await chatService.sendMessage(activeConvId, text, 'TEXT');
    } catch (err) {
      console.warn('Real chat send failed:', err);
    }
  };

  const handleSendVoucher = () => {
    handleSendMessage('Dạ shop xin gửi tặng anh/chị mã voucher độc quyền "MEDTECH50K" giảm ngay 50.000đ khi thanh toán đơn hàng này trên CareNest Mall ạ!');
  };

  const handleSendProductCard = async () => {
    if (!activeConv?.relatedProduct) return;
    const content = `Dạ đây là thông tin chi tiết thiết bị ${activeConv.relatedProduct.name}:`;
    const productMsg: SellerChatMessage = {
      id: 'm-prod-' + Date.now(),
      sender: 'seller',
      content,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'SENT',
      type: 'PRODUCT_CARD',
      metadata: activeConv.relatedProduct,
    };
    setMessages((prev) => [...prev, productMsg]);
    try {
      await chatService.sendMessage(activeConvId, content, 'PRODUCT_CARD', activeConv.relatedProduct);
    } catch (err) {
      console.warn('Real product card send failed:', err);
    }
  };

  const handleSaveNotes = () => {
    setIsNotesSaved(true);
    setTimeout(() => setIsNotesSaved(false), 2500);
  };

  const quickMacros = [
    'Dạ shop chào anh/chị! Thiết bị y tế MedTech 100% chính hãng, có hóa đơn VAT và bảo hành 24 tháng ạ.',
    'Dạ đối với người cao tuổi, máy này chỉ cần bấm 1 nút là tự đo và lưu dữ liệu lên ứng dụng CareNest ngay ạ.',
    'Dạ nội thành Hà Nội & TP.HCM shop giao hỏa tốc trong 2 giờ kèm kỹ thuật viên hướng dẫn tận nơi ạ.',
    'Dạ hàng có sẵn tại kho Cầu Giấy, shop đã đóng gói cẩn thận có tem niêm phong chống sốc gửi anh/chị ạ.',
  ];

  return (
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', background: 'var(--bg-main, #f8fafc)' }}>
      {/* Page Title & Subtitle */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--primary-light, #f0fdfa)', color: 'var(--primary, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main, #0f172a)' }}>
              Trung Tâm Tin Nhắn & Tư Vấn Y Tế (Live Chat)
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
              Kênh kết nối thời gian thực với khách mua hàng CareNest Mall • Đạt chuẩn thời gian phản hồi &lt; 5 phút
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0d9488', fontWeight: 700, background: '#f0fdfa', padding: '6px 14px', borderRadius: '20px', border: '1px solid #99f6e4' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span>Kênh Chat Realtime: Đang Hoạt Động</span>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr 340px', overflow: 'hidden' }}>
        {/* COLUMN 1: CONVERSATIONS LIST */}
        <div
          style={{
            borderRight: '1px solid var(--border-color, #e2e8f0)',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search Bar */}
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Tìm khách hàng, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  background: '#f8fafc',
                }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              {(['ALL', 'UNREAD', 'VIP'] as const).map((tab) => {
                const labels = { ALL: 'Tất cả', UNREAD: 'Chưa đọc', VIP: 'Khách VIP' };
                const active = filterTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: active ? 'var(--primary, #0d9488)' : '#e2e8f0',
                      background: active ? 'var(--primary, #0d9488)' : '#f8fafc',
                      color: active ? '#ffffff' : '#64748b',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Chưa có cuộc hội thoại nào
              </div>
            ) : (
              filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setConversations((prev) =>
                      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                    );
                  }}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--primary-light, #f0fdfa)' : '#ffffff',
                    borderLeft: isSelected ? '4px solid var(--primary, #0d9488)' : '4px solid transparent',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    gap: '12px',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: conv.avatarBg,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '15px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                      }}
                    >
                      {conv.customerName.charAt(conv.customerName.lastIndexOf(' ') + 1) || 'K'}
                    </div>
                    {conv.isOnline && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: '#10b981',
                          border: '2px solid #fff',
                        }}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {conv.customerName}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{conv.lastMessageTime}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <p
                        style={{
                          fontSize: '12px',
                          color: conv.unreadCount > 0 ? '#0f172a' : '#64748b',
                          fontWeight: conv.unreadCount > 0 ? 700 : 400,
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span
                          style={{
                            background: '#ef4444',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 800,
                            borderRadius: '10px',
                            padding: '2px 7px',
                            lineHeight: 1,
                          }}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {!activeConv ? (
          <div
            style={{
              gridColumn: '2 / -1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              background: '#f8fafc',
              color: '#64748b',
            }}
          >
            <MessageSquare size={48} style={{ opacity: 0.25, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Chưa chọn cuộc hội thoại
            </h3>
            <p style={{ fontSize: '13px', maxWidth: '380px', textAlign: 'center', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
              Chọn một khách hàng từ danh sách bên trái hoặc đợi khách hàng gửi tin nhắn tư vấn từ CareNest Mall.
            </p>
          </div>
        ) : (
          <>
            {/* COLUMN 2: MAIN CHAT CANVAS */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
          {/* Chat Canvas Header */}
          <div
            style={{
              padding: '12px 20px',
              background: '#ffffff',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: activeConv.avatarBg,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                }}
              >
                {activeConv.customerName.charAt(activeConv.customerName.lastIndexOf(' ') + 1)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    {activeConv.customerName}
                  </h3>
                  {activeConv.customerTier === 'VIP' && (
                    <span
                      style={{
                        background: '#fef3c7',
                        color: '#b45309',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #fde68a',
                      }}
                    >
                      ⭐ KHÁCH VIP
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} /> {activeConv.customerPhone}
                  </span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {activeConv.customerLocation}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Tools */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSendVoucher}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Gửi mã voucher giảm giá 50k vào chat"
              >
                <Tag size={14} />
                <span>Gửi Voucher 50k</span>
              </button>

              {activeConv.relatedProduct && (
                <button
                  type="button"
                  onClick={handleSendProductCard}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    background: '#f0fdfa',
                    border: '1px solid #99f6e4',
                    color: '#0d9488',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="Gửi thẻ sản phẩm kèm nút mua"
                >
                  <ShoppingBag size={14} />
                  <span>Gửi Thẻ Sản Phẩm</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages Stream */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map((msg) => {
              if (msg.type === 'SYSTEM_EVENT') {
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: 'center',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1e40af',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Activity size={13} />
                    <span>{msg.content}</span>
                  </div>
                );
              }

              const isSeller = msg.sender === 'seller';

              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isSeller ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isSeller ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '16px',
                      borderBottomRightRadius: isSeller ? '4px' : '16px',
                      borderBottomLeftRadius: !isSeller ? '4px' : '16px',
                      background: isSeller ? 'linear-gradient(135deg, #0d9488, #0f766e)' : '#ffffff',
                      color: isSeller ? '#ffffff' : '#0f172a',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      border: isSeller ? 'none' : '1px solid #e2e8f0',
                    }}
                  >
                    {/* Rich Product Snippet */}
                    {msg.type === 'PRODUCT_CARD' && msg.metadata && (
                      <div
                        style={{
                          marginBottom: '10px',
                          padding: '10px',
                          background: isSeller ? 'rgba(255,255,255,0.12)' : '#f8fafc',
                          borderRadius: '12px',
                          border: isSeller ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <img
                            src={msg.metadata.image}
                            alt={msg.metadata.name}
                            style={{ width: 48, height: 48, borderRadius: '8px', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '12px', lineHeight: 1.3 }}>
                              {msg.metadata.name}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '13px', color: isSeller ? '#fde047' : '#0d9488', marginTop: '2px' }}>
                              {formatVnd(msg.metadata.price)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      color: '#94a3b8',
                      marginTop: '4px',
                      padding: '0 4px',
                    }}
                  >
                    <span>{msg.time}</span>
                    {isSeller && (
                      <span>
                        {msg.status === 'READ' ? (
                          <CheckCheck size={13} style={{ color: '#0d9488' }} />
                        ) : (
                          <Check size={13} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Customer Typing indicator */}
            {isCustomerTyping && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '8px 14px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Khách hàng đang soạn tin nhắn...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Macro Suggestions Pills */}
          <div
            style={{
              padding: '8px 16px',
              background: '#ffffff',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
            }}
          >
            {quickMacros.map((macro, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(macro)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '16px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#334155',
                  fontSize: '11px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0fdfa';
                  e.currentTarget.style.color = '#0d9488';
                  e.currentTarget.style.borderColor = '#99f6e4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#334155';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {macro.length > 40 ? macro.slice(0, 40) + '...' : macro}
              </button>
            ))}
          </div>

          {/* Input Toolbar */}
          <div style={{ padding: '12px 16px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                type="text"
                placeholder="Nhập tin nhắn tư vấn y tế cho khách hàng... (Nhấn Enter để gửi)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                style={{
                  padding: '0 20px',
                  borderRadius: '12px',
                  background: inputText.trim() ? 'var(--primary, #0d9488)' : '#cbd5e1',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Send size={15} />
                <span>Gửi</span>
              </button>
            </form>
          </div>
        </div>

        {/* COLUMN 3: CUSTOMER CONTEXT SIDEBAR */}
        <div
          style={{
            borderLeft: '1px solid var(--border-color, #e2e8f0)',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '20px',
            gap: '20px',
          }}
        >
          {/* Customer Profile Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: activeConv.avatarBg,
                color: '#fff',
                fontSize: '22px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
              }}
            >
              {activeConv.customerName.charAt(activeConv.customerName.lastIndexOf(' ') + 1)}
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
              {activeConv.customerName}
            </h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>
              {activeConv.customerPhone}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Tổng đơn mua</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  {activeConv.totalOrders} đơn
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Tổng chi tiêu</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary, #0d9488)' }}>
                  {formatVnd(activeConv.totalSpent)}
                </div>
              </div>
            </div>
          </div>

          {/* Current / Recent Order */}
          {activeConv.recentOrder && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                Đơn Hàng Gần Nhất
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#f0fdfa',
                  border: '1px solid #99f6e4',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f766e' }}>
                    #{activeConv.recentOrder.id}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {activeConv.recentOrder.createdAt}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                  {formatVnd(activeConv.recentOrder.total)}
                </div>
                <div style={{ fontSize: '11px', color: '#0d9488', fontWeight: 600 }}>
                  ● {activeConv.recentOrder.status}
                </div>
              </div>
            </div>
          )}

          {/* Product Currently Inquiring */}
          {activeConv.relatedProduct && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                Sản Phẩm Đang Hỏi
              </div>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                }}
              >
                <img
                  src={activeConv.relatedProduct.image}
                  alt={activeConv.relatedProduct.name}
                  style={{ width: 50, height: 50, borderRadius: '8px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3, marginBottom: '2px' }}>
                    {activeConv.relatedProduct.name}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary, #0d9488)' }}>
                    {formatVnd(activeConv.relatedProduct.price)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                    Kho còn: {activeConv.relatedProduct.stock} chiếc
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Internal Notes For Customer */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Ghi Chú Nội Bộ
              </span>
              {isNotesSaved && (
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                  ✓ Đã lưu
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={sellerNotes}
              onChange={(e) => setSellerNotes(e.target.value)}
              placeholder="Ghi chú về thói quen, lưu ý sức khỏe của khách hàng..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                lineHeight: 1.4,
                outline: 'none',
                resize: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              style={{
                marginTop: '6px',
                width: '100%',
                padding: '6px',
                borderRadius: '8px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                fontSize: '11px',
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Lưu Ghi Chú
            </button>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

