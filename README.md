# CampusNest Kenya — Backend API

A starter backend for the CampusNest rental portal. It uses **Node.js 20+, Express, SQLite, JWT authentication and bcrypt password hashing**. The database is created automatically on first start.

## 1. Install and run

1. Install Node.js 20 or newer.
2. Extract this folder.
3. Open a terminal in `campusnest-backend` and run:

```bash
npm install
```

4. Copy `.env.example` to `.env` and change `JWT_SECRET` and `ADMIN_PASSWORD` before starting. Use a long random JWT secret (at least 32 characters).
5. Run:

```bash
npm run dev
```

The API will be available at `http://localhost:4000`. Check `http://localhost:4000/api/health`.

**Initial landlord login (development only):** the email and password are read from `.env` (`ADMIN_EMAIL` and `ADMIN_PASSWORD`). Defaults are `admin@campusnest.co.ke` and `ChangeMe123!`. Change this password immediately. The admin account is created only when the database has no users. If you change the environment password after first startup, it will not automatically change the existing account password.

## 2. Connect the existing website

Your current CampusNest page is a browser-side HTML/JavaScript project. It currently has demo/local browser-storage behavior. A backend will not become active merely by placing this folder beside the HTML file: the page's JavaScript must call the API and store the returned JWT.

Example browser login:

```js
const API_BASE = 'http://localhost:4000/api';
async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email, password})
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  sessionStorage.setItem('campusnestToken', data.token);
  return data.user;
}
async function api(path, options = {}) {
  const token = sessionStorage.getItem('campusnestToken');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}), ...(options.headers || {})}
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'API request failed');
  return data;
}
// Example: const dashboard = await api('/landlord/dashboard');
```

For local development, set `CORS_ORIGIN` in `.env` to the exact origin serving your HTML, e.g. `http://localhost:5500`. If you open the file directly as `file://`, use a local web server such as VS Code Live Server instead.

## 3. API endpoints

All JSON endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Health check |
| POST | `/auth/login` | Public | Login and receive JWT |
| POST | `/auth/register` | Public | Create tenant account |
| GET | `/auth/me` | Signed in | Current account |
| GET | `/public/units` | Public | Browse vacant/reserved units |
| POST | `/applications` | Public | Submit tenant application |
| GET | `/landlord/dashboard` | Landlord | Units, income, applications, complaints and tax estimate |
| GET | `/landlord/reports/income` | Landlord | Monthly recorded income totals |
| PUT | `/landlord/settings/tax-rate` | Landlord | Set planning reserve rate (0–1) |
| GET/POST | `/units` | Landlord | List/create units |
| PATCH/DELETE | `/units/:id` | Landlord | Update/delete unit |
| GET | `/applications` | Landlord | List applications |
| PATCH | `/applications/:id` | Landlord | Approve or reject application |
| GET/POST | `/payments` | Signed in / Landlord | Tenant sees own payments; landlord records payments |
| GET/POST | `/complaints` | Signed in / Tenant | List own or all complaints; tenant submits complaint |
| PATCH | `/complaints/:id` | Landlord | Update complaint status/resolution |
| GET | `/tenant/overview` | Tenant | Own unit, payment and complaint summary |
| POST | `/assistant/chat` | Public | FAQ chatbot; optional OpenAI API if configured |
| GET | `/audit-log` | Landlord | Recent management actions |

### Example: create a unit

```bash
curl -X POST http://localhost:4000/api/units \
  -H 'Authorization: Bearer YOUR_LANDLORD_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Room A1","building":"Block A","rent":8500,"status":"vacant"}'
```

### Example: approve an application

```bash
curl -X PATCH http://localhost:4000/api/applications/APP_ID \
  -H 'Authorization: Bearer YOUR_LANDLORD_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"status":"approved"}'
```

Approving a pending application changes its unit to occupied and associates the tenant account. If the applicant does not already have an account, the backend creates one with a random password. A production deployment should add a secure invitation/password-reset flow before tenants sign in.

## 4. Data and important limitations

- SQLite data is stored in `data/campusnest.sqlite`; back up this file regularly. For a larger production deployment, consider PostgreSQL.
- Passwords are hashed. Landlord-only routes check the account role. JWTs expire according to `JWT_EXPIRES_IN`.
- Income reports include only payment records with status `paid`. The payment endpoint currently records payments entered by the landlord; it does **not** verify real M-Pesa transactions.
- M-Pesa Daraja credentials, STK Push initiation, callback signature/validation, idempotency and reconciliation still need to be implemented and tested before accepting live payments. Never trust a browser-provided payment success flag.
- The tax reserve is a configurable percentage estimate for planning only. It is not a Kenyan tax calculation, tax return, or KRA integration. Confirm tax treatment with a qualified Kenyan tax professional/KRA.
- The chatbot works with built-in FAQ answers unless `OPENAI_API_KEY` is configured. Do not put the API key in browser JavaScript.
- The app has no production deployment, HTTPS, email/SMS delivery, tenant invitation flow, file upload, or automated backup configured. Add these before handling real tenants or payments.
- Add stricter validation, pagination, monitoring, backups, account recovery, and security review before public launch.

## 5. Suggested frontend integration order

1. Replace demo landlord login with `POST /api/auth/login`.
2. After landlord login, call `/api/landlord/dashboard`, `/api/units`, `/api/applications`, and `/api/complaints` to populate dashboard tabs.
3. Wire approve/reject buttons to `PATCH /api/applications/:id`.
4. Wire unit and complaint forms to the corresponding endpoints.
5. Use `/api/payments` for recorded payments and `/api/landlord/reports/income` for monthly reports.
6. Replace the chatbot's local reply function with `POST /api/assistant/chat`.

The existing HTML page is not automatically rewired by this backend package; the integration steps above are required.
