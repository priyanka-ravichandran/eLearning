const mongoose = require("mongoose");
require("dotenv").config();

const dbConnectionString =
  'mongodb+srv://admin:admin123@elearning.76hcjzy.mongodb.net/?retryWrites=true&w=majority&appName=eLearning'


mongoose
    .connect(dbConnectionString)
    .then(() => {
        console.log("Database Connected");
    })
    .catch((e) => {
console.log('Database Connection Error', e)

    });
