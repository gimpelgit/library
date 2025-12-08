import express from "express";
import { urlencoded, json } from "express";
import session from "express-session";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { engine } from "express-handlebars";

import { sessionConfig } from "./config/session.js";
import { hbsHelpers } from "./config/hbs.js";

import { pagesIndexRouter } from "./routes/pages/index.js";
import { pagesAuthRouter } from "./routes/pages/auth.js";
import { pagesBooksRouter } from "./routes/pages/books.js";
import { pagesDashboardRouter } from "./routes/pages/dashboard.js";
import { pagesLibrarianRouter } from "./routes/pages/librarian.js";
import { pagesReservationsRouter } from "./routes/pages/reservations.js";
import { pagesEditRouter } from "./routes/pages/edit.js";


// api
import { apiAuthorsRouter } from "./routes/api/authors.js";
import { apiGenresRouter } from "./routes/api/genres.js";
import { apiReadersRouter } from "./routes/api/readers.js";
import { apiIssueRouter } from "./routes/api/issue.js";
import { apiReturnsRouter } from "./routes/api/returns.js";
import { apiReservationsRouter } from "./routes/api/reservations.js";
import { apiReviewsRouter } from "./routes/api/reviews.js";
import { apiBooksRouter } from "./routes/api/books.js";

// import { indexRouter } from "./routes/index.js";
// import { authRouter } from "./routes/auth.js";
// import { booksRouter } from "./routes/books.js";
// import { dashboardRouter } from "./routes/dashboard.js";
// import { librarianRouter } from "./routes/librarian.js";
// import { reservationsRouter } from "./routes/reservations.js";
// import { editRouter } from "./routes/edit.js";
// import { reviewsRouter } from "./routes/reviews.js";



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
// app.use("/", indexRouter);
// app.use("/auth", authRouter);
// app.use("/", dashboardRouter);
// app.use("/books", booksRouter);
// app.use("/librarian", librarianRouter);
// app.use("/reservations", reservationsRouter);
// app.use("/edit", editRouter);
// app.use("/reviews", reviewsRouter);

app.use("/", pagesIndexRouter);
app.use("/", pagesDashboardRouter);
app.use("/auth", pagesAuthRouter);
app.use("/books", pagesBooksRouter);
app.use("/librarian", pagesLibrarianRouter);
app.use("/reservations", pagesReservationsRouter);
app.use("/edit", pagesEditRouter);

app.use("/api/authors", apiAuthorsRouter);
app.use("/api/genres", apiGenresRouter);
app.use("/api/readers", apiReadersRouter);
app.use("/api/issue", apiIssueRouter);
app.use("/api/returns", apiReturnsRouter);
app.use("/api/reservations", apiReservationsRouter);
app.use("/api/reviews", apiReviewsRouter);
app.use("/api/books", apiBooksRouter);

export { app };