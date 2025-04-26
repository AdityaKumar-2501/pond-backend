import dotnev from "dotenv";
dotnev.config();
// Imports
import express from "express";
import routes from "./routes/mainRoute.js";
import db from "./config/db.js";

// App Config
const app = express();
const PORT = process.env.PORT || 5001;

// DB Config
db(process.env.MONGO_URI);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// routes
app.get("/", (req, res) => {
  res.send("Welcome to the backend of POND app");
});

// parent route for all routes
app.use("/api", routes);

// Listener
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
