const { model, Schema } = require('mongoose');

const addictionSchema = new Schema(
  {
    marijuana:{
        level:Number,
        response:[Number]
    },
    screen:{
        level:Number,
        response:[Number]
    },
    behaviour:{
        level:Number,
        response:[Number]
    },
    alcohol:{
        level:Number,
        response:[Number]
    },
    mood: String
  },
  { timestamps: true }
);

module.exports = model('Addiction', addictionSchema);
