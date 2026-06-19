import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

export const getDBConnection = async () => {
  return SQLite.openDatabase({ name: 'smjsales.db', location: 'default' });
};

export const createTables = async (db: SQLite.SQLiteDatabase) => {
  const querySuperAdmin = `CREATE TABLE IF NOT EXISTS superadmin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );`;
  await db.executeSql(querySuperAdmin);

  const queryLeads = `CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    whatsapp_number TEXT,
    area TEXT NOT NULL,
    address TEXT,
    city TEXT,
    lead_status TEXT,
    product_interests TEXT,
    lead_source TEXT,
    visit_date TEXT,
    visit_notes TEXT,
    visit_outcome TEXT,
    next_followup_date TEXT,
    followup_notes TEXT,
    customer_requirements TEXT,
    special_remarks TEXT,
    shop_photo_uri TEXT,
    business_card_photo_uri TEXT,
    map_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`;
  await db.executeSql(queryLeads);

  const queryCategories = `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`;
  await db.executeSql(queryCategories);

  const querySubCategories = `CREATE TABLE IF NOT EXISTS sub_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
  );`;
  await db.executeSql(querySubCategories);

  const queryProducts = `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    sub_category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price TEXT,
    image_uri TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
    FOREIGN KEY (sub_category_id) REFERENCES sub_categories (id) ON DELETE CASCADE
  );`;
  await db.executeSql(queryProducts);

  // Settings table for tracking seed versions and app flags
  const querySettings = `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`;
  await db.executeSql(querySettings);

  const queryCustomerOrders = `CREATE TABLE IF NOT EXISTS customer_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    order_unit TEXT NOT NULL DEFAULT 'piece',
    quantity REAL NOT NULL DEFAULT 0,
    net_value REAL NOT NULL DEFAULT 0,
    amount_paid REAL NOT NULL DEFAULT 0,
    pending_amount REAL NOT NULL DEFAULT 0,
    next_due_date TEXT,
    order_date TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES leads (id) ON DELETE CASCADE
  );`;
  await db.executeSql(queryCustomerOrders);

  const queryOrderPayments = `CREATE TABLE IF NOT EXISTS order_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    amount_paid REAL NOT NULL DEFAULT 0,
    payment_date TEXT NOT NULL,
    next_due_date TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES customer_orders (id) ON DELETE CASCADE
  );`;
  await db.executeSql(queryOrderPayments);
};

// Safe migration: adds next_due_date to customer_orders if it doesn't exist yet
export const migrateOrderPaymentsSchema = async (db: SQLite.SQLiteDatabase) => {
  try {
    await db.executeSql(`ALTER TABLE customer_orders ADD COLUMN next_due_date TEXT`);
    console.log('[DB MIGRATE] Added next_due_date to customer_orders.');
  } catch {
    // Column already exists — safe to ignore
  }
};

export const initSuperAdmin = async (db: SQLite.SQLiteDatabase) => {
  const checkQuery = `SELECT * FROM superadmin WHERE user_id = 'SMJ-SALES'`;
  const [results] = await db.executeSql(checkQuery);

  if (results.rows.length === 0) {
    const userId = 'SMJ-SALES';
    const password = 'SMJ-SALES2026';
    const insertQuery = `INSERT INTO superadmin (user_id, password) VALUES (?, ?)`;
    await db.executeSql(insertQuery, [userId, password]);

    // Console log for every data saved in the DB SQLite as requested
    console.log(`[DB SAVE] Inserted new record into 'superadmin' table: { user_id: '${userId}', password: '${password}' }`);
    console.log('Superadmin user initialized.');
  }
};

export const seedDummyLeads = async (db: SQLite.SQLiteDatabase) => {
  // Use a version flag so seed runs exactly once, even on an existing DB
  const SEED_VERSION = 'dummy_leads_v1';
  const [flagCheck] = await db.executeSql(
    `SELECT value FROM app_settings WHERE key = ?`,
    [SEED_VERSION]
  );
  if (flagCheck.rows.length > 0) {
    console.log('[DB SEED] Dummy leads already seeded — skipping.');
    return;
  }

  const dummyLeads = [
    {
      shop_name: 'Radha Jewellers',
      owner_name: 'Ramesh Patel',
      mobile_number: '9876543210',
      whatsapp_number: '9876543210',
      area: 'Lal Darwaja',
      address: '12, Silver Street, Lal Darwaja',
      city: 'Surat',
      lead_status: 'Lead',
      product_interests: JSON.stringify(['Silver Anklets', 'Retail']),
      lead_source: 'Direct Visit',
      visit_date: '2026-06-01',
      visit_notes: 'Owner was interested in silver anklets. Showed catalogue.',
      visit_outcome: 'Interested',
      next_followup_date: '2026-06-20',
      followup_notes: 'Call to confirm order details.',
      customer_requirements: 'Needs 50 pairs of anklets, size 9–10.',
      special_remarks: 'Prefers morning visits.',
      shop_photo_uri: '',
      business_card_photo_uri: '',
      map_url: 'https://maps.app.goo.gl/dummy1',
    },
    {
      shop_name: 'Shri Krishna Silver',
      owner_name: 'Mahesh Sharma',
      mobile_number: '9123456780',
      whatsapp_number: '9123456780',
      area: 'Ring Road',
      address: '45, Jewel Plaza, Ring Road',
      city: 'Rajkot',
      lead_status: 'Interested',
      product_interests: JSON.stringify(['Premium Designs', 'Wholesale']),
      lead_source: 'Reference',
      visit_date: '2026-05-28',
      visit_notes: 'Referred by Ramesh Patel. Looking for premium wholesale collection.',
      visit_outcome: 'Order Expected',
      next_followup_date: '2026-06-22',
      followup_notes: 'Send price list before follow-up.',
      customer_requirements: 'Wants exclusive premium designs, minimum 100 pcs.',
      special_remarks: 'High-value potential buyer.',
      shop_photo_uri: '',
      business_card_photo_uri: '',
      map_url: 'https://maps.app.goo.gl/dummy2',
    },
    {
      shop_name: 'Anand Silver House',
      owner_name: 'Priya Desai',
      mobile_number: '9988776655',
      whatsapp_number: '9988776655',
      area: 'Citylight',
      address: '7, Sunrise Complex, Citylight Road',
      city: 'Surat',
      lead_status: 'Sample Given',
      product_interests: JSON.stringify(['Kids Collection']),
      lead_source: 'Social Media',
      visit_date: '2026-06-05',
      visit_notes: 'Gave kids anklets samples. Owner liked the finish.',
      visit_outcome: 'Need Follow-up',
      next_followup_date: '2026-06-25',
      followup_notes: 'Check feedback on samples and push for order.',
      customer_requirements: 'Requires kids-sized anklets in bulk.',
      special_remarks: 'Active on Instagram — tag in next campaign.',
      shop_photo_uri: '',
      business_card_photo_uri: '',
      map_url: 'https://maps.app.goo.gl/dummy3',
    },
    {
      shop_name: 'Meera Ornaments',
      owner_name: 'Suresh Mehta',
      mobile_number: '9765432198',
      whatsapp_number: '',
      area: 'Varachha',
      address: '33, Diamond Chowk, Varachha',
      city: 'Surat',
      lead_status: 'Negotiation',
      product_interests: JSON.stringify(['Silver Anklets', 'Wholesale']),
      lead_source: 'Walk-in',
      visit_date: '2026-06-10',
      visit_notes: 'Walk-in customer. Negotiating on bulk price.',
      visit_outcome: 'Interested',
      next_followup_date: '2026-06-28',
      followup_notes: 'Finalize rate card and confirm quantities.',
      customer_requirements: '200+ pairs at discounted wholesale rate.',
      special_remarks: 'Needs GST invoice.',
      shop_photo_uri: '',
      business_card_photo_uri: '',
      map_url: 'https://maps.app.goo.gl/dummy4',
    },
    {
      shop_name: 'Golden Touch Jewellers',
      owner_name: 'Kavita Joshi',
      mobile_number: '9554433221',
      whatsapp_number: '9554433221',
      area: 'Adajan',
      address: '5, Pearl Centre, Adajan Patiya',
      city: 'Surat',
      lead_status: 'Customer',
      product_interests: JSON.stringify(['Premium Designs', 'Retail', 'Silver Anklets']),
      lead_source: 'Existing Customer',
      visit_date: '2026-05-15',
      visit_notes: 'Regular customer, reordering premium designs.',
      visit_outcome: 'Order Expected',
      next_followup_date: '2026-07-01',
      followup_notes: 'Delivery confirmation and next order planning.',
      customer_requirements: 'Premium retail display stock refresh.',
      special_remarks: 'Pays on time. Good relationship.',
      shop_photo_uri: '',
      business_card_photo_uri: '',
      map_url: 'https://maps.app.goo.gl/dummy5',
    },
    {
      shop_name: 'Nav Durga Jwellers',
      owner_name: 'Dinesh Trivedi',
      mobile_number: '9001122334',
      whatsapp_number: '9001122334',
      area: 'Nanpura',
      address: '22, Tulsi Chowk, Nanpura',
      city: 'Surat',
      lead_status: 'Lost',
      product_interests: JSON.stringify(['Wholesale']),
      lead_source: 'Direct Visit',
      visit_date: '2026-04-20',
      visit_notes: 'Not interested in current pricing. Went with competitor.',
      visit_outcome: 'Not Interested',
      next_followup_date: '2026-07-20',
      followup_notes: 'Revisit after 3 months with updated pricing.',
      customer_requirements: 'Looking for very low wholesale price.',
      special_remarks: 'Price-sensitive buyer. Keep on radar.',
      shop_photo_uri: '',
      business_card_photo_uri: '',
      map_url: 'https://maps.app.goo.gl/dummy6',
    },
    {
      shop_name: 'Bhagyalaxmi Silver',
      owner_name: 'Neeta Shah',
      mobile_number: '9823344556',
      whatsapp_number: '9823344556',
      area: 'Katargam',
      address: '8, Hira Complex, Katargam',
      city: 'Surat',
      lead_status: 'Interested',
      product_interests: JSON.stringify(['Kids Collection', 'Silver Anklets']),
      lead_source: 'Reference',
      visit_date: '2026-06-12',
      visit_notes: 'Met owner at trade fair. Interested in kids and anklet range.',
      visit_outcome: 'Need Follow-up',
      next_followup_date: '2026-06-30',
      followup_notes: 'Share catalogue PDF on WhatsApp.',
      customer_requirements: 'Wants new season designs.',
      special_remarks: 'Prefers WhatsApp communication.',
      shop_photo_uri: '',
      business_card_photo_uri: '',
      map_url: 'https://maps.app.goo.gl/dummy7',
    },
    {
      shop_name: 'Jyoti Jewels',
      owner_name: 'Anil Kothari',
      mobile_number: '9712233445',
      whatsapp_number: '',
      area: 'MG Road',
      address: '101, Heera Plaza, MG Road',
      city: 'Vadodara',
      lead_status: 'Lead',
      product_interests: JSON.stringify(['Retail', 'Premium Designs']),
      lead_source: 'Social Media',
      visit_date: '2026-06-08',
      visit_notes: 'Found via Instagram DM. Scheduled first visit.',
      visit_outcome: 'Interested',
      next_followup_date: '2026-06-26',
      followup_notes: 'Follow up after reviewing shared catalogue.',
      customer_requirements: 'Retail display stock for festival season.',
      special_remarks: 'Navratri season requirement expected.',
      shop_photo_uri: '',
      business_card_photo_uri: '',
      map_url: 'https://maps.app.goo.gl/dummy8',
    },
    {
      shop_name: 'Laxmi Bhandar',
      owner_name: 'Harsha Prajapati',
      mobile_number: '9667788990',
      whatsapp_number: '9667788990',
      area: 'Bardoli',
      address: '3, Market Yard, Bardoli',
      city: 'Bardoli',
      lead_status: 'Sample Given',
      product_interests: JSON.stringify(['Silver Anklets', 'Kids Collection', 'Wholesale']),
      lead_source: 'Direct Visit',
      visit_date: '2026-06-14',
      visit_notes: 'Given sample set. Owner showed good interest in bulk buying.',
      visit_outcome: 'Order Expected',
      next_followup_date: '2026-06-29',
      followup_notes: 'Confirm order quantity after samples review.',
      customer_requirements: 'Bulk mixed set — anklets + kids collection.',
      special_remarks: 'Small town — price point critical.',
      shop_photo_uri: '',
      business_card_photo_uri: '',
      map_url: 'https://maps.app.goo.gl/dummy9',
    },
    {
      shop_name: 'Chamunda Silver Arts',
      owner_name: 'Bhavna Trivedi',
      mobile_number: '9545566778',
      whatsapp_number: '9545566778',
      area: 'Piplod',
      address: '19, Sunrise Arcade, Piplod',
      city: 'Surat',
      lead_status: 'Negotiation',
      product_interests: JSON.stringify(['Premium Designs', 'Wholesale', 'Silver Anklets']),
      lead_source: 'Existing Customer',
      visit_date: '2026-06-16',
      visit_notes: 'Re-engaged old customer for new premium wholesale deal.',
      visit_outcome: 'Order Expected',
      next_followup_date: '2026-07-05',
      followup_notes: 'Send final price quote with GST breakup.',
      customer_requirements: 'Wants 300 pcs mixed premium + anklets.',
      special_remarks: 'Potential for long-term partnership.',
      shop_photo_uri: '',
      business_card_photo_uri: '',
      map_url: 'https://maps.app.goo.gl/dummy10',
    },
  ];

  const query = `
    INSERT INTO leads (
      shop_name, owner_name, mobile_number, whatsapp_number, area, address, city,
      lead_status, product_interests, lead_source, visit_date, visit_notes,
      visit_outcome, next_followup_date, followup_notes, customer_requirements,
      special_remarks, shop_photo_uri, business_card_photo_uri, map_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (const lead of dummyLeads) {
    const params = [
      lead.shop_name, lead.owner_name, lead.mobile_number, lead.whatsapp_number,
      lead.area, lead.address, lead.city, lead.lead_status, lead.product_interests,
      lead.lead_source, lead.visit_date, lead.visit_notes, lead.visit_outcome,
      lead.next_followup_date, lead.followup_notes, lead.customer_requirements,
      lead.special_remarks, lead.shop_photo_uri, lead.business_card_photo_uri, lead.map_url,
    ];
    await db.executeSql(query, params);
    console.log(`[DB SEED] Inserted dummy lead: ${lead.shop_name}`);
  }

  // Mark seed as done so it never runs again
  await db.executeSql(
    `INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)`,
    [SEED_VERSION, 'done']
  );
  console.log('[DB SEED] ✅ 10 dummy leads seeded successfully.');
};

export const initDatabase = async () => {
  try {
    const db = await getDBConnection();
    await createTables(db);
    await migrateOrderPaymentsSchema(db);
    await initSuperAdmin(db);
    await seedDummyLeads(db);
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

export const insertLead = async (leadData: any) => {
  const db = await getDBConnection();
  const query = `
    INSERT INTO leads (
      shop_name, owner_name, mobile_number, whatsapp_number, area, address, city, 
      lead_status, product_interests, lead_source, visit_date, visit_notes, 
      visit_outcome, next_followup_date, followup_notes, customer_requirements, 
      special_remarks, shop_photo_uri, business_card_photo_uri, map_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    leadData.shop_name, leadData.owner_name, leadData.mobile_number, leadData.whatsapp_number, leadData.area, leadData.address, leadData.city,
    leadData.lead_status, leadData.product_interests, leadData.lead_source, leadData.visit_date, leadData.visit_notes,
    leadData.visit_outcome, leadData.next_followup_date, leadData.followup_notes, leadData.customer_requirements,
    leadData.special_remarks, leadData.shop_photo_uri, leadData.business_card_photo_uri, leadData.map_url
  ];

  await db.executeSql(query, params);
  console.log(`[DB SAVE] Inserted new record into 'leads' table:`, leadData);

  // Fetch and log all data stored in the DB SQLite
  const [allResults] = await db.executeSql(`SELECT * FROM leads ORDER BY created_at DESC`);
  let allLeads = [];
  for (let i = 0; i < allResults.rows.length; i++) {
    allLeads.push(allResults.rows.item(i));
  }
  console.log('=== ALL LEADS CURRENTLY IN DB ===', JSON.stringify(allLeads, null, 2));
};

export const getLeads = async () => {
  const db = await getDBConnection();
  const [results] = await db.executeSql(`SELECT * FROM leads ORDER BY created_at DESC`);

  let leads = [];
  for (let i = 0; i < results.rows.length; i++) {
    leads.push(results.rows.item(i));
  }
  return leads;
};

export const deleteLead = async (id: number) => {
  const db = await getDBConnection();
  await db.executeSql(`DELETE FROM leads WHERE id = ?`, [id]);
  console.log(`[DB SAVE] Deleted record from 'leads' table with id:`, id);
};

export const updateLead = async (id: number, leadData: any) => {
  const db = await getDBConnection();
  const query = `
    UPDATE leads SET 
      shop_name = ?, owner_name = ?, mobile_number = ?, whatsapp_number = ?, area = ?, address = ?, city = ?, 
      lead_status = ?, product_interests = ?, lead_source = ?, visit_date = ?, visit_notes = ?, 
      visit_outcome = ?, next_followup_date = ?, followup_notes = ?, customer_requirements = ?, 
      special_remarks = ?, shop_photo_uri = ?, business_card_photo_uri = ?, map_url = ?
    WHERE id = ?
  `;
  const params = [
    leadData.shop_name, leadData.owner_name, leadData.mobile_number, leadData.whatsapp_number, leadData.area, leadData.address, leadData.city,
    leadData.lead_status, leadData.product_interests, leadData.lead_source, leadData.visit_date, leadData.visit_notes,
    leadData.visit_outcome, leadData.next_followup_date, leadData.followup_notes, leadData.customer_requirements,
    leadData.special_remarks, leadData.shop_photo_uri, leadData.business_card_photo_uri, leadData.map_url, id
  ];

  await db.executeSql(query, params);
  console.log(`[DB SAVE] Updated record in 'leads' table with id:`, id);
};

// --- Catalog Methods ---

export const addCategory = async (name: string) => {
  const db = await getDBConnection();
  const query = `INSERT INTO categories (name) VALUES (?)`;
  await db.executeSql(query, [name]);
  console.log(`[DB SAVE] Inserted new category:`, name);
};

export const getCategories = async () => {
  const db = await getDBConnection();
  const [results] = await db.executeSql(`SELECT * FROM categories ORDER BY created_at DESC`);
  let categories = [];
  for (let i = 0; i < results.rows.length; i++) {
    categories.push(results.rows.item(i));
  }
  return categories;
};

export const addSubCategory = async (categoryId: number, name: string) => {
  const db = await getDBConnection();
  const query = `INSERT INTO sub_categories (category_id, name) VALUES (?, ?)`;
  await db.executeSql(query, [categoryId, name]);
  console.log(`[DB SAVE] Inserted new sub_category:`, name);
};

export const getSubCategories = async (categoryId: number) => {
  const db = await getDBConnection();
  const [results] = await db.executeSql(`SELECT * FROM sub_categories WHERE category_id = ? ORDER BY created_at DESC`, [categoryId]);
  let subCategories = [];
  for (let i = 0; i < results.rows.length; i++) {
    subCategories.push(results.rows.item(i));
  }
  return subCategories;
};

export const addProduct = async (productData: any) => {
  const db = await getDBConnection();
  const query = `
    INSERT INTO products (category_id, sub_category_id, name, description, price, image_uri) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [
    productData.category_id, productData.sub_category_id, productData.name, 
    productData.description, productData.price, productData.image_uri
  ];
  await db.executeSql(query, params);
  console.log(`[DB SAVE] Inserted new product:`, productData.name);
};

export const getProducts = async (subCategoryId: number) => {
  const db = await getDBConnection();
  const [results] = await db.executeSql(`SELECT * FROM products WHERE sub_category_id = ? ORDER BY created_at DESC`, [subCategoryId]);
  let products = [];
  for (let i = 0; i < results.rows.length; i++) {
    products.push(results.rows.item(i));
  }
  return products;
};

export const updateProduct = async (id: number, productData: any) => {
  const db = await getDBConnection();
  const query = `
    UPDATE products SET
      name = ?, description = ?, price = ?, image_uri = ?
    WHERE id = ?
  `;
  await db.executeSql(query, [
    productData.name, productData.description, productData.price, productData.image_uri, id
  ]);
  console.log(`[DB SAVE] Updated product with id:`, id);
};

export const deleteProduct = async (id: number) => {
  const db = await getDBConnection();
  await db.executeSql(`DELETE FROM products WHERE id = ?`, [id]);
  console.log(`[DB SAVE] Deleted product with id:`, id);
};

// --- Customer Orders Methods ---

export const addCustomerOrder = async (orderData: {
  customer_id: number;
  category: string;
  order_unit: string;
  quantity: number;
  net_value: number;
  amount_paid: number;
  pending_amount: number;
  order_date: string;
  notes?: string;
}) => {
  const db = await getDBConnection();
  const query = `
    INSERT INTO customer_orders
      (customer_id, category, order_unit, quantity, net_value, amount_paid, pending_amount, order_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await db.executeSql(query, [
    orderData.customer_id,
    orderData.category,
    orderData.order_unit,
    orderData.quantity,
    orderData.net_value,
    orderData.amount_paid,
    orderData.pending_amount,
    orderData.order_date,
    orderData.notes || '',
  ]);
  console.log(`[DB SAVE] Inserted customer_order for customer_id: ${orderData.customer_id}`);
};

export const getCustomerOrders = async (customerId: number) => {
  const db = await getDBConnection();
  const [results] = await db.executeSql(
    `SELECT * FROM customer_orders WHERE customer_id = ? ORDER BY order_date DESC, created_at DESC`,
    [customerId]
  );
  const orders = [];
  for (let i = 0; i < results.rows.length; i++) {
    orders.push(results.rows.item(i));
  }
  return orders;
};

export const deleteCustomerOrder = async (id: number) => {
  const db = await getDBConnection();
  await db.executeSql(`DELETE FROM customer_orders WHERE id = ?`, [id]);
  console.log(`[DB SAVE] Deleted customer_order with id:`, id);
};

export const getCustomerOrderSummary = async (customerId: number) => {
  const db = await getDBConnection();
  const [results] = await db.executeSql(
    `SELECT
       COUNT(*) as total_orders,
       COALESCE(SUM(net_value), 0) as total_value,
       COALESCE(SUM(amount_paid), 0) as total_paid,
       COALESCE(SUM(pending_amount), 0) as total_pending
     FROM customer_orders WHERE customer_id = ?`,
    [customerId]
  );
  if (results.rows.length > 0) {
    return results.rows.item(0);
  }
  return { total_orders: 0, total_value: 0, total_paid: 0, total_pending: 0 };
};

// ─── Order Payment (Instalments) Methods ───────────────────────────────────

// Internal helper: re-sum payments and update customer_orders row
const recalcOrderTotals = async (
  db: SQLite.SQLiteDatabase,
  orderId: number,
  nextDueDate?: string
) => {
  const [sumRes] = await db.executeSql(
    `SELECT COALESCE(SUM(amount_paid), 0) as total_paid FROM order_payments WHERE order_id = ?`,
    [orderId]
  );
  const totalPaid = sumRes.rows.item(0).total_paid;

  const [orderRes] = await db.executeSql(
    `SELECT net_value FROM customer_orders WHERE id = ?`,
    [orderId]
  );
  const netValue = orderRes.rows.item(0)?.net_value ?? 0;
  const pendingAmount = Math.max(0, netValue - totalPaid);

  if (nextDueDate !== undefined) {
    await db.executeSql(
      `UPDATE customer_orders SET amount_paid = ?, pending_amount = ?, next_due_date = ? WHERE id = ?`,
      [totalPaid, pendingAmount, pendingAmount <= 0 ? null : nextDueDate, orderId]
    );
  } else {
    // When deleting a payment, recalculate next_due_date from remaining payments
    const [latestDue] = await db.executeSql(
      `SELECT next_due_date FROM order_payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`,
      [orderId]
    );
    const latestNextDue = latestDue.rows.length > 0 ? latestDue.rows.item(0).next_due_date : null;
    await db.executeSql(
      `UPDATE customer_orders SET amount_paid = ?, pending_amount = ?, next_due_date = ? WHERE id = ?`,
      [totalPaid, pendingAmount, pendingAmount <= 0 ? null : latestNextDue, orderId]
    );
  }
  console.log(`[DB] Recalculated order ${orderId}: paid=${totalPaid}, pending=${pendingAmount}`);
};

export const addOrderPayment = async (data: {
  order_id: number;
  amount_paid: number;
  payment_date: string;
  next_due_date?: string;
  notes?: string;
}) => {
  const db = await getDBConnection();
  await db.executeSql(
    `INSERT INTO order_payments (order_id, amount_paid, payment_date, next_due_date, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.order_id,
      data.amount_paid,
      data.payment_date,
      data.next_due_date || null,
      data.notes || '',
    ]
  );
  await recalcOrderTotals(db, data.order_id, data.next_due_date);
  console.log(`[DB SAVE] Inserted payment for order_id: ${data.order_id}`);
};

export const getOrderPayments = async (orderId: number) => {
  const db = await getDBConnection();
  const [results] = await db.executeSql(
    `SELECT * FROM order_payments WHERE order_id = ? ORDER BY payment_date ASC, created_at ASC`,
    [orderId]
  );
  const payments = [];
  for (let i = 0; i < results.rows.length; i++) {
    payments.push(results.rows.item(i));
  }
  return payments;
};

export const deleteOrderPayment = async (paymentId: number, orderId: number) => {
  const db = await getDBConnection();
  await db.executeSql(`DELETE FROM order_payments WHERE id = ?`, [paymentId]);
  await recalcOrderTotals(db, orderId);
  console.log(`[DB SAVE] Deleted payment id: ${paymentId}, recalculated order: ${orderId}`);
};
