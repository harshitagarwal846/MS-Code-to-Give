const mongoose = require('mongoose');
const Addiction = require('./models/response.model')
const fetch = require("node-fetch");

function converttoOptionString(r) {
  let yesno = [];
  console.log('mc' + (1 + 1));
  for (let i = 0; i < 5; i++) {
    if (r['mcq' + (i + 1)] == 1)
      yesno.push('Yes');
    else if (r['mcq' + (i + 1)] == 2)
      yesno.push('No');
    else if (r['mcq' + (i + 1)] == 3)
      yesno.push('Sometimes');
    else if (r['mcq' + (i + 1)] == 4)
      yesno.push('Prefer not to answer');
  }
  return yesno;
}

function converttoOptionNo(r) {
  let yesno = [];
  for (let i = 0; i < 5; i++) {
    if (r['mcq' + (i + 1)] == 1)
      yesno.push(1);
    else if (r['mcq' + (i + 1)] == 2)
      yesno.push(2);
    else if (r['mcq' + (i + 1)] == 3)
      yesno.push(3);
    else if (r['mcq' + (i + 1)] == 4)
      yesno.push(4);
  }
  return yesno;
}

function find(type, addictions) {
  for (var i = 0; i < addictions.length; i++)
    if (addictions[i] == type) break;
  return i + 1;
}

async function api_call(user_res, responseNo) {
   try {
    const api_response = await fetch('http://127.0.0.1:3001/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user_res)
    })
    const api_responseData = await api_response.json();
    console.log(api_responseData);
    const id= await saveSurvey(api_responseData,responseNo);
    console.log(id);
    return id;
  } catch (err) {
    console.log(err);
  }
}
async function saveSurvey(prediction, userResponse) {
  for (let i = 0; i < prediction.length; i++) {
    prediction[i] = prediction[i] - 0;
  }
  const survey = new Addiction({
    screen: {
      level: prediction[0],
      response: userResponse['screen']
    },
    behaviour: {
      level: prediction[1],
      response: userResponse['behaviour']
    },
    marijuana: {
      level: prediction[2],
      response: userResponse['marijuana']
    },
    alcohol: {
      level: prediction[3],
      response: userResponse['alcohol']
    },
    mood: userResponse['mood']
  })
  const s = await survey.save();
  console.log(s, s._id);
  return s._id;
}


module.exports = { converttoOptionString, converttoOptionNo, find, api_call, saveSurvey }