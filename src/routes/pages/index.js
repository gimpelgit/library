import { Router } from "express";

export const pagesIndexRouter = Router();

pagesIndexRouter.get("/", (req, res) => {
  res.redirect('/books');
});