import Link from 'next/link';
import {
  Heart,
  Activity,
  ShieldAlert,
  ArrowRight,
  Watch,
  Thermometer,
  Wind,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'radial-gradient(100% 100% at 50% 0%, #e6fffa 0%, #f8fafc 100%)',
        paddingTop: '64px',
        paddingBottom: '80px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center',
        }}>
          <div>
            <div className="badge badge-teal" style={{ marginBottom: '16px' }}>
              <span className="pulse-dot"></span>
              NỀN TẢNG Y TẾ SỐ & GIÁM SÁT IOT 2026
            </div>

            <h1 style={{
              fontSize: '44px',
              fontWeight: 800,
              lineHeight: 1.15,
              color: 'var(--text-main)',
              letterSpacing: '-1px',
              marginBottom: '20px',
            }}>
              Chăm Sóc Người Thân Tận Tâm, An Toàn Tuyệt Đối Với <span style={{ color: 'var(--primary)' }}>CareNest</span>
            </h1>

            <p style={{
              fontSize: '18px',
              color: 'var(--text-muted)',
              marginBottom: '32px',
              lineHeight: 1.6,
            }}>
              Hệ sinh thái kết hợp thiết bị y tế gia đình chính hãng và đồng hồ thông minh Wonlex V3.2:
              Tự động cảnh báo té ngã, đo huyết áp, nhịp tim và định vị GPS tức thì cho người cao tuổi.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/products" id="hero-cta-shop" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '16px' }}>
                Khám Phá Thiết Bị Y Tế
                <ArrowRight size={18} />
              </Link>
              <Link href="/dashboard" id="hero-cta-dashboard" className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: '16px' }}>
                <Activity size={18} />
                Xem Dashboard Sinh Tồn
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginTop: '36px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--primary)" /> Chuẩn y khoa
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--primary)" /> Cảnh báo SOS &lt; 2s
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--primary)" /> Định vị thời gian thực
              </div>
            </div>
          </div>

          {/* Interactive Card Live Simulation */}
          <div className="card" style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            border: '2px solid rgba(13, 148, 136, 0.2)',
            boxShadow: 'var(--shadow-xl)',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '8px',
                  borderRadius: '10px',
                }}>
                  <Watch size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>Đồng Hồ Wonlex KT24S</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã IMEI: 864502049182315</div>
                </div>
              </div>
              <span className="badge badge-green">
                <span className="pulse-dot"></span> ĐANG KẾT NỐI
              </span>
            </div>

            {/* Grid of live vitals */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div className="vitals-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '13px', fontWeight: 600 }}>
                  <Heart size={16} /> Nhịp Tim (BPM)
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
                  74 <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>bpm</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>● Ổn định</div>
              </div>

              <div className="vitals-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '13px', fontWeight: 600 }}>
                  <Activity size={16} /> Huyết Áp (BP)
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
                  118/76 <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>mmHg</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>● Bình thường</div>
              </div>

              <div className="vitals-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontSize: '13px', fontWeight: 600 }}>
                  <Wind size={16} /> Nồng độ Oxy (SpO2)
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
                  98 <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>%</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>● Tối ưu</div>
              </div>

              <div className="vitals-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontSize: '13px', fontWeight: 600 }}>
                  <Thermometer size={16} /> Thân Nhiệt
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
                  36.6 <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>°C</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>● Chuẩn</div>
              </div>
            </div>

            {/* Quick action button inside card */}
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)' }}>
                <ShieldAlert size={20} />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Hệ thống khẩn cấp SOS sẵn sàng</span>
              </div>
              <button id="card-test-sos-btn" className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>
                Kiểm tra loa SOS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories & Products Section */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
              Danh Mục Sản Phẩm Chăm Sóc Sức Khỏe
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
              Tất cả sản phẩm đều được kiểm định nguồn gốc y khoa, bảo hành chính hãng và hỗ trợ tích hợp dữ liệu theo dõi 24/7.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
          }}>
            {/* Item 1 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdfa 100%)',
                height: '180px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                marginBottom: '16px',
              }}>
                <Watch size={64} />
              </div>
              <span className="badge badge-teal" style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>
                IoT Độc Quyền
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Đồng Hồ Wonlex KT24S 4G
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px', flex: 1 }}>
                Đo huyết áp, nhịp tim, cảm biến gia tốc phát hiện ngã tự động và gọi SOS cho người thân.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                  1.850.000 đ
                </span>
                <Link href="/products" id="product-card-btn-1" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                  Chi tiết
                </Link>
              </div>
            </div>

            {/* Item 2 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                background: 'linear-gradient(135deg, #fee2e2 0%, #fff1f2 100%)',
                height: '180px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)',
                marginBottom: '16px',
              }}>
                <Activity size={64} />
              </div>
              <span className="badge badge-indigo" style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>
                Thiết Bị Y Tế
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Máy Đo Huyết Áp Bắp Tay Omron HEM-7156
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px', flex: 1 }}>
                Công nghệ IntelliSense chính xác cao, cảnh báo rung nhĩ và loạn nhịp tim sớm.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                  1.290.000 đ
                </span>
                <Link href="/products" id="product-card-btn-2" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                  Chi tiết
                </Link>
              </div>
            </div>

            {/* Item 3 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
                height: '180px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                marginBottom: '16px',
              }}>
                <Wind size={64} />
              </div>
              <span className="badge badge-teal" style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>
                Thiết Bị Y Tế
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Máy Đo Nồng Độ Oxy SpO2 Beurer PO30
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px', flex: 1 }}>
                Đo độ bão hòa oxy trong máu và nhịp tim qua đầu ngón tay không xâm lấn, tiêu chuẩn Đức.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                  750.000 đ
                </span>
                <Link href="/products" id="product-card-btn-3" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                  Chi tiết
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
