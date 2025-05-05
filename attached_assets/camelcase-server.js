/**
 * MediRefs API Server (camelCase Edition)
 * 
 * A modern Express server providing clean API endpoints
 * with consistent camelCase field names throughout.
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const app = express();
const port = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Session setup
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'session' // Optional. Default is "session"
  }),
  secret: process.env.SESSION_SECRET || 'medirefs_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
}

// API Routes

// Tests endpoints
app.get('/api/tests', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tests');
    res.json({ tests: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM tests WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    res.json({ test: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test-count', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM tests');
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test-count-by-category', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT category, COUNT(*) FROM tests GROUP BY category'
    );
    res.json({ categories: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test-count-by-subcategory', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT "subCategory", COUNT(*) FROM tests GROUP BY "subCategory"'
    );
    
    // Map to a consistent format
    const subcategories = rows.map(row => ({
      subCategory: row.subCategory,
      count: parseInt(row.count)
    }));
    
    res.json({ subcategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tests/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM tests WHERE category = $1',
      [category]
    );
    res.json({ tests: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tests/subcategory/:subcategory', async (req, res) => {
  try {
    const { subcategory } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM tests WHERE "subCategory" = $1',
      [subcategory]
    );
    res.json({ tests: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await pool.query(
      `INSERT INTO users (username, password, email, "firstName", "lastName")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, "firstName", "lastName"`,
      [username, hashedPassword, email, firstName, lastName]
    );
    
    // Set session
    const user = result.rows[0];
    req.session.userId = user.id;
    
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Set session
    req.session.userId = user.id;
    
    // Return user (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Successfully logged out' });
  });
});

app.get('/api/auth/status', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ isAuthenticated: false });
  }
  
  try {
    const result = await pool.query(
      'SELECT id, username, email, "firstName", "lastName" FROM users WHERE id = $1',
      [req.session.userId]
    );
    
    if (result.rows.length === 0) {
      req.session.destroy();
      return res.json({ isAuthenticated: false });
    }
    
    res.json({
      isAuthenticated: true,
      user: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bookmarks endpoints (protected)
app.get('/api/bookmarks', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, t.name, t.category, t."subCategory"
       FROM bookmarks b
       JOIN tests t ON b."testId" = t.id
       WHERE b."userId" = $1`,
      [req.session.userId]
    );
    res.json({ bookmarks: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookmarks', requireAuth, async (req, res) => {
  try {
    const { testId, notes } = req.body;
    
    // Check if bookmark already exists
    const existing = await pool.query(
      'SELECT * FROM bookmarks WHERE "userId" = $1 AND "testId" = $2',
      [req.session.userId, testId]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Bookmark already exists' });
    }
    
    // Create bookmark
    const result = await pool.query(
      `INSERT INTO bookmarks ("userId", "testId", notes)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.session.userId, testId, notes]
    );
    
    res.status(201).json({ bookmark: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bookmarks/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const bookmark = await pool.query(
      'SELECT * FROM bookmarks WHERE id = $1 AND "userId" = $2',
      [id, req.session.userId]
    );
    
    if (bookmark.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    
    // Delete bookmark
    await pool.query('DELETE FROM bookmarks WHERE id = $1', [id]);
    
    res.json({ message: 'Bookmark deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Serve frontend for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 MediRefs API Server running on http://0.0.0.0:${port}`);
  console.log(`📊 Using camelCase field names consistently throughout the application`);
});