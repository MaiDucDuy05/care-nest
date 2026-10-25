/**
 * Demo accounts and wallet management for CareNest sandbox simulation.
 * Enables hyper-realistic testing without requiring backend microservices to be manually seeded.
 */

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'BUYER' | 'CAREGIVER' | 'ADMIN' | 'ELDER';
  roleName: string;
  avatar: string;
  tagline: string;
  description: string;
  address: {
    addressLine: string;
    ward: string;
    district: string;
    city: string;
  };
  initialBalance: number;
  devicesCount: number;
  badgeBg: string;
  badgeText: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'demo_user_buyer_01',
    email: 'buyer@carenest.vn',
    password: 'Buyer@123456',
    fullName: 'Nguyễn Văn An',
    phone: '0912 345 678',
    role: 'BUYER',
    roleName: 'Người Chăm Sóc & Mua Hàng',
    avatar: '👨‍💼',
    tagline: 'Gia đình 4 thành viên, đang theo dõi mẹ già 75 tuổi',
    description: 'Đã liên kết 2 đồng hồ GPS Wonlex KT17, 3 vùng an toàn tại Hà Nội, sẵn ví CareNest Pay',
    address: {
      addressLine: 'Số 26, Phố Tràng Tiền',
      ward: 'Phường Tràng Tiền',
      district: 'Quận Hoàn Kiếm',
      city: 'Hà Nội',
    },
    initialBalance: 5250000,
    devicesCount: 2,
    badgeBg: '#ccfbf1',
    badgeText: '#0f766e',
  },
  {
    id: 'demo_user_caregiver_02',
    email: 'caregiver@carenest.vn',
    password: 'Caregiver@123456',
    fullName: 'BS. Trần Thị Mai',
    phone: '0988 765 432',
    role: 'CAREGIVER',
    roleName: 'Bác Sĩ / Điều Dưỡng Gia Đình',
    avatar: '👩‍⚕️',
    tagline: 'Khoa Tim Mạch - Bệnh Viện Bạch Mai',
    description: 'Giám sát chỉ số nhịp tim, cảnh báo ngã khẩn cấp & gửi hướng dẫn sơ cứu cho người thân',
    address: {
      addressLine: '78 Đường Giải Phóng',
      ward: 'Phường Phương Mai',
      district: 'Quận Đống Đa',
      city: 'Hà Nội',
    },
    initialBalance: 8500000,
    devicesCount: 5,
    badgeBg: '#e0e7ff',
    badgeText: '#3730a3',
  },
  {
    id: 'demo_user_elder_03',
    email: 'elder@carenest.vn',
    password: 'Elder@123456',
    fullName: 'Cụ Lê Hoàng Nam',
    phone: '0903 888 999',
    role: 'ELDER',
    roleName: 'Người Cao Tuổi (Thành Viên VIP)',
    avatar: '👴',
    tagline: '72 tuổi - Chế độ giao diện chữ to & nút SOS khẩn cấp',
    description: 'Thành viên thân thiết CareNest VIP Gold, địa chỉ giao hàng tại Biệt thự Flamingo Đại Lải',
    address: {
      addressLine: 'Biệt Thự Sen Flamingo Đại Lải',
      ward: 'Xã Ngọc Thanh',
      district: 'Thành phố Phúc Yên',
      city: 'Vĩnh Phúc',
    },
    initialBalance: 12000000,
    devicesCount: 1,
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
  },
  {
    id: 'demo_user_admin_04',
    email: 'admin@carenest.vn',
    password: 'Admin@123456',
    fullName: 'Quản Trị Viên CareNest',
    phone: '0901 000 999',
    role: 'ADMIN',
    roleName: 'Ban Quản Trị Hệ Thống',
    avatar: '🛡️',
    tagline: 'Toàn quyền kiểm soát danh mục, đơn hàng & IoT',
    description: 'Quản trị microservices, xem nhật ký cảnh báo và đối soát cổng thanh toán sandbox',
    address: {
      addressLine: 'Tòa nhà Landmark 72',
      ward: 'Phường Mễ Trì',
      district: 'Quận Nam Từ Liêm',
      city: 'Hà Nội',
    },
    initialBalance: 99000000,
    devicesCount: 12,
    badgeBg: '#f3e8ff',
    badgeText: '#6b21a8',
  },
];

const STORAGE_KEY_CURRENT_USER = 'carenest_demo_current_user';
const STORAGE_KEY_WALLET_BALANCE = 'carenest_demo_wallet_balance';

export function getCurrentDemoAccount(): DemoAccount | null {
  if (typeof window === 'undefined') return DEMO_ACCOUNTS[0];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (!raw) return DEMO_ACCOUNTS[0];
    return JSON.parse(raw);
  } catch {
    return DEMO_ACCOUNTS[0];
  }
}

export function setCurrentDemoAccount(account: DemoAccount): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(account));
    // Set initial wallet balance if not already present
    if (!window.localStorage.getItem(STORAGE_KEY_WALLET_BALANCE)) {
      window.localStorage.setItem(STORAGE_KEY_WALLET_BALANCE, String(account.initialBalance));
    }
  } catch {
    // Silent catch
  }
}

export function getWalletBalance(): number {
  if (typeof window === 'undefined') return 5250000;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_WALLET_BALANCE);
    if (raw) return Number(raw);
    const curr = getCurrentDemoAccount();
    const balance = curr?.initialBalance ?? 5250000;
    window.localStorage.setItem(STORAGE_KEY_WALLET_BALANCE, String(balance));
    return balance;
  } catch {
    return 5250000;
  }
}

export function deductWalletBalance(amount: number): { success: boolean; newBalance: number; error?: string } {
  const current = getWalletBalance();
  if (current < amount) {
    return {
      success: false,
      newBalance: current,
      error: `Số dư ví không đủ. Cần thanh toán ${new Intl.NumberFormat('vi-VN').format(amount)} đ nhưng ví hiện chỉ còn ${new Intl.NumberFormat('vi-VN').format(current)} đ.`,
    };
  }
  const next = current - amount;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY_WALLET_BALANCE, String(next));
    window.dispatchEvent(new CustomEvent('wallet-balance-updated', { detail: { balance: next } }));
  }
  return { success: true, newBalance: next };
}

export function topupWalletBalance(amount: number): number {
  const current = getWalletBalance();
  const next = current + amount;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY_WALLET_BALANCE, String(next));
    window.dispatchEvent(new CustomEvent('wallet-balance-updated', { detail: { balance: next } }));
  }
  return next;
}

