const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const ejsMate = require('ejs-mate');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
const fetch = require('node-fetch');

const { PORT, MONGODB_URI, NODE_ENV, ORIGIN } = require('./config');
const { API_ENDPOINT_NOT_FOUND_ERR, SERVER_ERR } = require('./errors');

const { all_questions } = require('./questions');
const {
  converttoOptionString,
  converttoOptionNo,
  find,
  api_call,
  saveSurvey,
} = require('./functions');
const Addiction = require('./models/response.model');
// routes
const authRoutes = require('./routes/auth.route');
const { func } = require('joi');

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

const response = {}; //yesno
const responseNo = {}; //1,2,3,4
const addictions = ['screen', 'behaviour', 'marijuana', 'alcohol'];

app.use('/api/auth', authRoutes);

app.post('/level2/:type', async (req, res) => {
  var type = req.params.type;
  let curr = find(type, addictions) - 0;
  response[addictions[curr - 1]] = converttoOptionString(req.body);
  responseNo[addictions[curr - 1]] = converttoOptionNo(req.body);
  console.log(response);
  if (curr == addictions.length) {
    //code for fetching prediction
    await api_call(response, responseNo);
    res.redirect('/result');
  } else res.redirect(`${addictions[curr]}`);
});

app.get('/result', (req, res) => {
  res.render('./pages/result');
});
app.get('/start', (req, res) => {
  res.render('./pages/intro_q');
});

app.post('/level1', (req, res) => {
  console.log(req.body);
  res.redirect('/level2/1');
});

app.get('/level1', (req, res) => {
  res.render('./pages/level1', { questions });
});

app.get('/level2/:type', (req, res) => {
  let type = req.params.type;
  let questions = all_questions[type];
  // console.log(questions);
  res.render('./pages/level2', { questions });
});

app.get('/home', (req, res) => {
  res.render('./pages/home.ejs');
});

app.get('/dashboard', (req, res) => {
  res.render('./pages/dashboard.ejs');
});

app.get('/admin', (req, res) => {
  res.render('./pages/admin.ejs');
});

app.get('/dashboard/:substance', (req, res) => {
  let sub = req.params.substance;
  let values = {
    1: [
      [15, 10, 3, 7],
      [10, 29, 21, 10],
      [5, 10, 11, 12],
    ],
    2: [
      [5, 0, 3, 7],
      [10, 29, 21, 10],
      [5, 10, 11, 12],
    ],
    3: [
      [15, 10, 3, 7],
      [10, 29, 21, 10],
      [5, 10, 11, 12],
    ],
    4: [
      [15, 10, 3, 7],
      [10, 29, 21, 10],
      [5, 10, 11, 12],
    ],
    5: [
      [15, 10, 3, 7],
      [10, 29, 21, 10],
      [5, 10, 11, 12],
    ],
  };
  console.log(all_questions[sub]);
  res.render(`./pages/${sub}`, { questions: all_questions[sub], values });
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
