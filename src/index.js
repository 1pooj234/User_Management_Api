const express = require("express");
const { adminRouter } = require("./routers/adminRouter");
const employeeRouter = require("./routers/employeeRouter");
require("./db");
const app = express();
const port = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use(adminRouter);
app.use(employeeRouter);
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
