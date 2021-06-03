

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

mongoose.set('useFindAndModify', false);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Member = new Schema({
  discordId: {
    type: String,
    unique: true,
  },
  tag: String,
  school: String,
  grade: String,
  fullname: String,
  valorant: Object,
});

module.exports = new mongoose.model("Member", Member);