// filepath: [index.js](http://_vscodecontentref_/2)
import dotenv from "dotenv";
dotenv.config();

// Imports
import express from "express";
import routes from "./routes/mainRoute.js";
import db from "./config/db.js";
import cors from "cors";
import http from "http";

// App Config
const app = express();
const PORT = process.env.PORT || 5001;
const hostname = process.env.HOSTNAME || "localhost";

// DB Config
db(process.env.MONGO_URI);

// CORS Config
const corsOptions = {
  origin: "*", // Update this for production
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the backend of POND app");
});

// Parent route for all routes
app.use("/api", routes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Create Server
const Server = http.createServer(app);

// Listener
Server.listen(PORT, hostname, () => {
  console.log(`Server is running on http://${hostname}:${PORT}`);
});