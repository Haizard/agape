const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  database: process.env.MONGODB_URI || 'mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority'
};