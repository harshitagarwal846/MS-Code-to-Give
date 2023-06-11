const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const ejsMate = require('ejs-mate');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
const fetch = require('node-fetch');
const bcrypt = require('bcrypt');
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
const User = require('./models/user.model');
// routes
const authRoutes = require('./routes/auth.route');
const { func } = require('joi');

// init express app
const app = express();
app.use(session({
  secret: 'thisissecret', // Secret key for session encryption
  resave: false, // Set to false to prevent session from being saved on each request
  saveUninitialized: false // Set to false to prevent uninitialized sessions from being saved
}));

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
const isAuthenticated = (req, res, next) => {
  // Check if the user is authenticated (e.g., by checking the session or token)
  if (req.session.user) {
    // User is authenticated, proceed to the next middleware or route handler
    next();
  } else {
    // User is not authenticated, redirect to login or show an error page
    res.redirect('/home');
  }
}

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
    const id = await api_call(response, responseNo);
    console.log(id);
    res.redirect(`/result/${id}`);
  } else res.redirect(`${addictions[curr]}`);
});

app.get('/result/:id', (req, res) => {
  const id = req.params.id;
  res.render('./pages/result', { id });
});

app.get('/start', (req, res) => {
  res.render('./pages/intro_q');
});

app.post('/level1', (req, res) => {
  response['mood'] = req.body['mood'];
  responseNo['mood'] = req.body['mood'];
  console.log(response);
  console.log(req.body);
  res.send('done');
});

app.get('/level1', (req, res) => {
  res.render('./pages/level1');
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

app.get('/resources', (req, res) => {
  res.render('./pages/resources.ejs');
});

app.get('/dashboard', async (req, res) => {
  //no,mild,severe
  let values = {
    alcohol: [0, 0, 0],
    behaviour: [0, 0, 0],
    screen: [0, 0, 0],
    marijuana: [0, 0, 0],
  };
  try {
    for (const key in values) {
      for (let i = 0; i < 3; i++) {
        const query = {
          [`${key}.level`]: i,
        };
        values[key][i] = await Addiction.countDocuments(query);
      }
    }

    const totalSurvey = await Addiction.countDocuments({});
    const totalEnroll = await User.countDocuments({});

    res.render('./pages/dashboard.ejs', { values, totalSurvey, totalEnroll });
  } catch (err) {
    console.log(err);
  }
});

app.get('/admin', (req, res) => {
  res.render('./pages/admin.ejs');
});

app.get('/dashboard/cat/:substance', async (req, res) => {
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
  try {
    for (const qno in values) {
      for (let i = 0; i < 3; i++) {
        for (let j = 1; j <= 4; j++) {
          const query1 = {
            [`${sub}.level`]: i,
          };
          const query2 = {
            [`${sub}.response.${qno - 1}`]: j,
          };
          values[qno][i][j - 1] = await Addiction.countDocuments({
            $and: [query1, query2],
          });
        }
      }
    }
    res.render(`./pages/${sub}`, { questions: all_questions[sub], values });
  } catch (err) {
    console.log(err);
  }
});

app.get('/dashboard/college', async (req, res) => {
  try {
    const colleges = ['ABC college', 'PQR college', 'XYZ college', 'Other'];
    const sub = ['alcohol', 'behaviour', 'screen', 'marijuana'];
    let obj = {};
    colleges.forEach((college) => {
      Object.assign(obj, { [`${college}`]: [0, 0, 0, 0] });
    });
    // console.log(obj);
    for (const key in obj) {
      const data = await User.find(
        { college: key },
        { _id: 0, questionnaireId: 1 }
      );
      // console.log(key, data);
      data.forEach(async (objId) => {
        // console.log(objId.questionnaireId);
        const data = await Addiction.findById(
          mongoose.Types.ObjectId(objId.questionnaireId)
        );
        if (!data) return;
        // console.log(data);
        for (let i = 0; i < sub.length; i++) {
          const cat = sub[i];
          // console.log(cat);
          if (data[cat].level == 2) obj[key][i]++;
        }
      });
    }
    console.log(obj);
    res.render('./pages/college', { values: obj });
  } catch (err) {
    console.log(err);
  }
});

app.get('/dashboard/gender', async (req, res) => {
  try {
    const genders = ['Male', 'Female', 'Other'];
    const sub = ['alcohol', 'behaviour', 'screen', 'marijuana'];
    let obj = {};
    genders.forEach((gender) => {
      Object.assign(obj, { [`${gender}`]: [0, 0, 0, 0] });
    });
    // console.log(obj);
    for (const key in obj) {
      const data = await User.find(
        { gender: key },
        { _id: 0, questionnaireId: 1 }
      );
      // console.log(key, data);
      data.forEach(async (objId) => {
        // console.log(objId.questionnaireId);
        const data = await Addiction.findById(
          mongoose.Types.ObjectId(objId.questionnaireId)
        );
        if (!data) return;
        // console.log(data);
        for (let i = 0; i < sub.length; i++) {
          const cat = sub[i];
          // console.log(cat);
          if (data[cat].level == 2) obj[key][i]++;
        }
      });
    }
    console.log(obj);
    res.render('./pages/gender', { values: obj });
  } catch (err) {
    console.log(err);
  }
});

app.get('/login',(req,res)=>{
  if(req.session.user){
    res.redirect('/home/signedIn');
    return;
  }
  res.render('./pages/login');
})
app.get('/register', (req, res) => {
  if(req.session.user){
    res.redirect('/home/signedIn');
    return
  }
  res.render('./pages/register')
})

app.get('/home/signedIn', isAuthenticated, (req, res) => {
  res.render('./pages/authHome');
})

app.get('/logout', function(req, res) {
  // Destroy the session or clear the token
  req.session.destroy(function(err) {
    if (err) {
      console.error('Error destroying session:', err);
    } else {
      // Redirect to the login page or any other desired location
      res.redirect('/home');
    }
  });
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
