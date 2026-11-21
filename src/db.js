const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbFile = process.env.DB_FILE || './data/campusnest.sqlite';
const absolute = path.resolve(process.cwd(), dbFile);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
const db = new Database(absolute);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 phone TEXT, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('landlord','tenant')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS units (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, building TEXT, rent INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'vacant' CHECK(status IN ('vacant','occupied','reserved','maintenance')),
 description TEXT, tenant_id TEXT REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS applications (
 id TEXT PRIMARY KEY, applicant_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT,
 unit_id TEXT REFERENCES units(id), course TEXT, institution TEXT, move_in_date TEXT,
 notes TEXT, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 reviewed_by TEXT REFERENCES users(id), reviewed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payments (
 id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES users(id), unit_id TEXT REFERENCES units(id),
 amount INTEGER NOT NULL CHECK(amount > 0), currency TEXT NOT NULL DEFAULT 'KES',
 method TEXT NOT NULL DEFAULT 'manual', reference TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'paid' CHECK(status IN ('pending','paid','failed')),
 paid_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, notes TEXT
);
CREATE TABLE IF NOT EXISTS complaints (
 id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES users(id), unit_id TEXT REFERENCES units(id),
 subject TEXT NOT NULL, description TEXT NOT NULL,
 priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved')),
 resolution TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit_log (
 id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), action TEXT NOT NULL,
 entity_type TEXT NOT NULL, entity_id TEXT, details TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if (count === 0) {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@campusnest.co.ke').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  db.prepare(`INSERT INTO users(id,name,email,password_hash,role) VALUES(?,?,?,?, 'landlord')`)
    .run('usr_admin', process.env.ADMIN_NAME || 'CampusNest Administrator', adminEmail, bcrypt.hashSync(adminPassword, 12));
}
db.prepare("INSERT OR IGNORE INTO settings(key,value) VALUES('tax_reserve_rate','0.10')").run();
module.exports = db;
