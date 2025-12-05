import express from "express";
import { urlencoded, json } from "express";
import session from "express-session";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { engine } from "express-handlebars";

import { sessionConfig } from "./config/session.js";
import { hbsHelpers } from "./config/hbs.js";
import { indexRouter } from "./routes/index.js";
import { authRouter } from "./routes/auth.js";
import { booksRouter } from "./routes/books.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { librarianRouter } from "./routes/librarian.js";
import { reservationsRouter } from "./routes/reservations.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const urlencodedParser = urlencoded({ extended: false });

// Middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use(urlencodedParser);
app.use(json());
app.use(session(sessionConfig));

// Handlebars configuration
app.engine("hbs", engine({
  defaultLayout: "layout",
  extname: ".hbs",
  helpers: hbsHelpers
}));

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, '../views'));

// Routes
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/", dashboardRouter);
app.use("/books", booksRouter);
app.use("/librarian", librarianRouter);
app.use("/reservations", reservationsRouter);


export { app };