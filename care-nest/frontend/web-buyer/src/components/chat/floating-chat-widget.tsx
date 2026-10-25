'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ShoppingBag,
  ExternalLink,
  Plus,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Clock,
  Minimize2,
  Maximize2,
  Heart,
  Bot,
  UserCheck,
} from 'lucide-react';
import {
  chatService,
  connectChatSocket,
  getChatSocket,
  type ChatMessageItem,
  type ConversationItem,
  type OpenChatPayload,
} from '@/lib/services/chat.service';
import { cartService, emitCartUpdated } from '@/services/cart.service';
import { Link } from '@/i18n/routing';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [unreadTotal, setUnreadTotal] = useState(1);
  const [view, setView] = useState<'CHAT' | 'CONVERSATIONS'>('CHAT');
  const [cartSuccessNotice, setCartSuccessNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations on mount
  useEffect(() => {
    let isMounted = true;
    chatService.getConversations().then((list) => {
      if (!isMounted) return;
      setConversations(list);
      if (list.length > 0) {
        setActiveConversation(list[0]);
        const total = list.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadTotal(total || 1);
      }
    });

    // Listen for custom trigger from other components (Storefront, Product page)
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent<OpenChatPayload>;
      const detail = customEvent.detail;
      setIsOpen(true);
      setIsMinimized(false);
      setView('CHAT');

      if (detail.sellerId) {
        chatService
          .getOrCreateConversation({
            sellerId: detail.sellerId,
            title: detail.storeName,
            metadata: {
              productId: detail.productId,
              productName: detail.productName,
              productPrice: detail.productPrice,
              productImage: detail.productImage,
            },
            initialMessage: detail.initialMessage,
          })
          .then((conv) => {
            setActiveConversation(conv);
            chatService.getMessages(conv.id).then(setMessages);
          });
      }
    };

    window.addEventListener('carenest:open-chat', handleOpenChat);

    // Setup Socket connection
    const socket = connectChatSocket();

    socket.on('connect', () => {
      setIsOnline(true);
    });

    socket.on('disconnect', () => {
      setIsOnline(false);
    });

    socket.on('message_received', (msg: ChatMessageItem) => {
      setMessages((prev) => {
        // Prevent duplicate if already received
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(scrollToBottom, 100);
    });

    socket.on('user_typing', (data: { isTyping: boolean }) => {
      setOtherUserTyping(data.isTyping);
    });

    return () => {
      isMounted = false;
      window.removeEventListener('carenest:open-chat', handleOpenChat);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message_received');
      socket.off('user_typing');
    };
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    chatService.getMessages(activeConversation.id).then((msgs) => {
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    });

    // Join room
    const socket = getChatSocket();
    if (socket.connected) {
      socket.emit('join_conversation', { conversationId: activeConversation.id });
    }

    // Mark as read
    chatService.markAsRead(activeConversation.id);
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Emit typing event to socket
    const socket = getChatSocket();
    if (socket.connected && activeConversation) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing_start', { conversationId: activeConversation.id });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing_stop', { conversationId: activeConversation.id });
      }, 1500);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeConversation) return;

    setInputText('');
    const tempId = 'temp-' + Date.now();

    // Optimistic UI update
    const optimisticMessage: ChatMessageItem = {
      id: tempId,
      conversationId: activeConversation.id,
      senderId: 'current-user',
      type: 'TEXT',
      content: text,
      status: 'SENT',
      createdAt: new Date().toISOString(),
      sender: {
        id: 'current-user',
        fullName: 'Tôi',
        role: 'BUYER',
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 50);

    const socket = getChatSocket();
    if (socket.connected) {
      socket.emit('send_message', {
        conversationId: activeConversation.id,
        content: text,
        type: 'TEXT',
        clientTempId: tempId,
      });
    } else {
      // Fallback to REST
      await chatService.sendMessage(activeConversation.id, text, 'TEXT');
    }

    // Simulate smart bot response if conversation is with pharmacist / bot
    if (activeConversation.sellerId === 'seller-medtech-01' || activeConversation.id.includes('medtech')) {
      setTimeout(() => {
        setOtherUserTyping(true);
      }, 800);

      setTimeout(() => {
        setOtherUserTyping(false);
        const botReply: ChatMessageItem = {
          id: 'bot-reply-' + Date.now(),
          conversationId: activeConversation.id,
          senderId: 'seller-medtech-01',
          type: 'TEXT',
          content: generatePharmacistReply(text),
          status: 'SENT',
          createdAt: new Date().toISOString(),
          sender: {
            id: 'seller-medtech-01',
            fullName: 'Dược Sĩ Lê Thu Trang (MedTech)',
            role: 'SELLER',
          },
        };
        setMessages((prev) => [...prev, botReply]);
        setTimeout(scrollToBottom, 50);
      }, 2200);
    }
  };

  const generatePharmacistReply = (query: string): string => {
    const lower = query.toLowerCase();
    if (lower.includes('huyết áp') || lower.includes('omron') || lower.includes('đo')) {
      return 'Dạ đối với người cao tuổi, tiêu chuẩn vàng là đo huyết áp vào buổi sáng sau khi thức dậy 30-60 phút và nghỉ ngơi 5 phút trước khi bấm đo. Dòng Omron HEM-7156T có vòng bít thông minh 360 độ IntelliWrap giúp tránh sai lệch kết quả do quấn lệch vòng tay ạ!';
    }
    if (lower.includes('bảo hành') || lower.includes('đổi')) {
      return 'Dạ toàn bộ sản phẩm MedTech trên CareNest Mall được bảo hành 1 đổi 1 trong 24 tháng nếu có lỗi từ nhà sản xuất, đồng thời bảo dưỡng máy định kỳ miễn phí tại showroom Cầu Giấy, Hà Nội ạ.';
    }
    if (lower.includes('ship') || lower.includes('giao') || lower.includes('vận chuyển')) {
      return 'Dạ nội thành Hà Nội & TP.HCM shop giao hỏa tốc trong 2 giờ kèm kỹ thuật viên hướng dẫn đo tại chỗ. Các tỉnh thành khác CareNest vận chuyển đảm bảo trong 24-48 giờ ạ.';
    }
    if (lower.includes('giá') || lower.includes('voucher') || lower.includes('mã')) {
      return 'Dạ shop đang có sẵn voucher MEDTECH50K giảm 50.000đ và FREESHIPMAX miễn phí ship trên CareNest. Anh/chị có thể lưu mã trực tiếp trên banner gian hàng để áp dụng khi thanh toán ạ!';
    }
    return 'Dạ em đã ghi nhận câu hỏi của anh/chị. Dược sĩ đang kiểm tra thông số kỹ thuật y tế và sẽ hướng dẫn chi tiết ngay cho mình nhé!';
  };

  const handleQuickAddCart = (metadata: any) => {
    if (!metadata?.productId) return;
    cartService.addItem({
      productId: metadata.productId,
      sellerId: activeConversation?.sellerId || 'seller-medtech-01',
      name: metadata.productName || 'Sản phẩm y tế',
      unitPrice: metadata.price || 1450000,
      quantity: 1,
      imageUrl: metadata.image,
    });
    emitCartUpdated();
    setCartSuccessNotice(`Đã thêm "${metadata.productName}" vào giỏ hàng!`);
    setTimeout(() => setCartSuccessNotice(null), 3000);
  };

  const quickQuestions = [
    'Sản phẩm này còn hàng không shop?',
    'Chính sách bảo hành 24 tháng thế nào?',
    'Cách kết nối tự động với ứng dụng CareNest?',
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            setUnreadTotal(0);
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-full shadow-2xl shadow-emerald-900/30 transition-all duration-300 hover:scale-105 group border-2 border-white/20"
          aria-label="Mở cửa sổ chat tư vấn y tế"
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6 animate-pulse" />
            {unreadTotal > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow">
                {unreadTotal}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold tracking-wide">Chat Dược Sĩ & Shop</span>
        </button>
      )}

      {/* Pop-up Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[410px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized ? 'h-[64px]' : 'h-[620px]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-3.5 flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              {view === 'CHAT' && conversations.length > 1 && (
                <button
                  onClick={() => setView('CONVERSATIONS')}
                  className="p-1 hover:bg-white/10 rounded-full transition"
                  title="Danh sách hội thoại"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center font-bold text-white text-sm">
                  🏥
                </div>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-emerald-900 rounded-full" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-sm truncate leading-tight">
                    {activeConversation?.title || 'MedTech Healthcare'}
                  </h4>
                  <span className="bg-emerald-500/30 text-emerald-100 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-300/30 uppercase tracking-wider">
                    Mall
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/90 truncate flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-300" />
                  Dược sĩ tư vấn trực tuyến • Phản hồi &lt; 5p
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/15 rounded-lg transition"
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-lg transition"
                title="Đóng chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Toast Notification */}
              {cartSuccessNotice && (
                <div className="bg-emerald-600 text-white text-xs px-3 py-2 flex items-center justify-between animate-fadeIn shadow-sm">
                  <span>{cartSuccessNotice}</span>
                  <Link href="/shop/checkout" className="underline font-bold text-[11px]">
                    Xem giỏ
                  </Link>
                </div>
              )}

              {/* View 1: Conversation List */}
              {view === 'CONVERSATIONS' ? (
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-slate-50">
                  <div className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tin nhắn của bạn
                  </div>
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveConversation(c);
                        setView('CHAT');
                      }}
                      className="w-full text-left p-3.5 hover:bg-white flex items-center gap-3 transition bg-slate-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                        {c.title.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-slate-800 truncate">{c.title}</p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.lastMessageAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {c.lastMessage?.content || 'Chưa có tin nhắn'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* View 2: Active Chat Messages */
                <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                  {/* Pinned Assurance Banner */}
                  <div className="bg-amber-50/80 border-b border-amber-100 px-3 py-1.5 flex items-center gap-2 text-[11px] text-amber-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Gian hàng chính hãng CareNest Mall — Bảo mật hồ sơ bệnh án chuẩn PDPA.</span>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                    {messages.map((msg) => {
                      const isMe = msg.senderId === 'current-user' || msg.sender?.role === 'BUYER';

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${
                            isMe ? 'ml-auto' : 'mr-auto'
                          }`}
                        >
                          {/* Sender name for seller */}
                          {!isMe && (
                            <span className="text-[10px] font-semibold text-slate-500 mb-1 ml-1 flex items-center gap-1">
                              <span>{msg.sender?.fullName || 'Dược sĩ MedTech'}</span>
                            </span>
                          )}

                          {/* Message Content Bubble */}
                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-sm shadow-sm leading-relaxed ${
                              isMe
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs'
                                : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs'
                            }`}
                          >
                            {/* Rich Card: Product Snippet */}
                            {msg.type === 'PRODUCT_SNIPPET' && msg.metadata && (
                              <div className="mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-900">
                                <div className="flex items-center gap-2.5">
                                  {msg.metadata.image && (
                                    <img
                                      src={msg.metadata.image}
                                      alt={msg.metadata.productName}
                                      className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                                      {msg.metadata.productName}
                                    </p>
                                    <div className="flex items-baseline gap-1.5 mt-0.5">
                                      <span className="text-sm font-bold text-emerald-700">
                                        {formatVnd(msg.metadata.price || 0)}
                                      </span>
                                      {msg.metadata.originalPrice && (
                                        <span className="text-[10px] text-slate-400 line-through">
                                          {formatVnd(msg.metadata.originalPrice)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-2">
                                  <button
                                    onClick={() => handleQuickAddCart(msg.metadata)}
                                    className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
                                  >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span>Thêm Giỏ Hàng</span>
                                  </button>
                                  <Link
                                    href={`/shop/products/${msg.metadata.productId || 'omron-hem-7156t'}`}
                                    className="p-1 px-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1"
                                  >
                                    <span>Xem</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                </div>
                              </div>
                            )}

                            {/* Normal text content */}
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>

                          {/* Time & Read Status */}
                          <div
                            className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 ${
                              isMe ? 'mr-1' : 'ml-1'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && (
                              <span>
                                {msg.status === 'READ' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing Animation */}
                    {otherUserTyping && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-2xl w-fit shadow-xs">
                        <div className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span>Dược sĩ đang soạn phản hồi...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Suggestion Pills */}
                  <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {quickQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="shrink-0 text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Input Toolbar */}
                  <div className="p-3 bg-white border-t border-slate-200/80">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={inputText}
                        onChange={handleInputChange}
                        placeholder="Nhập câu hỏi tư vấn thiết bị y tế..."
                        className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition shadow-inner"
                      />

                      <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl transition shadow-md flex items-center justify-center shrink-0"
                        title="Gửi tin nhắn"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
