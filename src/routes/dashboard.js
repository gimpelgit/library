import { Router } from "express";
import { requireAuth, requireReader, requireLibrarian } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.get("/profile", requireAuth, requireReader, (req, res) => {
  res.render("dashboard", {
    user: req.session.user,
    page: 'profile',
    title: 'Личный кабинет'
  });
});

dashboardRouter.get("/readers", requireAuth, requireLibrarian, (req, res) => {
  res.render("dashboard", {
    user: req.session.user,
    page: 'readers',
    title: 'Читатели'
  });
});

dashboardRouter.get("/suggestions", requireAuth, requireLibrarian, (req, res) => {
  res.render("dashboard", {
    user: req.session.user,
    page: 'suggestions',
    title: 'Предложения'
  });
});