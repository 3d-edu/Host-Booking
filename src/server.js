require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('Set JWT_SECRET in .env to a random string of at least 32 characters.');
  process.exit(1);
}
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5500').split(',').map(x => x.trim());
app.use(helmet());
app.use(cors({ origin(origin, cb) { if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true); cb(new Error('Origin not allowed by CORS')); }, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));

const id = prefix => `${prefix}_${crypto.randomUUID()}`;
const clean = v => typeof v === 'string' ? v.trim() : '';
const int = v => Number.isSafeInteger(Number(v)) ? Number(v) : NaN;
const audit = (userId, action, entityType, entityId, details = {}) => db.prepare('INSERT INTO audit_log(id,user_id,action,entity_type,entity_id,details) VALUES(?,?,?,?,?,?)').run(id('log'), userId || null, action, entityType, entityId || null, JSON.stringify(details));
const tokenFor = user => jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try { const payload = jwt.verify(token, JWT_SECRET); const user = db.prepare('SELECT id,name,email,phone,role FROM users WHERE id=?').get(payload.sub); if (!user) return res.status(401).json({ error: 'Account not found' }); req.user = user; next(); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
}
const landlordOnly = (req, res, next) => req.user?.role === 'landlord' ? next() : res.status(403).json({ error: 'Landlord access required' });
const tenantOnly = (req, res, next) => req.user?.role === 'tenant' ? next() : res.status(403).json({ error: 'Tenant access required' });
const wrap = fn => (req,res,next) => { try { fn(req,res,next); } catch(e) { if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({error:'A record with that unique value already exists'}); console.error(e); res.status(500).json({error:'Server error'}); } };

app.get('/api/health', (req,res) => res.json({ ok:true, service:'CampusNest API', time:new Date().toISOString() }));

// Authentication
app.post('/api/auth/login', wrap((req,res) => {
  const email = clean(req.body.email).toLowerCase(), password = req.body.password || '';
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({error:'Incorrect email or password'});
  const safe = { id:user.id, name:user.name, email:user.email, phone:user.phone, role:user.role };
  res.json({ token:tokenFor(safe), user:safe });
}));
app.post('/api/auth/register', wrap((req,res) => {
  const name=clean(req.body.name), email=clean(req.body.email).toLowerCase(), phone=clean(req.body.phone), password=req.body.password || '';
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return res.status(400).json({error:'Provide a name, valid email, and password of at least 8 characters'});
  const user={id:id('usr'),name,email,phone,role:'tenant'};
  db.prepare('INSERT INTO users(id,name,email,phone,password_hash,role) VALUES(?,?,?,?,?,?)').run(user.id,name,email,phone,bcrypt.hashSync(password,12),'tenant');
  res.status(201).json({token:tokenFor(user),user});
}));
app.get('/api/auth/me', auth, (req,res) => res.json({user:req.user}));

// Public property inventory and applications
app.get('/api/public/units', wrap((req,res) => res.json(db.prepare("SELECT id,name,building,rent,status,description FROM units WHERE status IN ('vacant','reserved') ORDER BY name").all())));
app.post('/api/applications', wrap((req,res) => {
  const b=req.body, name=clean(b.applicant_name), email=clean(b.email).toLowerCase(), unitId=clean(b.unit_id);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !unitId) return res.status(400).json({error:'Applicant name, valid email and unit are required'});
  const unit=db.prepare('SELECT id,status FROM units WHERE id=?').get(unitId);
  if (!unit || unit.status !== 'vacant') return res.status(409).json({error:'That unit is not currently available'});
  const appId=id('app');
  db.prepare(`INSERT INTO applications(id,applicant_name,email,phone,unit_id,course,institution,move_in_date,notes) VALUES(?,?,?,?,?,?,?,?,?)`)
    .run(appId,name,email,clean(b.phone),unitId,clean(b.course),clean(b.institution),clean(b.move_in_date),clean(b.notes));
  audit(null,'application_submitted','application',appId,{unit_id:unitId});
  res.status(201).json({id:appId,status:'pending',message:'Application received'});
}));

// Landlord dashboard and reports
app.get('/api/landlord/dashboard', auth, landlordOnly, wrap((req,res) => {
  const units=db.prepare(`SELECT COUNT(*) total, SUM(status='vacant') vacant, SUM(status='occupied') occupied, SUM(status='reserved') reserved, SUM(status='maintenance') maintenance FROM units`).get();
  const applications=db.prepare("SELECT COUNT(*) total, SUM(status='pending') pending FROM applications").get();
  const complaints=db.prepare("SELECT COUNT(*) total, SUM(status IN ('open','in_progress')) open FROM complaints").get();
  const income=db.prepare("SELECT COALESCE(SUM(amount),0) total FROM payments WHERE status='paid'").get().total;
  const rate=Number(db.prepare("SELECT value FROM settings WHERE key='tax_reserve_rate'").get()?.value || 0.1);
  res.json({units,applications,complaints,income_kes:income,tax_reserve_rate:rate,tax_reserve_estimate_kes:Math.round(income*rate),income_after_reserve_kes:income-Math.round(income*rate)});
}));
app.get('/api/landlord/reports/income', auth, landlordOnly, wrap((req,res) => {
  const rows=db.prepare(`SELECT strftime('%Y-%m',paid_at) month, SUM(amount) amount, COUNT(*) payments FROM payments WHERE status='paid' GROUP BY month ORDER BY month DESC LIMIT 24`).all();
  res.json({currency:'KES',months:rows});
}));
app.put('/api/landlord/settings/tax-rate', auth, landlordOnly, wrap((req,res) => {
  const rate=Number(req.body.rate); if (!Number.isFinite(rate) || rate<0 || rate>1) return res.status(400).json({error:'Tax reserve rate must be between 0 and 1'});
  db.prepare("INSERT INTO settings(key,value) VALUES('tax_reserve_rate',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(rate));
  audit(req.user.id,'tax_rate_updated','setting','tax_reserve_rate',{rate}); res.json({rate});
}));

// Units
app.get('/api/units', auth, landlordOnly, wrap((req,res) => res.json(db.prepare('SELECT u.*, t.name tenant_name, t.email tenant_email FROM units u LEFT JOIN users t ON t.id=u.tenant_id ORDER BY u.name').all())));
app.post('/api/units', auth, landlordOnly, wrap((req,res) => {
  const b=req.body, name=clean(b.name), rent=int(b.rent); if(!name || !Number.isSafeInteger(rent) || rent<0) return res.status(400).json({error:'Unit name and non-negative rent are required'});
  const unitId=id('unit'); db.prepare('INSERT INTO units(id,name,building,rent,status,description) VALUES(?,?,?,?,?,?)').run(unitId,name,clean(b.building),rent,b.status||'vacant',clean(b.description));
  audit(req.user.id,'unit_created','unit',unitId); res.status(201).json(db.prepare('SELECT * FROM units WHERE id=?').get(unitId));
}));
app.patch('/api/units/:id', auth, landlordOnly, wrap((req,res) => {
  const old=db.prepare('SELECT * FROM units WHERE id=?').get(req.params.id); if(!old) return res.status(404).json({error:'Unit not found'});
  const b=req.body, status=b.status ?? old.status; if(!['vacant','occupied','reserved','maintenance'].includes(status)) return res.status(400).json({error:'Invalid unit status'});
  const rent=b.rent===undefined?old.rent:int(b.rent); if(!Number.isSafeInteger(rent)||rent<0) return res.status(400).json({error:'Invalid rent amount'});
  db.prepare('UPDATE units SET name=?,building=?,rent=?,status=?,description=? WHERE id=?').run(b.name===undefined?old.name:clean(b.name),b.building===undefined?old.building:clean(b.building),rent,status,b.description===undefined?old.description:clean(b.description),old.id);
  audit(req.user.id,'unit_updated','unit',old.id,{status}); res.json(db.prepare('SELECT * FROM units WHERE id=?').get(old.id));
}));
app.delete('/api/units/:id', auth, landlordOnly, wrap((req,res) => { const result=db.prepare('DELETE FROM units WHERE id=?').run(req.params.id); if(!result.changes) return res.status(404).json({error:'Unit not found'}); audit(req.user.id,'unit_deleted','unit',req.params.id); res.json({ok:true}); }));

// Applications
app.get('/api/applications', auth, landlordOnly, wrap((req,res) => res.json(db.prepare(`SELECT a.*,u.name unit_name,u.rent FROM applications a LEFT JOIN units u ON u.id=a.unit_id ORDER BY a.created_at DESC`).all())));
app.patch('/api/applications/:id', auth, landlordOnly, wrap((req,res) => {
  const status=req.body.status; if(!['approved','rejected'].includes(status)) return res.status(400).json({error:'Status must be approved or rejected'});
  const update=db.transaction(() => {
    const application=db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id); if(!application) throw Object.assign(new Error('Application not found'),{status:404});
    if(application.status!=='pending') throw Object.assign(new Error('Application has already been reviewed'),{status:409});
    if(status==='approved') {
      const unit=db.prepare('SELECT * FROM units WHERE id=?').get(application.unit_id);
      if(!unit || unit.status!=='vacant') throw Object.assign(new Error('Unit is no longer vacant'),{status:409});
      let tenant=db.prepare('SELECT * FROM users WHERE email=?').get(application.email);
      if(!tenant) { const tempPassword=crypto.randomBytes(18).toString('base64url'); const tenantId=id('usr'); db.prepare("INSERT INTO users(id,name,email,phone,password_hash,role) VALUES(?,?,?,?,?,'tenant')").run(tenantId,application.applicant_name,application.email,application.phone,bcrypt.hashSync(tempPassword,12)); tenant={id:tenantId}; }
      db.prepare("UPDATE units SET status='occupied',tenant_id=? WHERE id=?").run(tenant.id,unit.id);
    }
    db.prepare('UPDATE applications SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?').run(status,req.user.id,req.params.id);
    audit(req.user.id,`application_${status}`,'application',req.params.id);
    return db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id);
  });
  try { res.json(update()); } catch(e) { res.status(e.status||500).json({error:e.message}); }
}));

// Tenant account summary
app.get('/api/tenant/overview', auth, tenantOnly, wrap((req,res) => {
  const unit=db.prepare('SELECT id,name,building,rent,status FROM units WHERE tenant_id=?').get(req.user.id) || null;
  const paid=db.prepare("SELECT COALESCE(SUM(amount),0) amount, COUNT(*) count FROM payments WHERE tenant_id=? AND status='paid'").get(req.user.id);
  const complaints=db.prepare("SELECT COUNT(*) total, SUM(status='open' OR status='in_progress') active FROM complaints WHERE tenant_id=?").get(req.user.id);
  res.json({user:req.user,unit,paid_kes:paid.amount,payment_count:paid.count,complaints});
}));

// Tenant and landlord payment records
app.get('/api/payments', auth, wrap((req,res) => {
  const rows=req.user.role==='landlord' ? db.prepare(`SELECT p.*,u.name tenant_name,un.name unit_name FROM payments p LEFT JOIN users u ON u.id=p.tenant_id LEFT JOIN units un ON un.id=p.unit_id ORDER BY p.paid_at DESC`).all() : db.prepare('SELECT * FROM payments WHERE tenant_id=? ORDER BY paid_at DESC').all(req.user.id);
  res.json(rows);
}));
app.post('/api/payments', auth, landlordOnly, wrap((req,res) => {
  const b=req.body, amount=int(b.amount); if(!Number.isSafeInteger(amount)||amount<=0) return res.status(400).json({error:'Amount must be a positive whole number of KES'});
  const paymentId=id('pay'), reference=clean(b.reference)||`MAN-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  db.prepare('INSERT INTO payments(id,tenant_id,unit_id,amount,method,reference,status,paid_at,notes) VALUES(?,?,?,?,?,?,?,?,?)').run(paymentId,b.tenant_id||null,b.unit_id||null,amount,clean(b.method)||'manual',reference,b.status||'paid',b.paid_at||new Date().toISOString(),clean(b.notes));
  audit(req.user.id,'payment_recorded','payment',paymentId,{amount,reference}); res.status(201).json(db.prepare('SELECT * FROM payments WHERE id=?').get(paymentId));
}));

// Complaints / maintenance
app.get('/api/complaints', auth, wrap((req,res) => {
  const sql=`SELECT c.*,u.name tenant_name,un.name unit_name FROM complaints c LEFT JOIN users u ON u.id=c.tenant_id LEFT JOIN units un ON un.id=c.unit_id`;
  res.json(req.user.role==='landlord' ? db.prepare(sql+' ORDER BY c.created_at DESC').all() : db.prepare(sql+' WHERE c.tenant_id=? ORDER BY c.created_at DESC').all(req.user.id));
}));
app.post('/api/complaints', auth, tenantOnly, wrap((req,res) => {
  const b=req.body, subject=clean(b.subject), description=clean(b.description); if(!subject||!description) return res.status(400).json({error:'Subject and description are required'});
  const complaintId=id('cmp'); db.prepare('INSERT INTO complaints(id,tenant_id,unit_id,subject,description,priority) VALUES(?,?,?,?,?,?)').run(complaintId,req.user.id,b.unit_id||null,subject,description,['low','normal','high','urgent'].includes(b.priority)?b.priority:'normal');
  audit(req.user.id,'complaint_created','complaint',complaintId); res.status(201).json(db.prepare('SELECT * FROM complaints WHERE id=?').get(complaintId));
}));
app.patch('/api/complaints/:id', auth, landlordOnly, wrap((req,res) => {
  const status=req.body.status; if(!['open','in_progress','resolved'].includes(status)) return res.status(400).json({error:'Invalid complaint status'});
  const result=db.prepare('UPDATE complaints SET status=?,resolution=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status,clean(req.body.resolution),req.params.id);
  if(!result.changes) return res.status(404).json({error:'Complaint not found'}); audit(req.user.id,'complaint_updated','complaint',req.params.id,{status}); res.json(db.prepare('SELECT * FROM complaints WHERE id=?').get(req.params.id));
}));

// Assistant: built-in FAQs by default; optional OpenAI-powered answer when configured.
app.post('/api/assistant/chat', async (req,res) => {
  const message=clean(req.body.message); if(!message) return res.status(400).json({error:'Message is required'});
  const faq=[
    [/rent|pay|payment|mpesa/i,'You can pay rent using the payment method shown in your CampusNest tenant portal. Keep your transaction reference. Contact the landlord if a payment is not reflected.'],
    [/apply|application|book|vacan/i,'Browse available units, choose a vacant room, and submit the tenant application form. The landlord reviews and approves or rejects applications.'],
    [/repair|complaint|maintenance|leak|electric/i,'Sign in to your tenant account and submit a complaint with the house details and a clear description. The landlord can track it as open, in progress, or resolved.'],
    [/landlord|dashboard|income|tax/i,'The landlord dashboard summarizes units, applications, recorded rent payments, complaints, and an estimated tax reserve. The reserve is only a planning estimate, not tax advice or a KRA filing.'],
    [/wifi|water|electricity|security/i,'For utility or security issues, submit a maintenance complaint through your tenant portal so the property manager can follow up.']
  ];
  const found=faq.find(([re])=>re.test(message));
  if(!process.env.OPENAI_API_KEY) return res.json({reply:found?found[1]:"I can help with applications, rent payments, repairs, utilities and landlord dashboard questions. Please tell me a little more about what you need.",mode:'faq'});
  try {
    const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',messages:[{role:'system',content:'You are CampusNest Kenya support. Give concise, helpful answers about student rentals, applications, rent payments and maintenance. Do not claim a payment has been made or an application approved. Do not provide definitive Kenyan tax or legal advice.'},{role:'user',content:message}],temperature:0.4})});
    if(!response.ok) throw new Error(`AI provider returned ${response.status}`); const data=await response.json(); res.json({reply:data.choices?.[0]?.message?.content||'Sorry, I could not prepare an answer.',mode:'ai'});
  } catch(e) { console.error('Assistant error:',e.message); res.json({reply:found?found[1]:'The assistant is temporarily unavailable. Please contact the property manager.',mode:'faq'}); }
});

app.get('/api/audit-log', auth, landlordOnly, wrap((req,res) => res.json(db.prepare(`SELECT a.*,u.name user_name FROM audit_log a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 200`).all())));
app.use((err,req,res,next)=>{ console.error(err.message); res.status(400).json({error:err.message||'Request failed'}); });
app.listen(PORT,()=>console.log(`CampusNest API running at http://localhost:${PORT}`));
