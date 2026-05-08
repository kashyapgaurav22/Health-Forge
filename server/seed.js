const pool = require('./config/db');

const createTables = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      image_url VARCHAR(500),
      category_id INTEGER REFERENCES categories(id),
      stock INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 1,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      total_amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      razorpay_order_id VARCHAR(255),
      razorpay_payment_id VARCHAR(255),
      razorpay_signature VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price DECIMAL(10, 2) NOT NULL
    );
  `;
  await pool.query(query);
  console.log('✅ Tables created successfully');
};

const seedCategories = async () => {
  const categories = [
    { name: 'Scalpels & Blades', slug: 'scalpels-blades' },
    { name: 'Forceps & Clamps', slug: 'forceps-clamps' },
    { name: 'Scissors & Shears', slug: 'scissors-shears' },
    { name: 'Sutures & Needles', slug: 'sutures-needles' },
    { name: 'Retractors', slug: 'retractors' },
    { name: 'Diagnostic Instruments', slug: 'diagnostic-instruments' },
    { name: 'PPE & Disposables', slug: 'ppe-disposables' },
  ];

  for (const cat of categories) {
    await pool.query(
      'INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING',
      [cat.name, cat.slug]
    );
  }
  console.log('✅ Categories seeded');
};

const seedProducts = async () => {
  const products = [
    // Scalpels & Blades
    {
      name: 'Premium Surgical Scalpel Handle #3',
      description: 'Precision-crafted stainless steel scalpel handle, size #3. Compatible with blades #10, #11, #12, #15. Ergonomic grip with anti-slip finish. Autoclavable and reusable.',
      price: 450.00,
      image_url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500',
      category_slug: 'scalpels-blades',
      stock: 150,
    },
    {
      name: 'Carbon Steel Surgical Blades #10 (Box of 100)',
      description: 'Ultra-sharp carbon steel blades, size #10. Individually foil-wrapped and sterile. Ideal for general surgical incisions. CE and ISO certified.',
      price: 1200.00,
      image_url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500',
      category_slug: 'scalpels-blades',
      stock: 300,
    },
    {
      name: 'Disposable Safety Scalpel #15',
      description: 'Single-use safety scalpel with retractable blade mechanism. Reduces risk of sharps injuries. Sterile, individually packed. Box of 10.',
      price: 850.00,
      image_url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=500',
      category_slug: 'scalpels-blades',
      stock: 200,
    },
    // Forceps & Clamps
    {
      name: 'Kelly Hemostatic Forceps 14cm',
      description: 'Straight Kelly forceps with serrated jaws. Medical-grade stainless steel. Used for clamping blood vessels during surgery. Ratchet lock mechanism.',
      price: 780.00,
      image_url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=500',
      category_slug: 'forceps-clamps',
      stock: 120,
    },
    {
      name: 'Adson Tissue Forceps 12cm',
      description: 'Delicate Adson forceps with 1x2 teeth. Perfect for grasping fine tissue during plastic and reconstructive surgery. Mirror-finish stainless steel.',
      price: 650.00,
      image_url: 'https://images.unsplash.com/photo-1582719471384-894fbb16f461?w=500',
      category_slug: 'forceps-clamps',
      stock: 95,
    },
    {
      name: 'Allis Tissue Clamp 15cm',
      description: 'Heavy-duty Allis tissue clamp with 4x5 interlocking teeth. Box-lock joint for stability. Ideal for grasping fascia and other tough tissues.',
      price: 920.00,
      image_url: 'https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=500',
      category_slug: 'forceps-clamps',
      stock: 80,
    },
    // Scissors & Shears
    {
      name: 'Mayo Dissecting Scissors 17cm Curved',
      description: 'Curved Mayo scissors for cutting heavy fascia, sutures, and tough tissue. Beveled blades with precision sharpening. Fully autoclavable.',
      price: 890.00,
      image_url: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=500',
      category_slug: 'scissors-shears',
      stock: 110,
    },
    {
      name: 'Metzenbaum Scissors 18cm Fine',
      description: 'Delicate Metzenbaum scissors for fine tissue dissection. Long shanks and short blades for precise cutting in deep cavities.',
      price: 1050.00,
      image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500',
      category_slug: 'scissors-shears',
      stock: 75,
    },
    {
      name: 'Bandage Scissors Lister 18cm',
      description: 'Angled Lister bandage scissors with blunt tip for safe bandage removal. Probe-pointed lower blade slides under dressings without skin contact.',
      price: 380.00,
      image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500',
      category_slug: 'scissors-shears',
      stock: 200,
    },
    // Sutures & Needles
    {
      name: 'Absorbable Polyglycolic Acid Sutures 3-0 (Box of 12)',
      description: 'Braided absorbable sutures with excellent knot security. 70cm length with 26mm reverse cutting needle. 56-70 day absorption profile.',
      price: 1800.00,
      image_url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500',
      category_slug: 'sutures-needles',
      stock: 250,
    },
    {
      name: 'Silk Braided Sutures 2-0 (Box of 12)',
      description: 'Non-absorbable black braided silk sutures. Superior handling and knot-tying. 75cm length with 30mm taper point needle.',
      price: 1450.00,
      image_url: 'https://images.unsplash.com/photo-1551190822-a9ce113d0d20?w=500',
      category_slug: 'sutures-needles',
      stock: 180,
    },
    {
      name: 'Atraumatic Suture Needles Assorted (Box of 50)',
      description: 'Swaged-on needles in assorted sizes (round body, cutting, reverse cutting). Pre-sterilized. For general, orthopaedic, and plastic surgery.',
      price: 2200.00,
      image_url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500',
      category_slug: 'sutures-needles',
      stock: 100,
    },
    // Retractors
    {
      name: 'Army-Navy Retractor Double Ended',
      description: 'Versatile double-ended retractor for superficial tissue retraction. Smooth blades for atraumatic tissue handling. 21cm length.',
      price: 720.00,
      image_url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=500',
      category_slug: 'retractors',
      stock: 60,
    },
    {
      name: 'Weitlaner Self-Retaining Retractor 16cm',
      description: 'Self-retaining retractor with 3x4 sharp prongs. Ratchet mechanism holds tissue in place without assistant. Ideal for small to medium incisions.',
      price: 1650.00,
      image_url: 'https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=500',
      category_slug: 'retractors',
      stock: 45,
    },
    {
      name: 'Deaver Retractor 30cm Large',
      description: 'Large Deaver retractor for deep abdominal surgery. Smooth, rounded blade with comfortable handle. Essential for laparotomy procedures.',
      price: 1400.00,
      image_url: 'https://images.unsplash.com/photo-1582719471384-894fbb16f461?w=500',
      category_slug: 'retractors',
      stock: 35,
    },
    // Diagnostic Instruments
    {
      name: 'Professional Stethoscope Cardiology III',
      description: 'Dual-head cardiology stethoscope with tunable diaphragm. Stainless steel chestpiece, anatomically designed headset. Acoustic seal ear tips.',
      price: 4500.00,
      image_url: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=500',
      category_slug: 'diagnostic-instruments',
      stock: 200,
    },
    {
      name: 'LED Diagnostic Penlight (Pack of 6)',
      description: 'Compact LED penlights for pupil assessment and oral examination. Bright white LED, pupil gauge printed on barrel. Disposable.',
      price: 350.00,
      image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500',
      category_slug: 'diagnostic-instruments',
      stock: 500,
    },
    {
      name: 'Digital Infrared Thermometer',
      description: 'Non-contact infrared forehead thermometer. Instant reading in 1 second. Fever alarm, memory storage for 32 readings. Medical-grade accuracy.',
      price: 1800.00,
      image_url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500',
      category_slug: 'diagnostic-instruments',
      stock: 300,
    },
    // PPE & Disposables
    {
      name: 'Nitrile Examination Gloves (Box of 100)',
      description: 'Powder-free nitrile gloves in medium size. Textured fingertips for secure grip. Latex-free for allergy-sensitive environments.',
      price: 680.00,
      image_url: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=500',
      category_slug: 'ppe-disposables',
      stock: 1000,
    },
    {
      name: '3-Ply Surgical Face Masks (Box of 50)',
      description: 'Type IIR surgical face masks with >98% bacterial filtration efficiency. Fluid-resistant outer layer. Adjustable nose clip. CE certified.',
      price: 320.00,
      image_url: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=500',
      category_slug: 'ppe-disposables',
      stock: 2000,
    },
    {
      name: 'Disposable Surgical Gown (Pack of 10)',
      description: 'AAMI Level 3 disposable surgical gowns. Full back coverage with knit cuffs. Fluid-resistant, breathable SMS fabric. Sterile.',
      price: 1500.00,
      image_url: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=500',
      category_slug: 'ppe-disposables',
      stock: 400,
    },
  ];

  for (const prod of products) {
    const catResult = await pool.query('SELECT id FROM categories WHERE slug = $1', [prod.category_slug]);
    if (catResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO products (name, description, price, image_url, category_id, stock)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [prod.name, prod.description, prod.price, prod.image_url, catResult.rows[0].id, prod.stock]
      );
    }
  }
  console.log('✅ Products seeded (21 items)');
};

const seed = async () => {
  try {
    await createTables();
    await seedCategories();
    await seedProducts();
    console.log('\n🏥 Health Forge database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
