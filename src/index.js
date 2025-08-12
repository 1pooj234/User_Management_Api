const express = require("express");
const cors = require("cors");
const { adminRouter } = require("./routers/adminRouter");
const employeeRouter = require("./routers/employeeRouter");
require("./db");
const app = express();
const port = process.env.PORT;
<<<<<<< HEAD
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // if you send cookies or auth headers
  })
);
=======
app.use(cors({
  origin: 'https://usermanageapp.netlify.app',
  methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // if you send cookies or auth headers
}));
app.options('*', cors());
>>>>>>> 8f86951f73a328d8b8d2eed1af0de65b8a9ae56c
app.use(express.json());
app.use(adminRouter);
app.use(employeeRouter);
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
