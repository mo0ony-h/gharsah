const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
const session = require('express-session');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth'); 

dotenv.config();
const app = express(); // Initialize app here

// Adjust the size limit as necessary
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json({ limit: '1mb' }));


// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors()); // For handling cross-origin requests (if needed)
app.use(session({
  secret: 'gharsah_secret_key',
  resave: false,
  saveUninitialized: true,
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for SPA (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Connect to the database
const mongoURI = 'mongodb://localhost:27017/gharsahDB';

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Set up session store with MongoDB
app.use(session({
  secret: 'theAirisgowoo',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoURI,  // MongoDB connection URL
    ttl: 14 * 24 * 60 * 60 // set TTL (Time To Live) for sessions (14 days)
  }),
  cookie: { secure: false } 
}));

app.get('/', (req, res) => {
  res.send('Session setup with MongoDB!');
});
// Function to disconnect from the database
function disconnectDatabase() {
  mongoose.disconnect()
    .then(() => {
      console.log('✅ Disconnected from the database');
    })
    .catch((err) => {
      console.error('❌ Error disconnecting from the database:', err);
    });
}

// Gracefully handle termination signals (e.g., Ctrl+C in the terminal)
process.on('SIGINT', () => {
  disconnectDatabase();
  process.exit(0);
});

// Routes
app.use('/api/auth', authRoutes); // Use the routes for signup and signin


// User route (optional - can check if user is logged in)
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
});

// Signout route
app.get('/signout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('❌ Error logging out.');
    }
    res.redirect('/html/signin.html'); // adjust to your login page
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
