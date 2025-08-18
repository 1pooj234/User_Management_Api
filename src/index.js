const express = require("express");
const cors = require("cors");
const { adminRouter } = require("./routers/adminRouter");
const employeeRouter = require("./routers/employeeRouter");
require("./db");
const app = express();
const port = process.env.PORT;
app.use(
  cors({
    origin: "https://userappmanage.vercel.app",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // if you send cookies or auth headers
  })
);
app.use(express.json());
app.use(adminRouter);
app.use(employeeRouter);
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
