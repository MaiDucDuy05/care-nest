import Handlebars from 'handlebars';

/**
 * Vietnamese notification templates. We use Handlebars so templates can
 * include conditionals, loops, and i18n-style helpers in the future.
 *
 * Each template takes a `vars` object and returns `{ subject, body }` for
 * the channel adapters. Subject and body are separate templates because
 * the subject needs to be short and the body may include rich content.
 *
 * Helpers:
 *   {{formatVnd amount}} — 1.250.000 ₫
 *   {{upper str}}        — uppercase
 *
 * In Phase 3 we'll move these to the DB so non-engineers can edit them
 * (with a versioning system). For Phase 2, in-code is fine.
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
  | 'alert.low_battery'
  | 'subscription.renewed'
  | 'subscription.expiring';

export interface RenderedTemplate {
  subject: string;
  body: string;
}

interface TemplateDef {
  subject: string;
  body: string;
}

// Register custom helpers
Handlebars.registerHelper('formatVnd', function (amount: number | string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}${abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`;
});

Handlebars.registerHelper('upper', function (str: string) {
  return String(str ?? '').toUpperCase();
});

const TEMPLATES: Record<TemplateKey, TemplateDef> = {
  'order.created': {
    subject: 'Đơn hàng #{{orderNumber}} đã được tạo',
    body: 'Cảm on đã đặt hàng tại CareNest. Đơn hàng #{{orderNumber}} với tổng {{formatVnd total}} đang chờ xác nhận thanh toán.',
  },
  'order.confirmed': {
    subject: 'Đơn hàng #{{orderNumber}} đã được xác nhận',
    body: 'Đơn hàng #{{orderNumber}} đã được xác nhận và đang được người bán chuẩn bị.',
  },
  'order.shipped': {
    subject: 'Đơn hàng #{{orderNumber}} đang trên đường giao',
    body: 'Đơn hàng #{{orderNumber}} đã được giao cho đơn vị vận chuyển. Mã vận đơn: {{trackingCode}}.',
  },
  'order.delivered': {
    subject: 'Đơn hàng #{{orderNumber}} đã giao thành công',
    body: 'Đơn hàng #{{orderNumber}} đã được giao. Cảm ơn bạn đã mua sắm tại CareNest!',
  },
  'order.cancelled': {
    subject: 'Đơn hàng #{{orderNumber}} đã bị hủy',
    body: 'Đơn hàng #{{orderNumber}} đã bị hủy{{#if reason}}. Lý do: {{reason}}{{/if}}.',
  },
  'kyc.approved': {
    subject: 'Tài khoản bán hàng đã được phê duyệt',
    body: 'Chúc mừng! Tài khoản bán hàng của bạn đã được phê duyệt. Bạn có thể bắt đầu đăng sản phẩm ngay bây giờ.',
  },
  'kyc.rejected': {
    subject: 'Hồ sơ KYC bị từ chối',
    body: 'Hồ sơ KYC của bạn bị từ chối{{#if reason}}. Lý do: {{reason}}{{/if}}. Vui lòng cập nhật và gửi lại.',
  },
  'alert.sos': {
    subject: '🚨 CẢNH BÁO KHẨN CẤP',
    body: '{{userName}} vừa bấm nút SOS lúc {{occurredAt}}. Vui lòng liên hệ ngay.',
  },
  'alert.fall': {
    subject: '⚠️ Phát hiện té ngã',
    body: 'Phát hiện té ngã lúc {{occurredAt}}. Vui lòng kiểm tra.',
  },
  'alert.vitals': {
    subject: '⚠️ Cảnh báo chỉ số sức khỏe',
    body: 'Chỉ số bất thường: {{metric}} = {{value}} (lúc {{occurredAt}}). Vui lòng kiểm tra.',
  },
  'alert.low_battery': {
    subject: '🔋 Pin thiết bị yếu',
    body: 'Pin thiết bị còn {{battery}}%. Vui lòng sạc sớm.',
  },
  'subscription.renewed': {
    subject: 'Gói CareNest đã được gia hạn',
    body: 'Gói {{planName}} của bạn đã được gia hạn thành công với {{formatVnd amount}}. Hạn tiếp theo: {{nextPeriodEnd}}.',
  },
  'subscription.expiring': {
    subject: 'Gói CareNest sắp hết hạn',
    body: 'Gói {{planName}} của bạn sẽ hết hạn vào {{currentPeriodEnd}}. Vui lòng gia hạn để không gián đoạn dịch vụ.',
  },
};

// Compile once at module load — handlebars is pure and thread-safe
const COMPILED: Record<string, { subject: HandlebarsTemplateDelegate; body: HandlebarsTemplateDelegate }> =
  Object.fromEntries(
    Object.entries(TEMPLATES).map(([k, def]) => [
      k,
      { subject: Handlebars.compile(def.subject), body: Handlebars.compile(def.body) },
    ]),
  );

export function renderTemplate(key: string, vars: Record<string, unknown>): RenderedTemplate | null {
  const compiled = COMPILED[key];
  if (!compiled) return null;
  return {
    subject: compiled.subject(vars ?? {}),
    body: compiled.body(vars ?? {}),
  };
}

export const ALL_TEMPLATE_KEYS: TemplateKey[] = Object.keys(TEMPLATES) as TemplateKey[];
