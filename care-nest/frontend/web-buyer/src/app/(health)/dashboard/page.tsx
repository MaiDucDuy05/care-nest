import {
  Heart,
  Activity,
  Wind,
  Thermometer,
  MapPin,
  ShieldAlert,
  Battery,
  Wifi,
  RefreshCw,
  Bell,
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="badge badge-teal" style={{ marginBottom: '8px' }}>
            <span className="pulse-dot"></span> THỜI GIAN THỰC (REAL-TIME TELEMETRY)
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-main)' }}>
            Trung Tâm Giám Sát Sức Khỏe Gia Đình
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            Đang theo dõi: <strong>Cụ Nguyễn Văn An (82 tuổi)</strong> — Thiết bị Wonlex KT24S
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button id="dashboard-refresh-btn" className="btn btn-secondary">
            <RefreshCw size={16} /> Làm mới
          </button>
          <button id="dashboard-sos-call-btn" className="btn btn-danger">
            <ShieldAlert size={16} /> Báo động khẩn cấp
          </button>
        </div>
      </div>

      {/* Device Status Bar */}
      <div className="card" style={{
        padding: '16px 24px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: '#ffffff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge badge-green">
            <Wifi size={14} /> 4G LTE Kết Nối Mạnh
          </span>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            IMEI: <strong>864502049182315</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Battery size={18} color="var(--success)" />
            <span>Pin: <strong>84%</strong> (Ước tính 36 giờ)</span>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Cập nhật lúc: <strong>Vừa xong (14:30)</strong>
          </div>
        </div>
      </div>

      {/* Main 4 Vitals Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        <div className="vitals-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <Heart size={20} /> Nhịp Tim
            </span>
            <span className="badge badge-green">Ổn định</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-main)', margin: '8px 0' }}>
            72 <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>nhịp/phút</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Dải an toàn: 60 - 90 bpm
          </div>
        </div>

        <div className="vitals-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <Activity size={20} /> Huyết Áp
            </span>
            <span className="badge badge-green">Bình thường</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-main)', margin: '8px 0' }}>
            118/78 <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>mmHg</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Chuẩn WHO: &lt; 120/80 mmHg
          </div>
        </div>

        <div className="vitals-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <Wind size={20} /> Khí Máu SpO2
            </span>
            <span className="badge badge-green">Tốt</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-main)', margin: '8px 0' }}>
            98 <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>%</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Bình thường: 95% - 100%
          </div>
        </div>

        <div className="vitals-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <Thermometer size={20} /> Thân Nhiệt
            </span>
            <span className="badge badge-green">Bình thường</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-main)', margin: '8px 0' }}>
            36.7 <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>°C</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Chuẩn cơ thể: 36.5 - 37.2 °C
          </div>
        </div>
      </div>

      {/* GPS Location & Emergency Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* GPS Map box */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px' }}>
              <MapPin size={20} color="var(--primary)" /> Vị Trí Hiện Tại (GPS Wonlex)
            </div>
            <span className="badge badge-teal">Vùng an toàn (Nhà)</span>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            height: '240px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            gap: '12px',
            border: '1px solid var(--border-color)',
          }}>
            <MapPin size={40} color="var(--danger)" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '15px' }}>
                Số 12A, Đường Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh
              </div>
              <div style={{ fontSize: '13px' }}>
                Tọa độ: 10.7769° N, 106.7009° E (Độ chính xác: 5 mét)
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts Feed */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px' }}>
              <Bell size={20} color="var(--primary)" /> Nhật Ký Cảnh Báo Gần Nhất
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Hôm nay</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: '#f8fafc',
              border: '1px solid var(--border-color)',
              display: 'flex',
              gap: '12px',
            }}>
              <div style={{ color: 'var(--success)', marginTop: '2px' }}>●</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Đo huyết áp định kỳ tự động</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>14:00 — Chỉ số 118/78 mmHg (Bình thường)</div>
              </div>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: '#f8fafc',
              border: '1px solid var(--border-color)',
              display: 'flex',
              gap: '12px',
            }}>
              <div style={{ color: 'var(--success)', marginTop: '2px' }}>●</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Cập nhật vị trí GPS thành công</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>13:30 — Nằm trong Geofence Nhà riêng</div>
              </div>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              display: 'flex',
              gap: '12px',
            }}>
              <div style={{ color: 'var(--danger)', marginTop: '2px' }}>●</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)' }}>Kiểm tra đường truyền khẩn cấp SOS</div>
                <div style={{ fontSize: '12px', color: 'var(--danger)' }}>Hôm qua 18:45 — Kết nối loa và sim 4G hoạt động tốt</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
