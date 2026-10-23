/**
 * CareNest Complete Database Seeder
 *
 * Populates realistic, rich test data for:
 * 1. Users (Admin, Support, Sellers, Buyers, Caregivers)
 * 2. Sellers & Seller Wallets & KYC
 * 3. Categories & Products & Inventory & Images
 * 4. Plans (Basic, Family, Enterprise) & Active Subscriptions
 * 5. Devices & Device Assignments & Geofences
 * 6. Health Records (Timescale vitals, heart rate, BP, SpO2, location)
 * 7. Alerts (Fall, SOS, Geofence exit, Low battery)
 * 8. Orders, Order Items, Payments, Shipments & Reviews
 * 9. Notifications & Notification Preferences
 * 10. IMEI records for device inventory tracking
 */

import {
  PrismaClient,
  UserRole,
  UserStatus,
  SellerStatus,
  KycStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  DeviceStatus,
  AlertType,
  AlertSeverity,
  AlertStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShipmentStatus,
  NotificationChannel,
  NotificationStatus,
  ImeiStatus,
  WalletEntryKind,
} from '@prisma/client';

const prisma = new PrismaClient();

// Pre-hashed passwords (saltRounds = 10):
// 'Admin@123456' -> $2b$10$v1b/2mRDSXIHyFYyRFPFVO6YGuE6K5wu521G/ct92b6wx.KBnp5zW
// 'Seller@123456' -> $2b$10$VB.xZ7bhtKi1sTAy/EsZjuvvgMCOhocJu3NUo7c2Xqm8x8q/NHX1m
// 'Buyer@123456' -> $2b$10$KfDD8FDk6ICrRKmgm8E4buuR7ptJAu5gKcZtruybhORRRN0EL9Znm
// '123456' -> $2b$10$TyQ7QMGTH9.q4b9oHF7Ya.uhzmDs3qhQDVKj8ZAiOuDqpd19R9CcG
const PASSWORDS = {
  ADMIN: '$2b$10$v1b/2mRDSXIHyFYyRFPFVO6YGuE6K5wu521G/ct92b6wx.KBnp5zW',
  SELLER: '$2b$10$VB.xZ7bhtKi1sTAy/EsZjuvvgMCOhocJu3NUo7c2Xqm8x8q/NHX1m',
  BUYER: '$2b$10$KfDD8FDk6ICrRKmgm8E4buuR7ptJAu5gKcZtruybhORRRN0EL9Znm',
  SIMPLE: '$2b$10$TyQ7QMGTH9.q4b9oHF7Ya.uhzmDs3qhQDVKj8ZAiOuDqpd19R9CcG',
};

async function main() {
  console.log('🌱 Starting CareNest database seeding...');

  // ---------------------------------------------------------------------------
  // 1. Users
  // ---------------------------------------------------------------------------
  console.log('👤 Seeding Users...');

  await prisma.user.upsert({
    where: { email: 'admin@carenest.vn' },
    update: {},
    create: {
      email: 'admin@carenest.vn',
      fullName: 'Quản Trị Viên CareNest',
      phone: '0901234567',
      passwordHash: PASSWORDS.ADMIN,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      pdpaConsent: true,
      pdpaConsentedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: 'support@carenest.vn' },
    update: {},
    create: {
      email: 'support@carenest.vn',
      fullName: 'Trung Tâm CSKH CareNest',
      phone: '0909998888',
      passwordHash: PASSWORDS.SIMPLE,
      role: UserRole.SUPPORT,
      status: UserStatus.ACTIVE,
      pdpaConsent: true,
      pdpaConsentedAt: new Date(),
    },
  });

  // Sellers
  const sellerUserWonlex = await prisma.user.upsert({
    where: { email: 'seller.wonlex@carenest.vn' },
    update: {},
    create: {
      email: 'seller.wonlex@carenest.vn',
      fullName: 'Wonlex Vietnam Store',
      phone: '0934567890',
      passwordHash: PASSWORDS.SELLER,
      role: UserRole.SELLER,
      status: UserStatus.ACTIVE,
      pdpaConsent: true,
      pdpaConsentedAt: new Date(),
    },
  });

  const sellerUserMedtech = await prisma.user.upsert({
    where: { email: 'seller.medtech@carenest.vn' },
    update: {},
    create: {
      email: 'seller.medtech@carenest.vn',
      fullName: 'MedTech Vietnam Official',
      phone: '0912345678',
      passwordHash: PASSWORDS.SELLER,
      role: UserRole.SELLER,
      status: UserStatus.ACTIVE,
      pdpaConsent: true,
      pdpaConsentedAt: new Date(),
    },
  });

  const sellerUserAnphat = await prisma.user.upsert({
    where: { email: 'seller.anphat@carenest.vn' },
    update: {},
    create: {
      email: 'seller.anphat@carenest.vn',
      fullName: 'Dược Phẩm An Phát Healthcare',
      phone: '0923456789',
      passwordHash: PASSWORDS.SELLER,
      role: UserRole.SELLER,
      status: UserStatus.ACTIVE,
      pdpaConsent: true,
      pdpaConsentedAt: new Date(),
    },
  });

  // Buyers
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@carenest.vn' },
    update: {},
    create: {
      email: 'buyer@carenest.vn',
      fullName: 'Nguyễn Văn An',
      phone: '0987654321',
      passwordHash: PASSWORDS.BUYER,
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
      pdpaConsent: true,
      pdpaConsentedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: 'tranthib@gmail.com' },
    update: {},
    create: {
      email: 'tranthib@gmail.com',
      fullName: 'Trần Thị Bích',
      phone: '0988776655',
      passwordHash: PASSWORDS.BUYER,
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
      pdpaConsent: true,
      pdpaConsentedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: 'ongnam.le@gmail.com' },
    update: {},
    create: {
      email: 'ongnam.le@gmail.com',
      fullName: 'Cụ Lê Văn Nam (82 tuổi)',
      phone: '0977112233',
      passwordHash: PASSWORDS.SIMPLE,
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
      pdpaConsent: true,
      pdpaConsentedAt: new Date(),
    },
  });

  // Caregiver
  const doctorMinh = await prisma.user.upsert({
    where: { email: 'bs.minh@carenest.vn' },
    update: {},
    create: {
      email: 'bs.minh@carenest.vn',
      fullName: 'BS.CKII Nguyễn Văn Minh (Lão Khoa)',
      phone: '0966554433',
      passwordHash: PASSWORDS.SIMPLE,
      role: UserRole.CAREGIVER,
      status: UserStatus.ACTIVE,
      pdpaConsent: true,
      pdpaConsentedAt: new Date(),
    },
  });

  // ---------------------------------------------------------------------------
  // 2. Sellers & Wallets
  // ---------------------------------------------------------------------------
  console.log('🏪 Seeding Sellers & Wallets...');

  const sellerWonlex = await prisma.seller.upsert({
    where: { storeSlug: 'wonlex-vietnam' },
    update: {},
    create: {
      userId: sellerUserWonlex.id,
      storeName: 'Wonlex Vietnam Official Store',
      storeSlug: 'wonlex-vietnam',
      taxId: '0109876543',
      status: SellerStatus.ACTIVE,
      kycStatus: KycStatus.APPROVED,
      ratingAvg: 4.95,
      ratingCount: 340,
      commissionRate: 0.04,
      bankName: 'MB Bank',
      bankAccount: '0888999888',
      bankAccountName: 'CONG TY TNHH WONLEX VN',
    },
  });

  const walletWonlex = await prisma.sellerWallet.upsert({
    where: { sellerId: sellerWonlex.id },
    update: {},
    create: {
      sellerId: sellerWonlex.id,
      balanceVnd: 35000000,
      pendingVnd: 5000000,
      lifetimeVnd: 98000000,
      currency: 'VND',
    },
  });

  const existingEntry = await prisma.walletEntry.findFirst({
    where: { walletId: walletWonlex.id },
  });
  if (!existingEntry) {
    await prisma.walletEntry.create({
      data: {
        walletId: walletWonlex.id,
        kind: WalletEntryKind.ORDER_CREDIT,
        amountVnd: 1814400,
        balanceAfterVnd: 35000000,
        referenceType: 'order',
        description: 'Thanh toán đơn hàng #CN-20261017-001 (khấu trừ 4% hoa hồng)',
      },
    });
  }

  const sellerMedtech = await prisma.seller.upsert({
    where: { storeSlug: 'medtech-vietnam' },
    update: {},
    create: {
      userId: sellerUserMedtech.id,
      storeName: 'MedTech Healthcare Vietnam',
      storeSlug: 'medtech-vietnam',
      taxId: '0108923456',
      status: SellerStatus.ACTIVE,
      kycStatus: KycStatus.APPROVED,
      ratingAvg: 4.88,
      ratingCount: 128,
      commissionRate: 0.05,
      bankName: 'Vietcombank',
      bankAccount: '0011004567890',
      bankAccountName: 'CONG TY TNHH MEDTECH VN',
    },
  });

  await prisma.sellerWallet.upsert({
    where: { sellerId: sellerMedtech.id },
    update: {},
    create: {
      sellerId: sellerMedtech.id,
      balanceVnd: 18500000,
      pendingVnd: 2400000,
      lifetimeVnd: 45000000,
      currency: 'VND',
    },
  });

  const sellerAnphat = await prisma.seller.upsert({
    where: { storeSlug: 'an-phat-medical' },
    update: {},
    create: {
      userId: sellerUserAnphat.id,
      storeName: 'An Phát Medical & Wellness',
      storeSlug: 'an-phat-medical',
      taxId: '0315789123',
      status: SellerStatus.ACTIVE,
      kycStatus: KycStatus.APPROVED,
      ratingAvg: 4.80,
      ratingCount: 85,
      commissionRate: 0.05,
      bankName: 'Techcombank',
      bankAccount: '19034567891234',
      bankAccountName: 'CTY CP Y TE AN PHAT',
    },
  });

  await prisma.sellerWallet.upsert({
    where: { sellerId: sellerAnphat.id },
    update: {},
    create: {
      sellerId: sellerAnphat.id,
      balanceVnd: 12200000,
      pendingVnd: 1500000,
      lifetimeVnd: 28000000,
      currency: 'VND',
    },
  });

  // ---------------------------------------------------------------------------
  // 3. Categories
  // ---------------------------------------------------------------------------
  console.log('📂 Seeding Categories...');

  const catSmartIot = await prisma.category.upsert({
    where: { slug: 'thiet-bi-y-te-thong-minh' },
    update: {},
    create: {
      name: 'Thiết Bị Y Tế Thông Minh & Định Vị',
      slug: 'thiet-bi-y-te-thong-minh',
    },
  });

  const catBp = await prisma.category.upsert({
    where: { slug: 'may-do-huyet-ap' },
    update: {},
    create: {
      name: 'Máy Đo Huyết Áp & Tim Mạch',
      slug: 'may-do-huyet-ap',
    },
  });

  const catGlucose = await prisma.category.upsert({
    where: { slug: 'may-do-duong-huyet' },
    update: {},
    create: {
      name: 'Máy Đo Đường Huyết & Tiểu Đường',
      slug: 'may-do-duong-huyet',
    },
  });

  const catSeniorAid = await prisma.category.upsert({
    where: { slug: 'thiet-bi-ho-tro-nguoi-gia' },
    update: {},
    create: {
      name: 'Thiết Bị Hỗ Trợ Người Cao Tuổi',
      slug: 'thiet-bi-ho-tro-nguoi-gia',
    },
  });

  const catRespiratory = await prisma.category.upsert({
    where: { slug: 'cham-soc-giac-ngu-ho-hap' },
    update: {},
    create: {
      name: 'Chăm Sóc Giấc Ngủ & Hô Hấp',
      slug: 'cham-soc-giac-ngu-ho-hap',
    },
  });

  // ---------------------------------------------------------------------------
  // 4. Products & Inventory & Images
  // ---------------------------------------------------------------------------
  console.log('📦 Seeding Products & Inventory...');

  const productData = [
    {
      sellerId: sellerWonlex.id,
      categoryId: catSmartIot.id,
      name: 'Đồng Hồ Định Vị & Cảnh Báo Té Ngã CareNest Pro V3.2',
      slug: 'dong-ho-dinh-vi-canh-bao-te-nga-carenest-pro-v3-2',
      description:
        'Đồng hồ thông minh 4G cao cấp tích hợp cảm biến con quay hồi chuyển 6 trục phát hiện té ngã tức thì. Hỗ trợ nút gọi khẩn cấp SOS 1 chạm, định vị đa tầng GPS + WiFi + LBS, tự động đo nhịp tim, huyết áp và nồng độ oxy trong máu SpO2 định kỳ.',
      brand: 'CareNest x Wonlex',
      sku: 'CN-PRO-V32',
      basePrice: 1890000,
      compareAtPrice: 2390000,
      isMedical: false,
      isIotDevice: true,
      requiresImei: true,
      iotDeviceModel: 'care-nest-V3.2',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      stock: 85,
    },
    {
      sellerId: sellerWonlex.id,
      categoryId: catSmartIot.id,
      name: 'Đồng Hồ Sức Khỏe Người Cao Tuổi CareNest Senior Care S8',
      slug: 'dong-ho-suc-khoe-nguoi-cao-tuoi-carenest-senior-care-s8',
      description:
        'Màn hình AMOLED sắc nét, cỡ chữ to rõ phù hợp thị lực người lớn tuổi. Trang bị cảm biến nhịp tim quang học PPG thế hệ mới, đo SpO2 liên tục, nhắc lịch uống thuốc tự động, gọi video HD 4G 2 chiều với con cháu.',
      brand: 'CareNest',
      sku: 'CN-S8-PRO',
      basePrice: 2490000,
      compareAtPrice: 2990000,
      isMedical: false,
      isIotDevice: true,
      requiresImei: true,
      iotDeviceModel: 'care-nest-S8',
      imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80',
      stock: 50,
    },
    {
      sellerId: sellerMedtech.id,
      categoryId: catSmartIot.id,
      name: 'Nút Bấm Cấp Cứu Khẩn Cấp 4G CareNest Home SOS',
      slug: 'nut-bam-cap-cuu-khan-cap-4g-carenest-home-sos',
      description:
        'Nút bấm SOS không dây chống nước chuẩn IP67, lắp phòng ngủ hoặc phòng tắm. 1 chạm gọi cứu hộ lập tức tới 3 số người thân và gửi vị trí qua tin nhắn/app.',
      brand: 'CareNest Home',
      sku: 'CN-SOS-4G',
      basePrice: 650000,
      compareAtPrice: 850000,
      isMedical: false,
      isIotDevice: true,
      requiresImei: true,
      iotDeviceModel: 'care-nest-SOS',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
      stock: 120,
    },
    {
      sellerId: sellerMedtech.id,
      categoryId: catBp.id,
      name: 'Máy Đo Huyết Áp Bắp Tay Omron HEM-7361T (Bluetooth)',
      slug: 'may-do-huyet-ap-bap-tay-omron-hem-7361t-bluetooth',
      description:
        'Máy đo huyết áp tự động số 1 Nhật Bản, tính năng cảnh báo rung nhĩ AFib sớm phòng ngừa đột quỵ, đồng bộ dữ liệu chỉ số huyết áp vào app CareNest.',
      brand: 'Omron',
      sku: 'OMR-HEM-7361T',
      basePrice: 1750000,
      compareAtPrice: 2100000,
      isMedical: true,
      isIotDevice: false,
      requiresImei: false,
      imageUrl: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&q=80',
      stock: 60,
    },
    {
      sellerId: sellerAnphat.id,
      categoryId: catRespiratory.id,
      name: 'Máy Đo Nồng Độ Oxy Trong Máu SpO2 Beurer PO30',
      slug: 'may-do-nong-do-oxy-trong-mau-spo2-beurer-po30',
      description:
        'Máy kẹp ngón đo nồng độ bão hòa oxy trong máu và nhịp tim nhập khẩu Đức. Độ nhạy cao, màn hình màu hiển thị đồ thị nhịp tim trực quan.',
      brand: 'Beurer',
      sku: 'BEU-PO30',
      basePrice: 890000,
      compareAtPrice: 1150000,
      isMedical: true,
      isIotDevice: false,
      requiresImei: false,
      imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&q=80',
      stock: 90,
    },
    {
      sellerId: sellerAnphat.id,
      categoryId: catGlucose.id,
      name: 'Máy Đo Đường Huyết Không Cần Lấy Máu Freestyle Libre 2',
      slug: 'may-do-duong-huyet-lien-tuc-freestyle-libre-2',
      description:
        'Cảm biến theo dõi đường huyết liên tục (CGM) gắn cánh tay 14 ngày không gây đau, truyền dữ liệu theo thời gian thực và phát chuông cảnh báo hạ đường huyết lúc nửa đêm.',
      brand: 'Abbott',
      sku: 'ABT-FSL-2',
      basePrice: 1650000,
      compareAtPrice: 1950000,
      isMedical: true,
      isIotDevice: false,
      requiresImei: false,
      imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80',
      stock: 40,
    },
    {
      sellerId: sellerWonlex.id,
      categoryId: catSeniorAid.id,
      name: 'Gậy Thông Minh Định Vị GPS & Cảnh Báo Té Ngã CareStick GPS',
      slug: 'gay-thong-minh-dinh-vi-gps-canh-bao-te-nga-carestick-gps',
      description:
        'Gậy chống cao cấp hợp kim nhôm siêu nhẹ, đế chống trượt 4 chân xoay 360 độ, tích hợp đèn pin siêu sáng, radio FM, còi hú báo động và chip định vị GPS.',
      brand: 'CareStick',
      sku: 'CS-GPS-01',
      basePrice: 1120000,
      compareAtPrice: 1450000,
      isMedical: false,
      isIotDevice: true,
      requiresImei: true,
      iotDeviceModel: 'care-nest-STICK',
      imageUrl: 'https://images.unsplash.com/photo-1583912267670-6575ad4736f8?w=800&q=80',
      stock: 35,
    },
    {
      sellerId: sellerMedtech.id,
      categoryId: catRespiratory.id,
      name: 'Cảm Biến Giường Ngủ Radar Giám Sát Nhịp Thở Không Chạm CareSense',
      slug: 'cam-bien-giuong-ngu-radar-giam-sat-nhip-tho-khong-cham-caresense',
      description:
        'Công nghệ Radar sóng milimet 60GHz gắn trần hoặc đầu giường, giám sát liên tục nhịp tim, nhịp thở, trở mình và cảnh báo rời giường quá lâu mà không cần tiếp xúc.',
      brand: 'CareSense',
      sku: 'CS-RADAR-01',
      basePrice: 3200000,
      compareAtPrice: 3800000,
      isMedical: false,
      isIotDevice: true,
      requiresImei: true,
      iotDeviceModel: 'care-nest-RADAR',
      imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80',
      stock: 25,
    },
  ];

  const createdProducts = [];

  for (const item of productData) {
    const p = await prisma.product.upsert({
      where: {
        sellerId_slug: {
          sellerId: item.sellerId,
          slug: item.slug,
        },
      },
      update: {},
      create: {
        sellerId: item.sellerId,
        categoryId: item.categoryId,
        name: item.name,
        slug: item.slug,
        description: item.description,
        brand: item.brand,
        sku: item.sku,
        basePrice: item.basePrice,
        compareAtPrice: item.compareAtPrice,
        status: 'ACTIVE',
        isMedical: item.isMedical,
        isIotDevice: item.isIotDevice,
        requiresImei: item.requiresImei,
        iotDeviceModel: item.iotDeviceModel,
      },
    });

    createdProducts.push(p);

    // Image
    const existingImg = await prisma.productImage.findFirst({
      where: { productId: p.id },
    });
    if (!existingImg) {
      await prisma.productImage.create({
        data: {
          productId: p.id,
          url: item.imageUrl,
          altText: item.name,
          position: 0,
        },
      });
    }

    // Inventory
    const existingInv = await prisma.inventory.findFirst({
      where: { productId: p.id, sellerId: item.sellerId },
    });
    if (!existingInv) {
      await prisma.inventory.create({
        data: {
          productId: p.id,
          sellerId: item.sellerId,
          warehouseCode: 'HN-01',
          quantity: item.stock,
          reserved: 0,
          reorderThreshold: 10,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Subscription Plans
  // ---------------------------------------------------------------------------
  console.log('💳 Seeding Subscription Plans...');

  await prisma.plan.upsert({
    where: { code: 'free' },
    update: {},
    create: {
      code: 'free',
      name: 'Gói Cơ Bản (Miễn Phí)',
      description: 'Dành cho gia đình theo dõi 1 thiết bị cơ bản với các tính năng thiết yếu.',
      priceMonthly: 0,
      deviceLimit: 1,
      caregiverLimit: 1,
      retentionMonths: 1,
      features: [
        'Định vị GPS thời gian thực',
        'Cảnh báo SOS khẩn cấp qua thông báo ứng dụng',
        'Lưu lịch sử hành trình 7 ngày',
        '1 tài khoản người thân kết nối',
      ],
      active: true,
    },
  });

  const planFamily = await prisma.plan.upsert({
    where: { code: 'family' },
    update: {},
    create: {
      code: 'family',
      name: 'Gói Gia Đình An Tâm',
      description: 'Gói phổ biến nhất, bảo vệ toàn diện cha mẹ và người thân với AI phát hiện té ngã.',
      priceMonthly: 99000,
      deviceLimit: 3,
      caregiverLimit: 3,
      retentionMonths: 6,
      features: [
        'Hỗ trợ tối đa 3 thiết bị đồng thời',
        'AI nhận diện té ngã độ chính xác 98%',
        'Tạo 5 vùng an toàn Geofence thông minh',
        'Cảnh báo đa kênh tức thì: Cuộc gọi tự động + SMS + App',
        'Lưu trữ hồ sơ huyết áp, nhịp tim 6 tháng',
        'Kết nối 3 người thân trong gia đình',
      ],
      active: true,
    },
  });

  await prisma.plan.upsert({
    where: { code: 'enterprise' },
    update: {},
    create: {
      code: 'enterprise',
      name: 'Gói Chăm Sóc Toàn Diện Pro',
      description: 'Chăm sóc cao cấp có hỗ trợ tư vấn Bác sĩ gia đình 24/7 và báo cáo sức khỏe AI.',
      priceMonthly: 199000,
      deviceLimit: 10,
      caregiverLimit: 10,
      retentionMonths: 24,
      features: [
        'Hỗ trợ tối đa 10 thiết bị',
        'Báo cáo phân tích nhịp tim & huyết áp chuyên sâu hàng tuần',
        'Cảnh báo sớm đột quỵ và rung nhĩ AFib',
        'Kênh liên lạc ưu tiên với Bác sĩ Lão khoa 24/7',
        'Lưu trữ dữ liệu y tế trọn đời 2 năm',
        'Không giới hạn số vùng an toàn Geofence',
      ],
      active: true,
    },
  });

  // Active subscription for main buyer
  const existingSub = await prisma.subscription.findFirst({
    where: { userId: buyer.id },
  });
  if (!existingSub) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);

    await prisma.subscription.create({
      data: {
        userId: buyer.id,
        sellerId: sellerWonlex.id,
        plan: SubscriptionPlan.PRO,
        planId: planFamily.id,
        status: SubscriptionStatus.ACTIVE,
        startedAt: new Date(),
        currentPeriodEnd: futureDate,
        externalId: 'sub_carenest_demo_01',
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 6. Devices & Assignments & Geofences
  // ---------------------------------------------------------------------------
  console.log('⌚ Seeding IoT Devices & Geofences...');

  const dev1 = await prisma.device.upsert({
    where: { deviceId: '864932050123456' },
    update: {},
    create: {
      deviceId: '864932050123456',
      model: 'care-nest-V3.2',
      firmware: 'V3.2.1-PRO',
      status: DeviceStatus.ACTIVE,
      lastSeenAt: new Date(),
      lastBattery: 86,
    },
  });

  const dev2 = await prisma.device.upsert({
    where: { deviceId: '864932050987654' },
    update: {},
    create: {
      deviceId: '864932050987654',
      model: 'care-nest-S8',
      firmware: 'S8.0.4-SENIOR',
      status: DeviceStatus.ACTIVE,
      lastSeenAt: new Date(Date.now() - 1000 * 60 * 15),
      lastBattery: 72,
    },
  });

  const dev3 = await prisma.device.upsert({
    where: { deviceId: '864932050555666' },
    update: {},
    create: {
      deviceId: '864932050555666',
      model: 'care-nest-SOS',
      firmware: 'SOS.1.0',
      status: DeviceStatus.ACTIVE,
      lastSeenAt: new Date(Date.now() - 1000 * 60 * 60),
      lastBattery: 95,
    },
  });

  // Device Assignments to Buyer
  const existingAssign1 = await prisma.deviceAssignment.findFirst({
    where: { deviceId: dev1.id, userId: buyer.id },
  });
  if (!existingAssign1) {
    await prisma.deviceAssignment.create({
      data: {
        deviceId: dev1.id,
        userId: buyer.id,
      },
    });
  }

  const existingAssign2 = await prisma.deviceAssignment.findFirst({
    where: { deviceId: dev2.id, userId: buyer.id },
  });
  if (!existingAssign2) {
    await prisma.deviceAssignment.create({
      data: {
        deviceId: dev2.id,
        userId: buyer.id,
      },
    });
  }

  const existingAssign3 = await prisma.deviceAssignment.findFirst({
    where: { deviceId: dev3.id, userId: buyer.id },
  });
  if (!existingAssign3) {
    await prisma.deviceAssignment.create({
      data: {
        deviceId: dev3.id,
        userId: buyer.id,
      },
    });
  }

  // Geofences for Buyer
  const geofence1 = await prisma.geofence.findFirst({
    where: { userId: buyer.id, name: 'Nhà Riêng (Ba Đình, Hà Nội)' },
  });
  if (!geofence1) {
    await prisma.geofence.create({
      data: {
        userId: buyer.id,
        name: 'Nhà Riêng (Ba Đình, Hà Nội)',
        centerLat: 21.0381,
        centerLon: 105.8234,
        radiusMeters: 250,
        active: true,
      },
    });
  }

  const geofence2 = await prisma.geofence.findFirst({
    where: { userId: buyer.id, name: 'Bệnh Viện Hữu Nghị' },
  });
  if (!geofence2) {
    await prisma.geofence.create({
      data: {
        userId: buyer.id,
        name: 'Bệnh Viện Hữu Nghị',
        centerLat: 21.0152,
        centerLon: 105.8612,
        radiusMeters: 300,
        active: true,
      },
    });
  }

  const geofence3 = await prisma.geofence.findFirst({
    where: { userId: buyer.id, name: 'Công Viên Bách Thảo' },
  });
  if (!geofence3) {
    await prisma.geofence.create({
      data: {
        userId: buyer.id,
        name: 'Công Viên Bách Thảo',
        centerLat: 21.0425,
        centerLon: 105.8285,
        radiusMeters: 400,
        active: true,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 7. Health Records (Vitals & GPS data points)
  // ---------------------------------------------------------------------------
  console.log('💓 Seeding Health Records & Telemetry...');

  const existingRecords = await prisma.healthRecord.count({
    where: { deviceId: dev1.id },
  });

  if (existingRecords === 0) {
    const records = [];
    const now = Date.now();

    // 10 recent vitals data points
    const sampleVitals = [
      { hr: 72, sbp: 122, dbp: 80, spo2: 98, temp: 36.6, bat: 86, lat: 21.0381, lon: 105.8234 },
      { hr: 74, sbp: 124, dbp: 82, spo2: 98, temp: 36.6, bat: 85, lat: 21.0385, lon: 105.8239 },
      { hr: 78, sbp: 128, dbp: 84, spo2: 97, temp: 36.7, bat: 84, lat: 21.0392, lon: 105.8248 },
      { hr: 82, sbp: 130, dbp: 85, spo2: 98, temp: 36.7, bat: 82, lat: 21.0401, lon: 105.8258 },
      { hr: 85, sbp: 132, dbp: 86, spo2: 99, temp: 36.8, bat: 80, lat: 21.0415, lon: 105.8272 },
      { hr: 80, sbp: 126, dbp: 82, spo2: 98, temp: 36.6, bat: 78, lat: 21.0425, lon: 105.8285 },
      { hr: 75, sbp: 122, dbp: 80, spo2: 98, temp: 36.5, bat: 76, lat: 21.0408, lon: 105.8265 },
      { hr: 71, sbp: 120, dbp: 79, spo2: 99, temp: 36.5, bat: 75, lat: 21.0388, lon: 105.8241 },
      { hr: 69, sbp: 119, dbp: 78, spo2: 98, temp: 36.6, bat: 74, lat: 21.0382, lon: 105.8235 },
      { hr: 72, sbp: 121, dbp: 80, spo2: 98, temp: 36.6, bat: 73, lat: 21.0381, lon: 105.8234 },
    ];

    for (let i = 0; i < sampleVitals.length; i++) {
      const v = sampleVitals[i];
      const time = new Date(now - (sampleVitals.length - i) * 1000 * 60 * 30); // every 30 mins

      records.push({
        deviceId: dev1.id,
        userId: buyer.id,
        recordType: 'VITALS_BP_HR',
        measuredAt: time,
        receivedAt: time,
        battery: v.bat,
        gsmSignal: 28,
        data: {
          heartRate: v.hr,
          bloodPressureSystolic: v.sbp,
          bloodPressureDiastolic: v.dbp,
          spo2: v.spo2,
          temperature: v.temp,
          lat: v.lat,
          lon: v.lon,
        },
      });
    }

    await prisma.healthRecord.createMany({ data: records });
  }

  // ---------------------------------------------------------------------------
  // 8. Alerts
  // ---------------------------------------------------------------------------
  console.log('🚨 Seeding Alerts...');

  const existingAlerts = await prisma.alert.count({ where: { deviceId: dev1.id } });
  if (existingAlerts === 0) {
    await prisma.alert.createMany({
      data: [
        {
          deviceId: dev1.id,
          subjectId: buyer.id,
          type: AlertType.FALL,
          severity: AlertSeverity.CRITICAL,
          status: AlertStatus.RESOLVED,
          occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
          receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 15),
          payload: {
            fallVelocity: 3.4,
            impactGForce: 4.8,
            location: { lat: 21.0381, lon: 105.8234 },
          },
          notes: 'Cụ trượt chân nhẹ tại phòng khách, đã liên hệ người nhà kiểm tra an toàn.',
        },
        {
          deviceId: dev1.id,
          subjectId: buyer.id,
          type: AlertType.GEOFENCE_EXIT,
          severity: AlertSeverity.MEDIUM,
          status: AlertStatus.ACKNOWLEDGED,
          occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 14), // yesterday
          receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 14),
          acknowledgedAt: new Date(Date.now() - 1000 * 60 * 60 * 13),
          payload: {
            geofenceName: 'Nhà Riêng (Ba Đình, Hà Nội)',
            exitLat: 21.0425,
            exitLon: 105.8285,
          },
          notes: 'Cụ đi dạo công viên Bách Thảo cùng con gái.',
        },
        {
          deviceId: dev1.id,
          subjectId: buyer.id,
          type: AlertType.VITALS_HR_HIGH,
          severity: AlertSeverity.HIGH,
          status: AlertStatus.OPEN,
          occurredAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
          receivedAt: new Date(Date.now() - 1000 * 60 * 45),
          payload: {
            heartRate: 115,
            threshold: 100,
            durationSeconds: 180,
          },
          notes: 'Nhịp tim đo được 115 bpm khi đang tập thể dục buổi sáng.',
        },
        {
          deviceId: dev2.id,
          subjectId: buyer.id,
          type: AlertType.LOW_BATTERY,
          severity: AlertSeverity.LOW,
          status: AlertStatus.OPEN,
          occurredAt: new Date(Date.now() - 1000 * 60 * 20), // 20 mins ago
          receivedAt: new Date(Date.now() - 1000 * 60 * 20),
          payload: {
            batteryLevel: 14,
            threshold: 15,
          },
          notes: 'Pin đồng hồ còn 14%, vui lòng cắm sạc nam châm.',
        },
      ],
    });
  }

  // ---------------------------------------------------------------------------
  // 9. Caregivers
  // ---------------------------------------------------------------------------
  console.log('🩺 Seeding Caregiver Links...');

  await prisma.caregiver.upsert({
    where: {
      userId_caretakerId: {
        userId: buyer.id,
        caretakerId: doctorMinh.id,
      },
    },
    update: {},
    create: {
      userId: buyer.id,
      caretakerId: doctorMinh.id,
      relationship: 'DOCTOR',
      permissions: {
        viewHealth: true,
        receiveAlerts: true,
        manageDevices: false,
      },
      acceptedAt: new Date(),
    },
  });

  // ---------------------------------------------------------------------------
  // 10. Orders, Order Items, Payments & Shipments
  // ---------------------------------------------------------------------------
  console.log('🛍️ Seeding Orders & Checkout Data...');

  const watchProduct = createdProducts[0];
  const omronProduct = createdProducts[3];

  const order1 = await prisma.order.upsert({
    where: { orderNumber: 'CN-20261017-001' },
    update: {},
    create: {
      orderNumber: 'CN-20261017-001',
      buyerId: buyer.id,
      sellerId: sellerWonlex.id,
      status: OrderStatus.DELIVERED,
      subtotal: 1890000,
      shippingFee: 30000,
      discount: 0,
      total: 1920000,
      shippingAddress: {
        name: 'Nguyễn Văn An',
        phone: '0987654321',
        line1: 'Số 120 Hoàng Hoa Thám',
        ward: 'Phường Ngọc Hà',
        district: 'Quận Ba Đình',
        province: 'Thành phố Hà Nội',
        country: 'Việt Nam',
      },
      note: 'Giao giờ hành chính, gọi trước khi đến',
    },
  });

  const existingItem1 = await prisma.orderItem.findFirst({
    where: { orderId: order1.id },
  });
  if (!existingItem1) {
    await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        productId: watchProduct.id,
        productName: watchProduct.name,
        unitPrice: 1890000,
        quantity: 1,
        lineTotal: 1890000,
      },
    });
  }

  await prisma.payment.upsert({
    where: { orderId: order1.id },
    update: {},
    create: {
      orderId: order1.id,
      userId: buyer.id,
      method: PaymentMethod.VNPAY,
      status: PaymentStatus.PAID,
      amount: 1920000,
      transactionRef: 'VNP_20261017_9921',
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  });

  await prisma.shipment.upsert({
    where: { orderId: order1.id },
    update: {},
    create: {
      orderId: order1.id,
      sellerId: sellerWonlex.id,
      carrier: 'GHN',
      trackingCode: 'GHNVN2026101788',
      status: ShipmentStatus.DELIVERED,
      shippingFee: 30000,
      weight: 350,
      deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
  });

  // Review for Order 1
  await prisma.review.upsert({
    where: { orderId: order1.id },
    update: {},
    create: {
      orderId: order1.id,
      sellerId: sellerWonlex.id,
      buyerId: buyer.id,
      rating: 5,
      comment:
        'Đồng hồ CareNest Pro định vị rất chuẩn xác, cảm biến té ngã báo ngay về app cho tôi khi thử nghiệm. Thiết kế đẹp và pin dùng được gần 4 ngày, rất an tâm khi để ông bà ở nhà một mình!',
    },
  });

  // Order 2
  const order2 = await prisma.order.upsert({
    where: { orderNumber: 'CN-20261018-002' },
    update: {},
    create: {
      orderNumber: 'CN-20261018-002',
      buyerId: buyer.id,
      sellerId: sellerMedtech.id,
      status: OrderStatus.SHIPPED,
      subtotal: 1750000,
      shippingFee: 0,
      discount: 0,
      total: 1750000,
      shippingAddress: {
        name: 'Nguyễn Văn An',
        phone: '0987654321',
        line1: 'Số 120 Hoàng Hoa Thám',
        ward: 'Phường Ngọc Hà',
        district: 'Quận Ba Đình',
        province: 'Thành phố Hà Nội',
        country: 'Việt Nam',
      },
    },
  });

  const existingItem2 = await prisma.orderItem.findFirst({
    where: { orderId: order2.id },
  });
  if (!existingItem2) {
    await prisma.orderItem.create({
      data: {
        orderId: order2.id,
        productId: omronProduct.id,
        productName: omronProduct.name,
        unitPrice: 1750000,
        quantity: 1,
        lineTotal: 1750000,
      },
    });
  }

  await prisma.payment.upsert({
    where: { orderId: order2.id },
    update: {},
    create: {
      orderId: order2.id,
      userId: buyer.id,
      method: PaymentMethod.COD,
      status: PaymentStatus.PENDING,
      amount: 1750000,
    },
  });

  await prisma.shipment.upsert({
    where: { orderId: order2.id },
    update: {},
    create: {
      orderId: order2.id,
      sellerId: sellerMedtech.id,
      carrier: 'GHTK',
      trackingCode: 'GHTK261088421',
      status: ShipmentStatus.IN_TRANSIT,
      shippingFee: 0,
      weight: 500,
      pickedUpAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  });

  // ---------------------------------------------------------------------------
  // 11. Notifications & Preferences
  // ---------------------------------------------------------------------------
  console.log('🔔 Seeding Notifications...');

  const notifCount = await prisma.notification.count({ where: { userId: buyer.id } });
  if (notifCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: buyer.id,
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.SENT,
          templateKey: 'alert.fall',
          subject: 'Cảnh Báo Khẩn Cấp: Phát hiện té ngã',
          body: 'Thiết bị Đồng Hồ Cụ Lê Văn Nam vừa kích hoạt cảnh báo té ngã tại vị trí 120 Hoàng Hoa Thám.',
          payload: { deviceId: dev1.id, alertType: 'FALL' },
        },
        {
          userId: buyer.id,
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.SENT,
          templateKey: 'order.shipped',
          subject: 'Đơn hàng đang giao',
          body: 'Đơn hàng #CN-20261018-002 đã được bàn giao cho đơn vị vận chuyển GHTK.',
          payload: { orderNumber: 'CN-20261018-002' },
        },
        {
          userId: buyer.id,
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.READ,
          templateKey: 'health.weekly_report',
          subject: 'Báo cáo sức khỏe tuần qua',
          body: 'Các chỉ số huyết áp và nhịp tim của Cụ Lê Văn Nam trong 7 ngày qua duy trì ở mức ổn định.',
          payload: { weeklyScore: 92 },
          readAt: new Date(),
        },
      ],
    });
  }

  await prisma.notificationPreference.upsert({
    where: { userId: buyer.id },
    update: {},
    create: {
      userId: buyer.id,
      channels: {
        order: { email: true, push: true, sms: false, zns: true },
        alert: { email: true, push: true, sms: true, zns: true },
        subscription: { email: true, push: true, sms: false, zns: false },
        kyc: { email: true, push: false, sms: false, zns: false },
      },
    },
  });

  // ---------------------------------------------------------------------------
  // 12. IMEI Inventory Records
  // ---------------------------------------------------------------------------
  console.log('🏷️ Seeding IMEI Records...');

  const imeis = [
    { imei: '864932050123456', productId: watchProduct.id, sellerId: sellerWonlex.id, status: ImeiStatus.ACTIVATED },
    { imei: '864932050111111', productId: watchProduct.id, sellerId: sellerWonlex.id, status: ImeiStatus.IN_STOCK },
    { imei: '864932050222222', productId: watchProduct.id, sellerId: sellerWonlex.id, status: ImeiStatus.IN_STOCK },
    { imei: '864932050333333', productId: watchProduct.id, sellerId: sellerWonlex.id, status: ImeiStatus.IN_STOCK },
  ];

  for (const im of imeis) {
    await prisma.imeiRecord.upsert({
      where: { imei: im.imei },
      update: {},
      create: {
        imei: im.imei,
        productId: im.productId,
        sellerId: im.sellerId,
        status: im.status,
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('📋 Account summary for testing:');
  console.log('  👑 Admin:     admin@carenest.vn      | Password: Admin@123456');
  console.log('  🏪 Seller:    seller.wonlex@carenest.vn | Password: Seller@123456');
  console.log('  🛒 Buyer:     buyer@carenest.vn      | Password: Buyer@123456');
  console.log('  🩺 Caregiver: bs.minh@carenest.vn    | Password: 123456');
  console.log('----------------------------------------------------');
}

main()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
