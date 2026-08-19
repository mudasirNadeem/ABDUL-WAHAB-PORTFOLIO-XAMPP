// Express app. Replaces Apache + PHP; deployed as a Vercel serverless function.
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root serves the static index.html.
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Block server-side files from ever being served as static assets.
const BLOCKED = /^\/(\.env.*|package(-lock)?\.json|vercel\.json|server\.js|db\.js|routes\/|node_modules\/|database\/|\.git)/i;
app.use((req, res, next) => {
  if (!BLOCKED.test(req.path)) return next();
  // /api/* must always answer JSON so the frontend's r.json() never throws.
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Not found.' });
  }
  res.status(404).send('Not found');
});

// Auth is mounted first and without dbGate: a /api prefix mount would run the
// gate for /api/auth/* too, breaking login whenever Postgres is unreachable.
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/contact'));
app.use('/api/admin', require('./routes/admin'));

// Static assets come AFTER the API routes so a stray file in api/ can never
// shadow them: assets/, style.css, script.js, sw.js, manifest ...
app.use(express.static(__dirname, { index: false, dotfiles: 'deny' }));

// Admin pages (HTML files provided separately).
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

// Unmatched API routes answer with JSON, never HTML.
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Not found.' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log('Portfolio running on http://localhost:' + port));
}

module.exports = app;
