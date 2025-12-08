import { Router } from "express";
import { pool } from "../../config/database.js";
import { requireAuth, requireReader } from "../../middleware/auth.js";

export const pagesReservationsRouter = Router();
// reservations/api/readers/:readerId
// reservations/reserve
// reservations/cancel/:id
pagesReservationsRouter.use(requireAuth);
pagesReservationsRouter.use(requireReader);

pagesReservationsRouter.get("/", async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const [reservations] = await pool.execute(`
      SELECT 
        r.id,
        r.reserved_until,
        b.id as book_id,
        b.title,
        b.cover_image_url,
        b.summary,
        GROUP_CONCAT(DISTINCT a.name) as authors,
        GROUP_CONCAT(DISTINCT g.name) as genres
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      LEFT JOIN books_authors ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.id
      LEFT JOIN books_genres bg ON b.id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.id
      WHERE r.user_id = ?
      GROUP BY r.id
      ORDER BY r.reserved_until ASC
    `, [userId]);
    
    res.render("reservations", {
      user: req.session.user,
      page: 'reservations',
      title: 'Мои забронированные книги',
      reservations,
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      user: req.session.user,
      title: 'Ошибка',
      message: 'Произошла ошибка при загрузке бронирований'
    });
  }
});