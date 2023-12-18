require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const userRouter = require('./src/routes/userRoute');
const postRouter = require('./src/routes/postRoute');
const cors = require('cors');


const app = express();
const url = process.env.MONGO_URI;
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful!')})
  .catch((error) => console.error('Error connecting to MongoDB:', error.message));

const allowedOrigins = ['https://girma336.github.io', 'http://localhost:3000'];
app.use(express.json());
app.use(cors({ origin: allowedOrigins }));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Route to handle the GET request for data
app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter)

const port = process.env.PORT || 5001;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
