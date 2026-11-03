/**
 * Test data generators for CareNest k6 load tests.
 */

const VIETNAMESE_NAMES = [
  'Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng Nam', 'Phạm Minh Tuấn',
  'Đỗ Mai Hương', 'Vũ Quốc Bảo', 'Hoàng Thu Trang', 'Bùi Văn Hùng',
];

const CITIES = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
const DISTRICTS = ['Quận 1', 'Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Cầu Giấy', 'Quận Bình Thạnh'];

export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomUser() {
  const rand = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    email: `loadtest_${rand}@carenest.test`,
    password: 'Password@123456',
    fullName: randomItem(VIETNAMESE_NAMES),
    phone: `09${randomInt(10000000, 99999999)}`,
    role: 'BUYER',
  };
}

export function generateRandomAddress() {
  return {
    name: randomItem(VIETNAMESE_NAMES),
    phone: `09${randomInt(10000000, 99999999)}`,
    line1: `Số ${randomInt(1, 999)} Đường Giải Phóng`,
    ward: 'Phường Phương Mai',
    district: randomItem(DISTRICTS),
    province: randomItem(CITIES),
    country: 'VN',
  };
}

export function generateCheckoutPayload(productId = 'p-1', sellerId = 'seller-wonlex') {
  return {
    shippingAddress: generateRandomAddress(),
    paymentMethod: randomItem(['VNPAY', 'MOMO', 'COD', 'BANK_TRANSFER']),
    note: 'Giao hàng giờ hành chính, gọi trước khi đến',
  };
}

export function generateTelemetryPayload(deviceId = 'DEV-WONLEX-001') {
  return {
    deviceId,
    timestamp: new Date().toISOString(),
    heartRate: randomInt(65, 110),
    bloodPressureSystolic: randomInt(110, 145),
    bloodPressureDiastolic: randomInt(70, 95),
    spo2: randomInt(94, 99),
    temperature: +(36.2 + Math.random() * 1.5).toFixed(1),
    battery: randomInt(15, 100),
    lat: +(21.0285 + (Math.random() - 0.5) * 0.05).toFixed(6),
    lng: +(105.8542 + (Math.random() - 0.5) * 0.05).toFixed(6),
    steps: randomInt(1000, 8000),
  };
}
