const mongoose = require("mongoose");
require("dotenv").config();

const dbConnectionString =
  'mongodb+srv://eLearning:Y1fVPMsdF6wBkpnv@cluster0.4rgqovz.mongodb.net/eLearningDb?retryWrites=true&w=majority&authSource=admin'

mongoose
    .connect(dbConnectionString)
    .then(() => {
        console.log("Database Connected");
    })
    .catch((e) => {
console.log('Database Connection Error', e)

    });
