import { Link } from '@/i18n/routing';
import {
  ShieldAlert,
  Activity,
  Lock,
  ShoppingBag,
} from 'lucide-react';

export function HealthFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pb-8 border-b border-slate-800/80">
          {/* Cột 1: Thông tin hệ thống Health OS */}
          <div className="md:col-span-5 space-y-2">
            <div className="flex items-center gap-2 text-white font-extrabold text-sm">
              <Activity size={18} className="text-teal-400" />
              <span>CareNest Health OS — Giám Sát Sinh Tồn Y Tế IoT</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px] max-w-md">
              Hệ thống theo dõi sức khỏe và bảo vệ an toàn từ xa cho người cao tuổi. Dữ liệu nhịp tim,
              huyết áp, SpO2 và định vị GPS được đồng bộ mã hóa liên tục 24/7.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Lock size={12} className="text-emerald-400" /> Chuẩn bảo mật HIPAA &amp; PDPA
              </span>
              <span>•</span>
              <span>Mã hóa đường truyền TLS 1.3</span>
            </div>
          </div>

          {/* Cột 2: Hotline khẩn cấp */}
          <div className="md:col-span-4 bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="font-bold text-white text-xs flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-400" />
              <span>Kênh Trợ Giúp Khẩn Cấp Y Tế</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Cấp cứu y tế toàn quốc:</span>
              <strong className="text-rose-400 font-mono text-sm">115</strong>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Hỗ trợ kỹ thuật thiết bị IoT:</span>
              <strong className="text-teal-400 font-mono text-sm">1900-6868 (Nhánh 2)</strong>
            </div>
          </div>

          {/* Cột 3: Chuyển sang mua sắm thiết bị */}
          <div className="md:col-span-3 text-right md:border-l md:border-slate-800 md:pl-6 space-y-2.5">
            <div className="text-[11px] text-slate-400">Cần mua thêm thiết bị &amp; phụ kiện?</div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <ShoppingBag size={15} />
              <span>Đến Sàn Mua Sắm Y Tế</span>
            </Link>
          </div>
        </div>

        {/* Dòng bản quyền & hướng dẫn */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © 2026 CareNest Health IoT Platform. Hệ thống chăm sóc sức khỏe gia đình chuyên nghiệp.
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/health/dashboard" className="hover:text-teal-400 transition-colors">
              Tổng quan sinh tồn
            </Link>
            <span>•</span>
            <Link href="/health/geofence" className="hover:text-teal-400 transition-colors">
              Thiết lập GPS
            </Link>
            <span>•</span>
            <Link href="/activation" className="hover:text-teal-400 transition-colors">
              Kích hoạt đồng hồ mới
            </Link>
            <span>•</span>
            <Link href="/subscription" className="hover:text-teal-400 transition-colors">
              Gia hạn SIM 4G
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

