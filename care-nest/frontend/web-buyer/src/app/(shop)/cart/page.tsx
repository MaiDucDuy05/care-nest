import Link from 'next/link';
import { ArrowLeft, Trash2, ShieldCheck, CreditCard } from 'lucide-react';

export default function CartPage() {
  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Tiếp tục mua sắm
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
          Giỏ Hàng Của Bạn (1 sản phẩm)
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
        {/* Cart items list */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                fontWeight: 800,
              }}>
                IoT
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Đồng Hồ Định Vị GPS Wonlex KT24S 4G</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Màu sắc: Đen y tế | Tặng kèm SIM 4G 1 năm</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>1.850.000 đ</div>
              </div>
            </div>

            <button id="cart-item-remove-1" style={{ color: 'var(--danger)', background: 'transparent' }}>
              <Trash2 size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', color: 'var(--success)', fontSize: '13px' }}>
            <ShieldCheck size={16} /> Đã bao gồm gói hỗ trợ cài đặt và kích hoạt thiết bị tận nhà
          </div>
        </div>

        {/* Order summary */}
        <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Tóm Tắt Đơn Hàng</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tạm tính:</span>
              <span>1.850.000 đ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Phí vận chuyển:</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Miễn phí</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color)',
              fontWeight: 800,
              fontSize: '18px',
            }}>
              <span>Tổng cộng:</span>
              <span style={{ color: 'var(--primary)' }}>1.850.000 đ</span>
            </div>
          </div>

          <button id="cart-checkout-btn" className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
            <CreditCard size={18} /> Tiến hành đặt hàng
          </button>
        </div>
      </div>
    </div>
  );
}
