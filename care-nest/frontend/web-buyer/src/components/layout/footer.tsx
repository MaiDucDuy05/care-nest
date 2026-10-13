import Link from 'next/link';
import { HeartPulse, ShieldCheck, Headphones, Truck } from 'lucide-react';

export function Footer() {
  return (
    <footer style={{
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      marginTop: '80px',
      paddingTop: '60px',
      paddingBottom: '30px',
      borderTop: '1px solid #1e293b',
    }}>
      <div className="container">
        {/* Value props */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          paddingBottom: '48px',
          borderBottom: '1px solid #334155',
          marginBottom: '48px',
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', color: 'var(--primary)' }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>100% Chính Hãng Y Tế</div>
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>Đầy đủ chứng nhận kiểm định</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', color: 'var(--primary)' }}>
              <HeartPulse size={28} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Kết Nối IoT 24/7</div>
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>Đo huyết áp, tim mạch, SOS</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', color: 'var(--primary)' }}>
              <Truck size={28} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Giao Hỏa Tốc</div>
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>Giao nhanh trong 2h nội thành</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', color: 'var(--primary)' }}>
              <Headphones size={28} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Tư Vấn Y Tế 24/7</div>
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>Đội ngũ y bác sĩ hỗ trợ gia đình</div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          color: '#64748b',
          fontSize: '13px',
        }}>
          <div>© 2026 CareNest Platform. All rights reserved. Nền tảng TMĐT Y tế & Giám sát Sức khỏe IoT.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="#">Chính sách bảo mật</Link>
            <Link href="#">Điều khoản sử dụng</Link>
            <Link href="#">Tuân thủ PDPA</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
