const express= require ('express');
const dotenv= require ('dotenv');
const cookieParser = require('cookie-parser');
const authRoute = require('./routes/Auth.routes');
const chatRoute = require('./routes/chat.routes');
const uploadRoute = require('./routes/upload.routes');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/auth",authRoute);
app.use("/chat",chatRoute);
app.use("/upload", uploadRoute);




module.exports = app;
