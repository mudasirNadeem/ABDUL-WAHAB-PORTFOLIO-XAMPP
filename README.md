# Abdul Wahab Portfolio — Express + Neon + Vercel

Migrated from PHP/MySQL (XAMPP) to **Express.js + Neon Postgres**, deployable on **Vercel**.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000

## Pages

| URL      | What it is                                  |
|----------|---------------------------------------------|
| `/`      | Portfolio (public)                          |
| `/login` | Admin login                                 |
| `/admin` | Admin panel — contact form submissions      |

The navbar has an **⚙ Admin** button pointing at `/admin`.
To change where it goes, edit the `href` on `id="adminBtn"` in `index.html`.

## Admin login

```
Email:    mudasirnadeem7979@gmail.com
Password: KHAN123
```

Change these with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables.

## API

| Method | Endpoint                     | Auth | Purpose                |
|--------|------------------------------|------|------------------------|
| POST   | `/api/contact`               | –    | Submit the contact form|
| POST   | `/api/auth/login`            | –    | Log in (sets cookie)   |
| POST   | `/api/auth/logout`           | –    | Log out                |
| GET    | `/api/auth/me`               | ✓    | Current admin          |
| GET    | `/api/admin/messages?q=`     | ✓    | List / search messages |
| GET    | `/api/admin/stats`           | ✓    | Counts for stat cards  |
| PATCH  | `/api/admin/messages/:id/read` | ✓  | Mark as read           |
| DELETE | `/api/admin/messages/:id`    | ✓    | Delete a message       |

Auth uses a signed JWT in an **httpOnly** cookie (`aw_token`), so the token is not
readable from JavaScript.

## Deploy to Vercel

1. Push this folder to GitHub (`.env` is gitignored — never commit it).
2. On vercel.com: **Add New → Project → Import** the repo.
3. Add these **Environment Variables** (Settings → Environment Variables):

   | Name             | Value                                   |
   |------------------|-----------------------------------------|
   | `DATABASE_URL`   | your Neon connection string             |
   | `JWT_SECRET`     | a long random string                    |
   | `ADMIN_EMAIL`    | `mudasirnadeem7979@gmail.com`           |
   | `ADMIN_PASSWORD` | `KHAN123`                               |
   | `NODE_ENV`       | `production`                            |

4. **Deploy.**

`NODE_ENV=production` marks the auth cookie `Secure` (HTTPS-only). Tables are
created automatically on first run, so no manual SQL import is needed —
`database/schema.sql` is provided only for reference.

## Notes

- Never commit `.env`; it contains the database password.
