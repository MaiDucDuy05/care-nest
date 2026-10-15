
import { Search, Watch, Activity, Wind, ShoppingCart } from 'lucide-react';

export default function ProductsPage() {
  const products = [
    {
      id: 'prod-wonlex-kt24s',
      name: 'Đồng Hồ Định Vị GPS Wonlex KT24S 4G Cảnh Báo Té Ngã',
      category: 'Đồng Hồ IoT',
      price: '1.850.000 đ',
      icon: <Watch size={48} />,
      badge: 'Bán Chạy Nhất',
      badgeColor: 'badge-teal',
    },
    {
      id: 'prod-omron-7156',
      name: 'Máy Đo Huyết Áp Bắp Tay Omron HEM-7156 (Chính Hãng Nhật Bản)',
      category: 'Thiết Bị Y Tế Gia Đình',
      price: '1.290.000 đ',
      icon: <Activity size={48} />,
      badge: 'Y Khoa',
      badgeColor: 'badge-indigo',
    },
    {
      id: 'prod-beurer-po30',
      name: 'Máy Đo Nồng Độ Oxy Trong Máu SpO2 Beurer PO30 Chuẩn Đức',
      category: 'Thiết Bị Y Tế Gia Đình',
      price: '750.000 đ',
      icon: <Wind size={48} />,
      badge: 'Chính Hãng',
      badgeColor: 'badge-green',
    },
    {
      id: 'prod-wonlex-gw400x',
      name: 'Đồng Hồ Wonlex GW400X Chống Nước IP67 Pin 72h',
      category: 'Đồng Hồ IoT',
      price: '1.490.000 đ',
      icon: <Watch size={48} />,
      badge: 'Khuyên Dùng',
      badgeColor: 'badge-teal',
    },
  ];

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
          Thiết Bị Y Tế & Chăm Sóc Sức Khỏe Gia Đình
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
          Tuyển chọn các thiết bị y tế đạt chuẩn, bảo hành 12-24 tháng, hỗ trợ kết nối hệ thống CareNest.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '32px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--bg-card-subtle)',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          flex: 1,
          minWidth: '240px',
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            id="products-search-input"
            type="text"
            placeholder="Tìm kiếm máy đo huyết áp, đồng hồ định vị GPS, SpO2..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button id="filter-all-btn" className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '14px' }}>
            Tất cả
          </button>
          <button id="filter-iot-btn" className="btn btn-secondary" style={{ padding: '10px 18px', fontSize: '14px' }}>
            Đồng hồ IoT Wonlex
          </button>
          <button id="filter-med-btn" className="btn btn-secondary" style={{ padding: '10px 18px', fontSize: '14px' }}>
            Thiết bị y tế
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
      }}>
        {products.map((item) => (
          <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              height: '200px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              marginBottom: '16px',
            }}>
              {item.icon}
            </div>

            <span className={`badge ${item.badgeColor}`} style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>
              {item.badge}
            </span>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {item.category}
            </div>

            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', lineHeight: 1.4, flex: 1 }}>
              {item.name}
            </h2>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'auto',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)',
            }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                {item.price}
              </span>

              <button
                id={`add-cart-${item.id}`}
                className="btn btn-primary"
                style={{ padding: '8px 14px', fontSize: '13px' }}
              >
                <ShoppingCart size={16} /> Mua ngay
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
