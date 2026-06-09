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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`;
  await db.executeSql(queryLeads);
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

export const initDatabase = async () => {
  try {
    const db = await getDBConnection();
    await createTables(db);
    await initSuperAdmin(db);
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
      special_remarks, shop_photo_uri, business_card_photo_uri
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    leadData.shop_name, leadData.owner_name, leadData.mobile_number, leadData.whatsapp_number, leadData.area, leadData.address, leadData.city,
    leadData.lead_status, leadData.product_interests, leadData.lead_source, leadData.visit_date, leadData.visit_notes,
    leadData.visit_outcome, leadData.next_followup_date, leadData.followup_notes, leadData.customer_requirements,
    leadData.special_remarks, leadData.shop_photo_uri, leadData.business_card_photo_uri
  ];
  
  await db.executeSql(query, params);
  console.log(`[DB SAVE] Inserted new record into 'leads' table:`, leadData);
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
