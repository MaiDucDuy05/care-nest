# `@carenest/chat-service` — Dịch Vụ Chat Realtime Nền Tảng CareNest

> **Port:** `3010` (HTTP & WebSocket)  
> **API Gateway Prefix:** `/api/v1/chat`  
> **WebSocket Path:** `/chat`  
> **Giao thức:** HTTP REST & WebSocket (Socket.IO v4)

---

## 📌 Giới Thiệu Dịch Vụ

`chat-service` là microservice chịu trách nhiệm quản lý toàn bộ các luồng giao tiếp thời gian thực trong hệ sinh thái CareNest:
1. **Tư vấn Người Mua & Gian Hàng (Buyer <-> Seller Chat)**: Kết nối khách hàng trực tiếp với nhà phân phối thiết bị y tế (như MedTech Vietnam, Wonlex Vietnam) để giải đáp thông số kỹ thuật, bảo hành, kiểm tra tồn kho.
2. **Tư Vấn Dược Sĩ & Chuyên Gia Y Tế (Telehealth Consultation)**: Tư vấn trực tuyến hướng dẫn người cao tuổi sử dụng máy đo huyết áp, giải thích chỉ số sinh tồn và cảnh báo khẩn cấp.
3. **Nhóm Chăm Sóc Gia Đình (Care Circle Group Chat)**: Luồng trao đổi giữa các người thân và điều dưỡng cùng chăm sóc người cao tuổi.

---

## 🛠️ Kiến Trúc Kỹ Thuật

- **WebSocket Engine**: `socket.io` v4 với xác thực JWT Handshake (`auth: { token }`) và fallback linh hoạt cho môi trường phát triển cục bộ.
- **Data Persistence**: PostgreSQL 16 qua Prisma Client (`Conversation`, `ConversationParticipant`, `ChatMessage`, `MessageAttachment`).
- **Resilience Fallback**: Tích hợp sẵn cơ chế dự phòng dữ liệu mẫu mô phỏng (Mock fallbacks) khi container database đang khởi động hoặc chưa có dữ liệu seed.

---

## 📡 Danh Sách Socket.IO Events

| Tên Event | Chiều | Payload | Mô Tả |
| :--- | :--- | :--- | :--- |
| `join_conversation` | Client ➔ Server | `{ conversationId }` | Tham gia vào phòng chat `conversation:{id}` |
| `leave_conversation` | Client ➔ Server | `{ conversationId }` | Rời khỏi phòng chat |
| `send_message` | Client ➔ Server | `{ conversationId, content, type, metadata, clientTempId }` | Gửi tin nhắn mới |
| `message_received` | Server ➔ Client | `ChatMessageItem` | Phát tin nhắn cho tất cả thành viên trong phòng |
| `message_ack` | Server ➔ Sender | `{ clientTempId, message }` | Xác nhận tin nhắn đã được lưu vào database |
| `typing_start` | Client ➔ Server | `{ conversationId }` | Bắt đầu gõ phím |
| `typing_stop` | Client ➔ Server | `{ conversationId }` | Dừng gõ phím |
| `user_typing` | Server ➔ Client | `{ conversationId, userId, isTyping }` | Báo cho đối phương trạng thái soạn tin |
| `mark_as_read` | Client ➔ Server | `{ conversationId, messageId? }` | Đánh dấu các tin nhắn đã đọc |
| `message_read_receipt` | Server ➔ Client | `{ conversationId, userId, readAt }` | Thông báo tin nhắn đã được xem |
| `user_presence` | Server ➔ Client | `{ userId, isOnline, timestamp }` | Cập nhật trạng thái trực tuyến / ngoại tuyến |

---

## 🔌 REST API Endpoints

- `GET /api/v1/chat/health`: Kiểm tra trạng thái hoạt động của service.
- `GET /api/v1/chat/conversations`: Lấy danh sách hội thoại của người dùng (kèm tin nhắn mới nhất và unread count).
- `POST /api/v1/chat/conversations`: Tìm hoặc tạo mới hội thoại với Seller / theo ngữ cảnh sản phẩm.
- `GET /api/v1/chat/conversations/:id/messages`: Lấy lịch sử tin nhắn với phân trang con trỏ `cursor` và `limit`.
- `POST /api/v1/chat/conversations/:id/messages`: Gửi tin nhắn qua giao thức HTTP REST.
- `POST /api/v1/chat/conversations/:id/read`: Đánh dấu hội thoại là đã đọc.

---

## 🚀 Khởi Chạy Cục Bộ

```bash
# Từ thư mục gốc care-nest
pnpm --filter @carenest/chat-service dev

# Hoặc kiểm tra kiểu dữ liệu
pnpm --filter @carenest/chat-service type-check

# Biên dịch sản xuất
pnpm --filter @carenest/chat-service build
```

