/**
 * Vietnamese notification templates. Each template takes a `vars` object
 * and returns `{ subject, body }` for the channel adapters.
 *
 * In Phase 2 we'll move these to the DB so non-engineers can edit them
 * (with a versioning system). For Phase 1, in-code is fine.
 */

export type TemplateKey =
  | 'order.created'
  | 'order.confirmed'
  | 'order.shipped'
  | 'order.delivered'
  | 'order.cancelled'
  | 'kyc.approved'
  | 'kyc.rejected'
  | 'alert.sos'
  | 'alert.fall'
  | 'alert.vitals'
  | 'alert.low_battery';

export interface RenderedTemplate {
  subject: string;
  body: string;
}

const TEMPLATES: Record<TemplateKey, (vars: Record<string, unknown>) => RenderedTemplate> = {
  'order.created': (v) => ({
    subject: `Đơn hàng #${v.orderNumber} đã được tạo`,
    body: `Cảm ơn bạn đã đặt hàng tại CareNest. Đơn hàng #${v.orderNumber} với tổng giá trị ${v.total}đ đang chờ xác nhận thanh toán.`,
  }),
  'order.confirmed': (v) => ({
    subject: `Đơn hàng #${v.orderNumber} đã được xác nhận`,
    body: `Đơn hàng #${v.orderNumber} đã được xác nhận và đang được người bán chuẩn bị.`,
  }),
  'order.shipped': (v) => ({
    subject: `Đơn hàng #${v.orderNumber} đang trên đường giao`,
    body: `Đơn hàng #${v.orderNumber} đã được giao cho đơn vị vận chuyển. Mã vận đơn: ${v.trackingCode || 'N/A'}.`,
  }),
  'order.delivered': (v) => ({
    subject: `Đơn hàng #${v.orderNumber} đã giao thành công`,
    body: `Đơn hàng #${v.orderNumber} đã được giao. Cảm ơn bạn đã mua sắm tại CareNest!`,
  }),
  'order.cancelled': (v) => ({
    subject: `Đơn hàng #${v.orderNumber} đã bị hủy`,
    body: `Đơn hàng #${v.orderNumber} đã bị hủy${v.reason ? `. Lý do: ${v.reason}` : '.'}.`,
  }),
  'kyc.approved': () => ({
    subject: 'Tài khoản bán hàng đã được phê duyệt',
    body: 'Chúc mừng! Tài khoản bán hàng của bạn đã được phê duyệt. Bạn có thể bắt đầu đăng sản phẩm ngay bây giờ.',
  }),
  'kyc.rejected': (v) => ({
    subject: 'Hồ sơ KYC bị từ chối',
    body: `Hồ sơ KYC của bạn bị từ chối${v.reason ? `. Lý do: ${v.reason}` : ''}. Vui lòng cập nhật và gửi lại.`,
  }),
  'alert.sos': (v) => ({
    subject: '🚨 CẢNH BÁO KHẨN CẤP',
    body: `${v.userName || 'Người thân'} vừa bấm nút SOS lúc ${v.occurredAt}. Vui lòng liên hệ ngay.`,
  }),
  'alert.fall': (v) => ({
    subject: '⚠️ Phát hiện té ngã',
    body: `Phát hiện té ngã lúc ${v.occurredAt}. Vui lòng kiểm tra.`,
  }),
  'alert.vitals': (v) => ({
    subject: '⚠️ Cảnh báo chỉ số sức khỏe',
    body: `Chỉ số bất thường: ${v.metric} = ${v.value} (lúc ${v.occurredAt}). Vui lòng kiểm tra.`,
  }),
  'alert.low_battery': (v) => ({
    subject: '🔋 Pin thiết bị yếu',
    body: `Pin thiết bị còn ${v.battery}%. Vui lòng sạc sớm.`,
  }),
};

export function renderTemplate(key: string, vars: Record<string, unknown>): RenderedTemplate | null {
  const fn = TEMPLATES[key as TemplateKey];
  if (!fn) return null;
  return fn(vars);
}

export const ALL_TEMPLATE_KEYS: TemplateKey[] = Object.keys(TEMPLATES) as TemplateKey[];
