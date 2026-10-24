import { Link } from '@/i18n/routing';
import {
  HeartPulse,
  ShieldCheck,
  Headphones,
  Truck,
  RotateCcw,
  Activity,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export function ShopFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      {/* 4 Trụ Cột Cam Kết Chuẩn Y Khoa */}
      <div className="border-b border-slate-800 py-10 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">100% Chuẩn Y Khoa</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Được cấp phép lưu hành bởi Bộ Y Tế, tem chống hàng giả và kiểm định nghiêm ngặt.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Truck size={26} />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Giao Hỏa Tốc 2 Giờ</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Phục vụ nhanh chóng nhu cầu cấp thiết về thiết bị thở, máy đo đường huyết và cấp cứu.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <RotateCcw size={26} />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Bảo Hành 1 Đổi 1</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Bảo hành chính hãng 24 tháng, hỗ trợ đổi máy mới tận nơi trong 30 ngày nếu có lỗi.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Headphones size={26} />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Tư Vấn Y Tế 24/7</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Đội ngũ dược sĩ và kỹ thuật viên IoT y tế trực tuyến hỗ trợ lắp đặt và đọc kết quả.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Cột 1: Thông tin sàn TMĐT */}
        <div className="lg:col-span-2 space-y-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
              <HeartPulse size={20} />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">
              Care<span className="text-teal-400">Nest</span> Mall
            </span>
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
            Hệ sinh thái thương mại điện tử chuyên cung cấp thiết bị y tế chính hãng kết hợp nền tảng
            IoT giám sát sinh tồn người cao tuổi hàng đầu tại Việt Nam.
          </p>
          <div className="space-y-2 text-xs text-slate-400 pt-2">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-teal-400 shrink-0" />
              <span>Tòa nhà CareNest, 12A Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-teal-400 shrink-0" />
              <span>Tổng đài bán hàng &amp; tư vấn: <strong>1900-6868</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-teal-400 shrink-0" />
              <span>support@carenest.vn</span>
            </div>
          </div>
        </div>

        {/* Cột 2: Danh mục mua sắm */}
        <div>
          <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-4">
            Danh Mục Thiết Bị
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li>
              <Link href="/shop/products?search=huyết+áp" className="hover:text-teal-400 transition-colors">
                Máy Đo Huyết Áp Bắp Tay
              </Link>
            </li>
            <li>
              <Link href="/shop/products?search=đồng+hồ" className="hover:text-teal-400 transition-colors">
                Đồng Hồ Định Vị &amp; Báo Ngã SOS
              </Link>
            </li>
            <li>
              <Link href="/shop/products?search=oxy" className="hover:text-teal-400 transition-colors">
                Máy Tạo Oxy &amp; Đo SpO2
              </Link>
            </li>
            <li>
              <Link href="/shop/products?search=đường+huyết" className="hover:text-teal-400 transition-colors">
                Máy Đo Đường Huyết &amp; Que Thử
              </Link>
            </li>
            <li>
              <Link href="/shop/products?search=hỗ+trợ" className="hover:text-teal-400 transition-colors">
                Xe Lăn &amp; Thiết Bị Phục Hồi
              </Link>
            </li>
            <li>
              <Link href="/shop/products" className="hover:text-teal-400 transition-colors">
                Tất Cả Sản Phẩm Y Tế &gt;
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 3: Hỗ trợ khách hàng */}
        <div>
          <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-4">
            Hỗ Trợ Mua Hàng
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li>
              <Link href="/shop/cart" className="hover:text-teal-400 transition-colors">
                Tra Cứu Đơn Hàng &amp; Giỏ Hàng
              </Link>
            </li>
            <li>
              <span className="hover:text-teal-400 transition-colors cursor-pointer">
                Chính Sách Vận Chuyển Hỏa Tốc
              </span>
            </li>
            <li>
              <span className="hover:text-teal-400 transition-colors cursor-pointer">
                Quy Trình Bảo Hành 1 Đổi 1
              </span>
            </li>
            <li>
              <span className="hover:text-teal-400 transition-colors cursor-pointer">
                Chính Sách Đổi Trả Trong 30 Ngày
              </span>
            </li>
            <li>
              <span className="hover:text-teal-400 transition-colors cursor-pointer">
                Hướng Dẫn Mua Trả Góp 0%
              </span>
            </li>
          </ul>
        </div>

        {/* Cột 4: Hệ sinh thái IoT */}
        <div>
          <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-4">
            Hệ Sinh Thái IoT
          </h4>
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
              <Activity size={16} />
              <span>Dashboard Sức Khỏe</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dành riêng cho người nhà theo dõi dữ liệu sinh tồn nhịp tim, huyết áp thời gian thực.
            </p>
            <Link
              href="/health/dashboard"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-300 hover:text-white transition-colors"
            >
              Mở Dashboard Sức Khỏe &gt;
            </Link>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-white">Thanh toán an toàn:</div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">VNPAY</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">MOMO</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">VISA</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">COD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dưới cùng: Bản quyền & Pháp lý */}
      <div className="border-t border-slate-800/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 CareNest Platform. Bản quyền thuộc về Công ty CP Thiết Bị Y Tế &amp; Giải Pháp IoT CareNest.
          </div>
          <div className="flex items-center gap-4">
            <span>Tuân thủ an toàn dữ liệu PDPA &amp; HIPAA</span>
            <span>•</span>
            <span>Giấy phép TMĐT số 03168899xx</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

