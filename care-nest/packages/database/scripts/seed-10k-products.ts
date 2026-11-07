/**
 * CareNest - High-Performance 10,000 Medical & IoT Products Seeder
 *
 * Generates 10,000 realistic, diverse Vietnamese medical and health-IoT products,
 * inserts them into PostgreSQL via batch operations, and immediately indexes them into MeiliSearch.
 *
 * Usage:
 *   pnpm --filter @carenest/database seed:10k
 *   or: tsx --env-file=../../.env scripts/seed-10k-products.ts
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

const MEILI_URL = process.env.MEILISEARCH_URL || 'http://localhost:7700';
const MEILI_KEY = process.env.MEILISEARCH_MASTER_KEY || 'carenest_dev_master_key';

// ---------------------------------------------------------------------------
// Realistic Medical & Health Templates
// ---------------------------------------------------------------------------

interface CategoryTemplate {
  slug: string;
  name: string;
  isIot: boolean;
  isMedical: boolean;
  requiresRx: boolean;
  priceRange: [number, number]; // [min, max] VND
  brands: string[];
  templates: {
    prefix: string;
    specs: string[];
    models: string[];
  }[];
}

const CATEGORY_TEMPLATES: CategoryTemplate[] = [
  {
    slug: 'thiet-bi-y-te-thong-minh',
    name: 'Thiết Bị Y Tế Thông Minh & Định Vị',
    isIot: true,
    isMedical: false,
    requiresRx: false,
    priceRange: [650000, 3950000],
    brands: ['CareNest', 'Wonlex', 'Garmin Health', 'Wellue', 'Xiaomi Care', 'Tuya Smart', 'Apple Health'],
    templates: [
      {
        prefix: 'Đồng Hồ Định Vị & Cảnh Báo Té Ngã Cho Người Cao Tuổi',
        specs: ['Sim 4G LTE đa mạng', 'Cảm biến con quay 6 trục phát hiện té ngã', 'Đo SpO2 & nhịp tim 24/7', 'Nút gọi SOS 1 chạm tới 3 người thân', 'Kháng nước chuẩn IP67'],
        models: ['Pro V3', 'Senior S8', 'Guard 4G', 'CareLink V2', 'Elderly SOS', 'Family Plus', 'HealthMax Ultra'],
      },
      {
        prefix: 'Nút Bấm Cấp Cứu Khẩn Cấp Không Dây',
        specs: ['Sim 4G tự động gọi cấp cứu', 'Chống nước chuyên dụng phòng tắm', 'Thời lượng pin 12 tháng', 'Gửi toạ độ GPS tức thì qua App CareNest'],
        models: ['Home SOS-01', 'Emergency Pro', 'LifeGuard 4G', 'CareButton V2', 'SafeOne'],
      },
      {
        prefix: 'Gậy Thông Minh Định Vị GPS & Chống Trượt',
        specs: ['Hợp kim nhôm hàng không siêu nhẹ', 'Tích hợp đèn LED trợ sáng ban đêm', 'Còi hú báo động té ngã tự động', 'Đế xoay 360 độ 4 chân cân bằng'],
        models: ['CareStick GPS', 'Elderly Walking Pro', 'SmartCane 4G', 'SafeStep V3', 'Ultralight GPS'],
      },
      {
        prefix: 'Cảm Biến Radar Giám Sát Nhịp Thở & Giấc Ngủ Không Chạm',
        specs: ['Công nghệ sóng milimet 60GHz không cần đeo', 'Cảnh báo rời giường quá lâu lúc nửa đêm', 'Phát hiện ngưng thở khi ngủ', 'Kết nối WiFi & Bluetooth CareNest'],
        models: ['CareSense 60G', 'RadarSleep Pro', 'VitalMonitor V1', 'BreathSense AI'],
      },
      {
        prefix: 'Vòng Đeo Tay Y Tế Đo Điện Tâm Đồ ECG & Huyết Áp',
        specs: ['Màn hình AMOLED sắc nét hiển thị đồ thị tim', 'Cảnh báo rung nhĩ AFib & loạn nhịp tim', 'Đo huyết áp quang học thế hệ mới', 'Pin sạc từ tính dùng 7 ngày'],
        models: ['VitalBand ECG', 'HealthRing 4G', 'CardioWatch Pro', 'CareBand S2'],
      },
    ],
  },
  {
    slug: 'may-do-huyet-ap',
    name: 'Máy Đo Huyết Áp & Tim Mạch',
    isIot: false,
    isMedical: true,
    requiresRx: false,
    priceRange: [550000, 3200000],
    brands: ['Omron', 'Microlife', 'Beurer', 'Yuwell', 'Citizen', 'Rossmax', 'Andon', 'Boso'],
    templates: [
      {
        prefix: 'Máy Đo Huyết Áp Bắp Tay Tự Động',
        specs: ['Công nghệ Intellisense bơm hơi êm ái', 'Bộ nhớ 2 người x 100 lần đo', 'Cảnh báo quấn vòng bít đúng', 'Báo cử động người khi đo'],
        models: ['HEM-7120', 'HEM-7156T Bluetooth', 'HEM-7361T AFib', 'BM-28', 'B3 AFIB Advanced', 'YE680B', 'CHU-304'],
      },
      {
        prefix: 'Máy Đo Huyết Áp Cổ Tay Nhỏ Gọn Du Lịch',
        specs: ['Cảm biến định vị cổ tay chuẩn tim', 'Màn hình LCD lớn số hiển thị rõ nét', 'Kèm hộp đựng bảo quản chống sốc', 'Tự động tính trung bình 3 lần đo'],
        models: ['HEM-6161', 'HEM-6232T', 'BC-28', 'W3 Comfort', 'YE8900A'],
      },
      {
        prefix: 'Máy Đo Điện Tâm Đồ Cầm Tay Điện Tử ECG',
        specs: ['Ghi điện tâm đồ 30 giây nhanh chóng', 'Phát hiện sớm thiếu máu cơ tim và ngoại tâm thu', 'Xuất file PDF gửi trực tiếp bác sĩ qua CareNest'],
        models: ['Complete 2-in-1', 'DuoEK Handheld', 'CardioCheck 6L', 'HeartScan HCG-801'],
      },
    ],
  },
  {
    slug: 'may-do-duong-huyet',
    name: 'Máy Đo Đường Huyết & Tiểu Đường',
    isIot: false,
    isMedical: true,
    requiresRx: false,
    priceRange: [220000, 2450000],
    brands: ['Abbott', 'Accu-Chek', 'OneTouch', 'Sinocare', 'Contour', 'Terumo', 'Yuwell'],
    templates: [
      {
        prefix: 'Cảm Biến Theo Dõi Đường Huyết Liên Tục CGM (14 Ngày)',
        specs: ['Đo đường huyết không cần chích máu ngón tay', 'Báo động đường huyết thấp/cao lúc nửa đêm', 'Chống nước khi tắm và bơi lội', 'Truyền dữ liệu không dây qua NFC/Bluetooth'],
        models: ['Freestyle Libre 1', 'Freestyle Libre 2', 'Dexcom G6 Sensor', 'Guardian Connect'],
      },
      {
        prefix: 'Máy Đo Đường Huyết Cá Nhân Chính Hãng',
        specs: ['Không cần cài mã code que thử tự động', 'Lượng máu thử siêu nhỏ 0.6 micro lít', 'Cho kết quả chính xác trong 5 giây', 'Đánh dấu trước và sau ăn'],
        models: ['Instant Wireless', 'Guide Me', 'Select Plus Simple', 'Safe-Accu Plus', 'Contour Plus One'],
      },
      {
        prefix: 'Hộp 50 Que Thử Đường Huyết & Kim Lấy Máu Vô Trùng',
        specs: ['Hút máu mao dẫn nhanh không đau', 'Bảo quản kín khí hạn dùng 24 tháng', 'Đạt tiêu chuẩn quốc tế ISO 15197:2015'],
        models: ['Strip 50s', 'Pack 100 Lancets', 'Test Kit Family', 'Accu-Check Refill'],
      },
    ],
  },
  {
    slug: 'cham-soc-giac-ngu-ho-hap',
    name: 'Chăm Sóc Giấc Ngủ & Hô Hấp',
    isIot: false,
    isMedical: true,
    requiresRx: false,
    priceRange: [320000, 18500000],
    brands: ['Yuwell', 'Beurer', 'Philips Respironics', 'ResMed', 'Microlife', 'Owgels', 'Jumper'],
    templates: [
      {
        prefix: 'Máy Tạo Oxy Y Tế Gia Đình Lưu Lượng Cao',
        specs: ['Nồng độ oxy tinh khiết 93% ± 3% chuẩn bệnh viện', 'Tích hợp chức năng xông khí dung', 'Hệ thống cảnh báo mất điện và áp suất thấp', 'Hoạt động êm ái liên tục 24/7'],
        models: ['7F-3D (3 Lít)', '7F-5D (5 Lít)', '8F-5A (5 Lít)', 'OZ-5-01TW0 (5 Lít)', 'EverFlo 5L', 'Compact 3L'],
      },
      {
        prefix: 'Máy Đo Nồng Độ Oxy Trong Máu SpO2 Kẹp Ngón',
        specs: ['Đo SpO2 và chỉ số tưới máu PI', 'Màn hình OLED 4 hướng xoay hiển thị đồ thị nhịp tim', 'Tự động tắt nguồn sau 8 giây không sử dụng', 'Kèm dây đeo và bao đựng tiện lợi'],
        models: ['PO30', 'PO40', 'PO60 Bluetooth', 'OXY300', 'YX301', 'JPD-500D'],
      },
      {
        prefix: 'Máy Xông Khí Dung Mũi Họng Nén Khí Gia Đình',
        specs: ['Hạt thuốc siêu mịn 3.9 micromet thẩm thấu sâu phế nang', 'Tốc độ phun sương khí dung cao tiết kiệm thời gian', 'Cốc thuốc dung tích lớn chống đổ', 'Kèm mặt nạ người lớn và trẻ em'],
        models: ['NE-C28', 'NE-C101', 'IH18', 'IH26', 'NEB200', 'AirPro 3'],
      },
      {
        prefix: 'Máy Trợ Thở Tự Động Điều Trị Ngưng Thở Khi Ngủ CPAP',
        specs: ['Tự động điều chỉnh áp lực khí theo hơi thở Auto-CPAP', 'Bộ tạo ẩm sưởi ấm tích hợp chống khô họng', 'Ghi nhật ký giấc ngủ chi tiết qua thẻ nhớ SD', 'Cực kỳ yên tĩnh dưới 26dB'],
        models: ['AirSense 10 AutoSet', 'AirMini Portable', 'BMC GII Auto', 'YH-550 Pro'],
      },
    ],
  },
  {
    slug: 'thiet-bi-ho-tro-nguoi-gia',
    name: 'Thiết Bị Hỗ Trợ Người Cao Tuổi & Vận Động',
    isIot: false,
    isMedical: false,
    requiresRx: false,
    priceRange: [290000, 14500000],
    brands: ['Lucass', 'Karma', 'Akiko', 'Nikita', 'Paramount Bed', 'Medihome', 'Harima'],
    templates: [
      {
        prefix: 'Xe Lăn Gấp Gọn Hợp Kim Nhôm Cho Người Già',
        specs: ['Khung nhôm sơn tĩnh điện siêu bền chịu tải 120kg', 'Tựa tay có thể nâng hạ thuận tiện lên xuống xe', 'Bánh xe đặc chống thủng êm ái', 'Gấp gọn dễ dàng bỏ cốp ô tô du lịch'],
        models: ['X-9', 'X-63L', 'Soma 105', 'Ergo 115', 'TravelLite Pro', 'Comfort Plus'],
      },
      {
        prefix: 'Xe Lăn Điện Điều Khiển Cần Gạt Đa Năng',
        specs: ['Động cơ kép không chổi than 500W mạnh mẽ', 'Hệ thống phanh điện từ tự động an toàn khi dừng dốc', 'Pin Lithium cao cấp đi được 20km mỗi lần sạc', 'Bộ điều khiển xoay 360 độ nhạy bén'],
        models: ['XE-802', 'PowerChair Pro', 'SmartWheel E1', 'Medihome E-Drive'],
      },
      {
        prefix: 'Đệm Khí Y Tế Chống Loét Cao Cấp Cho Người Nằm Liệt',
        specs: ['Máy bơm đảo khí luân phiên 12 phút/chu kỳ chống tì đè', 'Chất liệu PVC y tế kháng khuẩn khử mùi', 'Van khí đa ngăn xả hơi nhanh khi khẩn cấp', 'Độ ồn cực thấp không ảnh hưởng giấc ngủ'],
        models: ['LC-5789', 'Aria Tubular', 'CareMattress Pro', 'Yuwell Air Plus'],
      },
      {
        prefix: 'Khung Tập Đi Hợp Kim Nhôm Có Bánh Xe & Ghế Ngồi',
        specs: ['Hỗ trợ người sau tai biến phục hồi chức năng tập đi', 'Tay thắng kép an toàn tích hợp khóa bánh', 'Điều chỉnh độ cao linh hoạt theo vóc dáng người dùng', 'Ghế đệm êm ái khi mỏi chân'],
        models: ['W-47', 'Rollator Pro', 'StepCare 4W', 'SafeWalker V2'],
      },
      {
        prefix: 'Gậy Chống 4 Chân Hợp Kim Nhôm Chống Trượt',
        specs: ['Đế cao su bám sàn tuyệt đối chống ngã', 'Nấc bấm tăng giảm chiều cao 10 mức', 'Tay cầm bọc mút xốp êm ái thấm hút mồ hôi'],
        models: ['Lucass B-924', 'QuadCane Pro', 'FourLeg Senior'],
      },
    ],
  },
];

const MEDICAL_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80',
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
  'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&q=80',
  'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&q=80',
  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80',
  'https://images.unsplash.com/photo-1583912267670-6575ad4736f8?w=800&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80',
  'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=800&q=80',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Main Seeder Function
// ---------------------------------------------------------------------------

async function main() {
  const TOTAL_PRODUCTS = 10000;
  const BATCH_SIZE = 1000;

  console.log(`\n======================================================`);
  console.log(`🚀 Starting CareNest Large-Scale Seeder: ${TOTAL_PRODUCTS} Products`);
  console.log(`======================================================\n`);

  // 1. Fetch Sellers & Categories from DB
  const [dbSellers, dbCategories] = await Promise.all([
    prisma.seller.findMany({ select: { id: true, storeName: true, storeSlug: true } }),
    prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
  ]);

  if (dbSellers.length === 0) {
    throw new Error('No sellers found in database! Please run default seed first.');
  }
  if (dbCategories.length === 0) {
    throw new Error('No categories found in database! Please run default seed first.');
  }

  console.log(`✓ Loaded ${dbSellers.length} Sellers & ${dbCategories.length} Categories from DB.`);

  // Map category slug to db id
  const categoryMap = new Map<string, { id: string; name: string; slug: string }>();
  for (const cat of dbCategories) {
    categoryMap.set(cat.slug, cat);
  }

  // Seller map
  const sellerMap = new Map<string, { id: string; storeName: string }>();
  for (const s of dbSellers) {
    sellerMap.set(s.id, s);
  }

  const defaultCategory = dbCategories[0];
  const startTime = Date.now();

  const isClean = process.argv.includes('--clean');
  if (isClean) {
    console.log('🧹 Cleaning previously generated synthetic products...');
    await prisma.inventory.deleteMany({
      where: {
        product: {
          OR: [
            { sku: { startsWith: 'CNGEN-' } },
            { sku: { startsWith: 'CN-' }, orderItems: { none: {} } },
          ],
        },
      },
    });
    await prisma.productImage.deleteMany({
      where: {
        product: {
          OR: [
            { sku: { startsWith: 'CNGEN-' } },
            { sku: { startsWith: 'CN-' }, orderItems: { none: {} } },
          ],
        },
      },
    });
    await prisma.product.deleteMany({
      where: {
        OR: [
          { sku: { startsWith: 'CNGEN-' } },
          { sku: { startsWith: 'CN-' } },
        ],
        orderItems: { none: {} },
      },
    });
    console.log('✓ Cleaned synthetic products in PostgreSQL.');

    try {
      console.log('🧹 Resetting MeiliSearch products index...');
      await fetch(`${MEILI_URL}/indexes/products/documents`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${MEILI_KEY}` },
      });
      console.log('✓ Cleared MeiliSearch products index.');
    } catch {}

    // Re-index remaining original DB products
    const originalProducts = await prisma.product.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, storeName: true } },
        images: { orderBy: { position: 'asc' } },
        inventory: { select: { quantity: true, reserved: true } },
      },
    });
    if (originalProducts.length > 0) {
      const origDocs = originalProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        brand: p.brand || '',
        price: Number(p.basePrice || 0),
        status: p.status,
        categoryId: p.categoryId,
        categoryName: p.category?.name || '',
        categorySlug: p.category?.slug || '',
        sellerId: p.sellerId,
        sellerStoreName: p.seller?.storeName || '',
        isIotDevice: p.isIotDevice,
        requiresImei: p.requiresImei,
        imageUrl: p.images[0]?.url || null,
        stock: p.inventory.reduce((sum, inv) => sum + (inv.quantity - inv.reserved), 0),
        createdAt: p.createdAt.getTime(),
      }));
      await fetch(`${MEILI_URL}/indexes/products/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${MEILI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(origDocs),
      });
    }
  }

  // Unique run token to guarantee no SKU or slug collisions even on repeated runs
  const runToken = Math.random().toString(36).substring(2, 6).toUpperCase();

  console.log(`\n📦 Generating and inserting ${TOTAL_PRODUCTS} products in batches of ${BATCH_SIZE} (Run token: ${runToken})...`);

  let totalInserted = 0;

  for (let batchIdx = 0; batchIdx < TOTAL_PRODUCTS / BATCH_SIZE; batchIdx++) {
    const productRows: any[] = [];
    const imageRows: any[] = [];
    const inventoryRows: any[] = [];
    const meiliDocs: any[] = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const globalIndex = batchIdx * BATCH_SIZE + i + 1;

      // Round-robin category & seller
      const catTemplate = CATEGORY_TEMPLATES[globalIndex % CATEGORY_TEMPLATES.length];
      const matchedCat = categoryMap.get(catTemplate.slug) || defaultCategory;
      const seller = dbSellers[globalIndex % dbSellers.length];

      // Pick brand, template, model, specs
      const brand = catTemplate.brands[globalIndex % catTemplate.brands.length];
      const template = catTemplate.templates[globalIndex % catTemplate.templates.length];
      const model = template.models[globalIndex % template.models.length];
      const spec = template.specs[globalIndex % template.specs.length];

      const name = `${template.prefix} ${brand} ${model} (#${globalIndex})`;
      const rawSlug = `${slugify(template.prefix)}-${slugify(brand)}-${slugify(model)}-${runToken.toLowerCase()}-${globalIndex}`;

      const [minPrice, maxPrice] = catTemplate.priceRange;
      // Step of 10,000 VND
      const basePrice = Math.round((minPrice + Math.random() * (maxPrice - minPrice)) / 10000) * 10000;
      const compareAtPrice = Math.round((basePrice * (1.15 + Math.random() * 0.2)) / 10000) * 10000;

      const productId = randomUUID();
      const sku = `CNGEN-${slugify(brand).toUpperCase().slice(0, 4)}-${runToken}-${String(globalIndex).padStart(6, '0')}`;
      const imageUrl = MEDICAL_IMAGES[globalIndex % MEDICAL_IMAGES.length];
      const stock = Math.floor(Math.random() * 120) + 15;

      const description = `${name} - Thiết bị y tế chính hãng phân phối bởi ${seller.storeName}.\n\nĐặc điểm nổi bật:\n- ${spec}\n- Đạt tiêu chuẩn kiểm định chất lượng y tế lưu hành toàn quốc.\n- Bảo hành chính hãng 12-24 tháng 1 đổi 1.\n- Dễ dàng kết nối và theo dõi dữ liệu trên nền tảng CareNest.`;

      // 1. Product row
      productRows.push({
        id: productId,
        sellerId: seller.id,
        categoryId: matchedCat.id,
        name,
        slug: rawSlug,
        description,
        brand,
        sku,
        basePrice,
        compareAtPrice,
        status: 'ACTIVE',
        isMedical: catTemplate.isMedical,
        requiresRx: catTemplate.requiresRx,
        isIotDevice: catTemplate.isIot,
        requiresImei: catTemplate.isIot,
        iotDeviceModel: catTemplate.isIot ? `${slugify(brand).toUpperCase()}-${model.replace(/\s+/g, '')}` : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 2. ProductImage row
      imageRows.push({
        id: randomUUID(),
        productId,
        url: imageUrl,
        altText: name,
        position: 0,
        createdAt: new Date(),
      });

      // 3. Inventory row
      inventoryRows.push({
        id: randomUUID(),
        productId,
        sellerId: seller.id,
        warehouseCode: globalIndex % 2 === 0 ? 'HCM-01' : 'HN-01',
        quantity: stock,
        reserved: 0,
        reorderThreshold: 10,
      });

      // 4. MeiliSearch Document
      meiliDocs.push({
        id: productId,
        name,
        slug: rawSlug,
        description,
        brand,
        price: basePrice,
        status: 'ACTIVE',
        categoryId: matchedCat.id,
        categoryName: matchedCat.name,
        categorySlug: matchedCat.slug,
        sellerId: seller.id,
        sellerStoreName: seller.storeName,
        isIotDevice: catTemplate.isIot,
        requiresImei: catTemplate.isIot,
        imageUrl,
        stock,
        createdAt: Date.now(),
      });
    }

    // Bulk insert into PostgreSQL
    await prisma.$transaction(async (tx) => {
      await tx.product.createMany({ data: productRows });
      await tx.productImage.createMany({ data: imageRows });
      await tx.inventory.createMany({ data: inventoryRows });
    });

    // Bulk send to MeiliSearch
    try {
      const res = await fetch(`${MEILI_URL}/indexes/products/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MEILI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meiliDocs),
      });
      if (!res.ok) {
        console.warn(`⚠️ Batch ${batchIdx + 1} MeiliSearch sync responded with status ${res.status}`);
      }
    } catch (err: any) {
      console.warn(`⚠️ Batch ${batchIdx + 1} MeiliSearch sync failed: ${err.message}`);
    }

    totalInserted += productRows.length;
    process.stdout.write(`  ↳ Batch ${batchIdx + 1}/${TOTAL_PRODUCTS / BATCH_SIZE}: ${totalInserted}/${TOTAL_PRODUCTS} inserted in Postgres & MeiliSearch\r`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n🎉 SUCCESS! Successfully seeded ${totalInserted} products into PostgreSQL and MeiliSearch in ${durationSec}s!`);

  // Final check MeiliSearch stats
  try {
    const res = await fetch(`${MEILI_URL}/indexes/products/stats`, {
      headers: { Authorization: `Bearer ${MEILI_KEY}` },
    });
    if (res.ok) {
      const stats = await res.json();
      console.log(`📊 MeiliSearch Current Index Stats:`, stats);
    }
  } catch {}
}

main()
  .catch((err) => {
    console.error('\n❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
