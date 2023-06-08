const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const ejsMate = require('ejs-mate');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');

const { PORT, MONGODB_URI, NODE_ENV, ORIGIN } = require('./config');
const { API_ENDPOINT_NOT_FOUND_ERR, SERVER_ERR } = require('./errors');

const { questions } = require('./questions');
// routes
const authRoutes = require('./routes/auth.route');

// init express app
const app = express();

// middlewares

app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: ORIGIN,
    optionsSuccessStatus: 200,
  })
);

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, './public')));

// log in development environment

if (NODE_ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('dev'));
}

// index route

app.get('/', (req, res) => {
  res.status(200).json({
    type: 'success',
    message: 'server is up and running',
    data: null,
  });
});

// routes middlewares

app.use('/api/auth', authRoutes);

app.get('/change/:section', (req, res) => {
  let section = req.params.section;
  res.redirect(`/${section}`);
});

app.post('/level1', (req, res) => {
  console.log(req.body);
  res.redirect('/change/level2');
});

app.get('/level1', (req, res) => {
  res.render('./pages/level1', { questions });
});

app.post('/level2', (req, res) => {
  console.log(req.body);
});

app.get('/level2', (req, res) => {
  res.render('./pages/level2', { questions });
});

app.get('/home', (req, res) => {
  res.render('./pages/front.ejs');
});

app.get('/dashboard', (req, res) => {
  res.render('./pages/dashboard.ejs');
});

// page not found error handling  middleware
app.use('*', (req, res, next) => {
  const error = {
    status: 404,
    message: API_ENDPOINT_NOT_FOUND_ERR,
  };
  next(error);
});

// global error handling middleware
app.use((err, req, res, next) => {
  console.log(err);
  const status = err.status || 500;
  const message = err.message || SERVER_ERR;
  const data = err.data || null;
  res.status(status).json({
    type: 'error',
    message,
    data,
  });
});

async function main() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });

    console.log('database connected');

    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

main();
