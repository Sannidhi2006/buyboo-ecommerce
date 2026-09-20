const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load backend .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { sequelize, User, Category, Brand, Product, Cart } = require('../models');

async function runSeed() {
  console.log('====================================================');
  console.log('🌱 STARTING DATABASE SEEDING (Phase 3: Catalog)');
  console.log('====================================================');

  await sequelize.authenticate();
  console.log('✔ Connected to MySQL database.');

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Seed Demo Admin Account
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[1/4] Ensuring Demo Admin Account...');
  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@ecommerce.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  const adminPhone = process.env.SEED_ADMIN_PHONE || '9999999999';

  let adminUser = await User.findOne({ where: { username: adminUsername } });

  if (!adminUser) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    adminUser = await User.create({
      username: adminUsername,
      email: adminEmail,
      phone: adminPhone,
      password: hashedPassword,
      role: 'ADMIN',
    });
    console.log(`  ✔ Created demo ADMIN user: ${adminUsername} (${adminEmail})`);
  } else {
    // Ensure role is ADMIN and update details if needed
    if (adminUser.role !== 'ADMIN') {
      adminUser.role = 'ADMIN';
      await adminUser.save();
    }
    console.log(`  ✔ Demo ADMIN user already exists: ${adminUsername} (ID: ${adminUser.id})`);
  }

  // Ensure Admin has a Cart
  const adminCart = await Cart.findOne({ where: { userId: adminUser.id } });
  if (!adminCart) {
    await Cart.create({ userId: adminUser.id });
    console.log('  ✔ Provisioned cart for admin user.');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Seed Categories (5 requested categories)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[2/4] Seeding Categories...');
  const categoryDefinitions = [
    {
      name: 'Fruits',
      slug: 'fruits',
      description: 'Fresh, organic, orchard-picked seasonal fruits and exotic produce.',
      imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Clothes',
      slug: 'clothes',
      description: 'Premium casual wear, activewear, denim, and contemporary apparel.',
      imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Footwear',
      slug: 'footwear',
      description: 'Performance running shoes, lifestyle sneakers, formal footwear, and slides.',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Bags',
      slug: 'bags',
      description: 'Durable travel rucksacks, laptop backpacks, duffle bags, and luggage.',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Latest flagship smartphones, laptops, audio gear, and smart home appliances.',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const categoryMap = {};
  for (const cat of categoryDefinitions) {
    const [record] = await Category.findOrCreate({
      where: { slug: cat.slug },
      defaults: cat,
    });
    categoryMap[cat.name] = record;
    console.log(`  ✔ Category: ${cat.name} (ID: ${record.id})`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Seed Brands
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[3/4] Seeding Brands...');
  const brandDefinitions = [
    {
      name: 'Apple',
      slug: 'apple',
      description: 'Global innovator in personal technology, Mac, iPhone, and wearables.',
      logoUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Samsung',
      slug: 'samsung',
      description: 'Pioneering cutting-edge displays, Galaxy smartphones, and smart devices.',
      logoUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Sony',
      slug: 'sony',
      description: 'Industry standard audio excellence, cameras, and consumer entertainment.',
      logoUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Nike',
      slug: 'nike',
      description: 'World-leading athletic footwear, apparel, and performance innovation.',
      logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Adidas',
      slug: 'adidas',
      description: 'Iconic sports heritage, high-performance running shoes, and sportswear.',
      logoUrl: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Puma',
      slug: 'puma',
      description: 'Fast athletic gear, street style sneakers, and training lifestyle apparel.',
      logoUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: "Levi's",
      slug: 'levis',
      description: 'Timeless American denim craftsmanship, western shirts, and iconic jeans.',
      logoUrl: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Wildcraft',
      slug: 'wildcraft',
      description: 'Engineered outdoor gear, rugged backpacks, rucksacks, and travel bags.',
      logoUrl: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'American Tourister',
      slug: 'american-tourister',
      description: 'Durable, stylish luggage, hardside spinners, and daily commute backpacks.',
      logoUrl: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: "Nature's Best",
      slug: 'natures-best',
      description: 'Farm-fresh, naturally ripened hand-sorted fruits and organic harvest.',
      logoUrl: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb7?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'FreshFarm',
      slug: 'freshfarm',
      description: 'Direct-from-grower fresh agricultural produce, berries, and tropical fruits.',
      logoUrl: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=300&q=80',
    },
  ];

  const brandMap = {};
  for (const b of brandDefinitions) {
    const [record] = await Brand.findOrCreate({
      where: { slug: b.slug },
      defaults: b,
    });
    brandMap[b.name] = record;
    console.log(`  ✔ Brand: ${b.name} (ID: ${record.id})`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Seed Products (28 realistic items across 5 categories)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[4/4] Seeding 28 Products...');

  const productDefinitions = [
    // ── Fruits ──
    {
      name: 'Shimla Royal Delicious Apples (1 kg)',
      slug: 'shimla-royal-delicious-apples-1kg',
      category: 'Fruits',
      brand: "Nature's Best",
      price: 180.0,
      stock: 65,
      description: 'Crisp, aromatic red apples harvested directly from high-altitude Himachal Pradesh orchards. Packed with antioxidants and natural dietary fiber.',
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Nagpur Sweet Oranges (1 kg)',
      slug: 'nagpur-sweet-oranges-1kg',
      category: 'Fruits',
      brand: "Nature's Best",
      price: 95.0,
      stock: 80,
      description: 'Juicy, sun-ripened citrus oranges from Vidarbha. Perfect for fresh breakfast juice and high in immunity-boosting Vitamin C.',
      imageUrl: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Devgad Ratnagiri Alphonso Mangoes (Box of 6)',
      slug: 'devgad-alphonso-mangoes-box-6',
      category: 'Fruits',
      brand: 'FreshFarm',
      price: 850.0,
      stock: 25,
      description: 'GI-tagged authentic Alphonso mangoes celebrated worldwide for their saffron-gold pulp, rich aroma, and melt-in-mouth sweetness.',
      imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Robusta Golden Bananas (1 Dozen)',
      slug: 'robusta-golden-bananas-1-dozen',
      category: 'Fruits',
      brand: 'FreshFarm',
      price: 60.0,
      stock: 120,
      description: 'Naturally ripened nutrient-dense potassium-packed bananas. Instant energy booster for daily workouts and wholesome breakfast cereal.',
      imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Kashmir Sweet Dark Cherries (500g)',
      slug: 'kashmir-sweet-dark-cherries-500g',
      category: 'Fruits',
      brand: "Nature's Best",
      price: 320.0,
      stock: 0, // OUT OF STOCK TEST CASE
      description: 'Plump, glossy dark ruby cherries handpicked in the Kashmir valley. Packed with anthocyanins and delicate natural sweetness.',
      imageUrl: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },

    // ── Clothes ──
    {
      name: "Levi's 511 Slim Fit Stretch Jeans",
      slug: 'levis-511-slim-fit-stretch-jeans',
      category: 'Clothes',
      brand: "Levi's",
      price: 2799.0,
      stock: 30,
      description: 'A modern slim with room to move. Crafted from premium stretch denim with signature arcuate back pocket stitching.',
      imageUrl: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: "Levi's Barstow Western Denim Shirt",
      slug: 'levis-barstow-western-denim-shirt',
      category: 'Clothes',
      brand: "Levi's",
      price: 2199.0,
      stock: 22,
      description: 'Classic western details including curved yoke, pearl snap buttons, and durable indigo cotton twill that softens with every wash.',
      imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: "Nike Dri-FIT Legend Men's Training T-Shirt",
      slug: 'nike-dri-fit-legend-training-tshirt',
      category: 'Clothes',
      brand: 'Nike',
      price: 1495.0,
      stock: 50,
      description: 'Breathable moisture-wicking fabric with an anti-odor finish to keep you cool, dry, and focused during intensive gym sessions.',
      imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Adidas Originals Trefoil Classic Hoodie',
      slug: 'adidas-originals-trefoil-classic-hoodie',
      category: 'Clothes',
      brand: 'Adidas',
      price: 3999.0,
      stock: 18,
      description: 'Cozy heavyweight French terry fleece featuring an oversized contrast Trefoil logo, kangaroo pouch pocket, and ribbed cuffs.',
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Puma Clean Poly Tracksuit Set',
      slug: 'puma-clean-poly-tracksuit-set',
      category: 'Clothes',
      brand: 'Puma',
      price: 4299.0,
      stock: 15,
      description: 'Two-piece athletic tracksuit engineered with breathable polyester fabric, contrast side stripes, and athletic zip jacket.',
      imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },

    // ── Footwear ──
    {
      name: 'Nike Air Zoom Pegasus 40 Road Running Shoes',
      slug: 'nike-air-zoom-pegasus-40',
      category: 'Footwear',
      brand: 'Nike',
      price: 9995.0,
      stock: 24,
      description: 'Dual Zoom Air units deliver energized bounce and a customized responsive ride for long-distance marathoners and daily sprinters.',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Adidas Ultraboost Light Running Shoes',
      slug: 'adidas-ultraboost-light-shoes',
      category: 'Footwear',
      brand: 'Adidas',
      price: 13999.0,
      stock: 14,
      description: 'Lightest Boost midsole ever created. Continental Natural Rubber outsole provides extraordinary traction in wet and dry conditions.',
      imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Puma Smash V2 L Leather Low-Top Sneakers',
      slug: 'puma-smash-v2-l-leather-sneakers',
      category: 'Footwear',
      brand: 'Puma',
      price: 3499.0,
      stock: 40,
      description: 'Tennis-inspired classic silhouette made from soft leather with a supportive cushioned sockliner for all-day urban comfort.',
      imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: "Nike Court Vision Low Men's Sneakers",
      slug: 'nike-court-vision-low-sneakers',
      category: 'Footwear',
      brand: 'Nike',
      price: 4995.0,
      stock: 0, // OUT OF STOCK TEST CASE
      description: 'Fastbreak 80s basketball style meets modern streetwear. Premium stitched overlays and padded low-cut collar.',
      imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Adidas Adilette Comfort Athletic Slides',
      slug: 'adidas-adilette-comfort-slides',
      category: 'Footwear',
      brand: 'Adidas',
      price: 2299.0,
      stock: 45,
      description: 'Cloudfoam Plus contoured footbed cushions every post-swim stride with lightweight, pillow-soft luxury.',
      imageUrl: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },

    // ── Bags ──
    {
      name: 'Wildcraft Trailblazer 45L Adventure Rucksack',
      slug: 'wildcraft-trailblazer-45l-rucksack',
      category: 'Bags',
      brand: 'Wildcraft',
      price: 2899.0,
      stock: 20,
      description: 'Tough ripstop fabric with an ergonomic padded back panel, trekking pole loops, and integrated high-visibility rain cover.',
      imageUrl: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'American Tourister 32L Urban Groove Laptop Backpack',
      slug: 'american-tourister-urban-groove-laptop-backpack',
      category: 'Bags',
      brand: 'American Tourister',
      price: 1899.0,
      stock: 38,
      description: 'Padded compartment accommodates up to 15.6-inch laptops. Multiple accessory organizers and water-resistant polyester fabric.',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Wildcraft HypaShield Waterproof Travel Duffle (40L)',
      slug: 'wildcraft-hypashield-waterproof-duffle-40l',
      category: 'Bags',
      brand: 'Wildcraft',
      price: 1999.0,
      stock: 25,
      description: 'Rugged weekend duffle bag with reinforced bottom panel, dual haul handles, and removable padded shoulder strap.',
      imageUrl: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'American Tourister Linex Hardsided Spinner Trolley (66cm)',
      slug: 'american-tourister-linex-hardsided-spinner-66cm',
      category: 'Bags',
      brand: 'American Tourister',
      price: 5499.0,
      stock: 12,
      description: 'Scratch-resistant polypropylene shell, recessed 3-dial TSA combination lock, and smooth 360-degree double spinner wheels.',
      imageUrl: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Nike Heritage Unisex Gym Drawstring Sackpack',
      slug: 'nike-heritage-gym-drawstring-sackpack',
      category: 'Bags',
      brand: 'Nike',
      price: 1195.0,
      stock: 55,
      description: 'Lightweight, durable polyester bag with spacious main compartment and side zip pocket for phone and keys.',
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },

    // ── Electronics ──
    {
      name: 'Apple iPhone 15 (128GB - Black)',
      slug: 'apple-iphone-15-128gb-black',
      category: 'Electronics',
      brand: 'Apple',
      price: 71999.0,
      stock: 15,
      description: 'Dynamic Island, 48MP main camera with 2x Telephoto, durable color-infused glass, and aluminum design with USB-C connector.',
      imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Apple MacBook Air 13.6-inch M2 (8GB RAM, 256GB SSD)',
      slug: 'apple-macbook-air-m2-256gb',
      category: 'Electronics',
      brand: 'Apple',
      price: 89990.0,
      stock: 10,
      description: 'Strikingly thin design with up to 18 hours of battery life. Liquid Retina display, 1080p FaceTime HD camera, and MagSafe 3 charging.',
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Samsung Galaxy S24 Ultra 5G (Titanium Black, 256GB)',
      slug: 'samsung-galaxy-s24-ultra-5g',
      category: 'Electronics',
      brand: 'Samsung',
      price: 119999.0,
      stock: 8,
      description: 'Titanium exterior, built-in S Pen, 200MP Quad Telephoto camera with Galaxy AI assistance and bright 2600 nit AMOLED display.',
      imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
      slug: 'sony-wh-1000xm5-wireless-headphones',
      category: 'Electronics',
      brand: 'Sony',
      price: 26990.0,
      stock: 20,
      description: 'Industry-leading noise cancellation powered by two processors and 8 microphones. Up to 30 hours of battery life with quick charging.',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Apple AirPods Pro (2nd Generation with MagSafe Case)',
      slug: 'apple-airpods-pro-2nd-gen',
      category: 'Electronics',
      brand: 'Apple',
      price: 20990.0,
      stock: 25,
      description: 'Up to 2x more Active Noise Cancellation, Adaptive Audio, Transparency mode, and Personalized Spatial Audio with dynamic head tracking.',
      imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Samsung 55-inch Crystal 4K UHD Smart TV (2024)',
      slug: 'samsung-55-inch-crystal-4k-smart-tv',
      category: 'Electronics',
      brand: 'Samsung',
      price: 44990.0,
      stock: 6,
      description: 'Crystal Processor 4K, HDR10+, PurColor technology, and bezel-less design with seamless IoT SmartThings hub integration.',
      imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Sony HT-S20R 5.1ch Dolby Digital Soundbar (400W)',
      slug: 'sony-ht-s20r-5-1ch-soundbar',
      category: 'Electronics',
      brand: 'Sony',
      price: 17990.0,
      stock: 16,
      description: 'Real 5.1-channel discrete audio with wired rear speakers, dedicated external subwoofer, and Bluetooth wireless music streaming.',
      imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
      isActive: true,
    },
    {
      name: 'Sony Vintage Retro Stereo System (Archival)',
      slug: 'sony-vintage-retro-stereo-system',
      category: 'Electronics',
      brand: 'Sony',
      price: 6990.0,
      stock: 2,
      description: 'Archival heritage audio equipment collector edition. Kept in store catalog for historical reference.',
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
      isActive: false, // INACTIVE PRODUCT TEST CASE
    },
  ];

  let seededProductsCount = 0;
  for (const p of productDefinitions) {
    const categoryRecord = categoryMap[p.category];
    const brandRecord = brandMap[p.brand];

    if (!categoryRecord || !brandRecord) {
      console.warn(`  ⚠ Skipping ${p.name}: Missing Category or Brand record`);
      continue;
    }

    const [record, created] = await Product.findOrCreate({
      where: { slug: p.slug },
      defaults: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price.toFixed(2),
        stock: p.stock,
        categoryId: categoryRecord.id,
        brandId: brandRecord.id,
        imageUrl: p.imageUrl,
        isActive: p.isActive,
      },
    });

    if (created) {
      seededProductsCount++;
    }
  }

  console.log(`  ✔ Products processed: ${productDefinitions.length} (Newly seeded: ${seededProductsCount})`);

  console.log('\n====================================================');
  console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

// Execute seed if run directly
if (require.main === module) {
  runSeed()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ SEED ERROR:', err);
      process.exit(1);
    });
}

module.exports = runSeed;
