import { Router } from "express";
import { requireAuth, requireReader, requireLibrarian } from "../../middleware/auth.js";


export const pagesDashboardRouter = Router();

pagesDashboardRouter.get("/profile", requireAuth, requireReader, (req, res) => {
  res.render("dashboard", {
    user: req.session.user,
    page: 'profile',
    title: 'Личный кабинет'
  });
});

pagesDashboardRouter.get("/readers", requireAuth, requireLibrarian, (req, res) => {
  res.render("dashboard", {
    user: req.session.user,
    page: 'readers',
    title: 'Читатели'
  });
});

pagesDashboardRouter.get("/suggestions", requireAuth, requireLibrarian, (req, res) => {
  res.render("dashboard", {
    user: req.session.user,
    page: 'suggestions',
    title: 'Предложения'
  });
});