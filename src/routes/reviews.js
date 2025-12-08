import { Router } from "express";
import { pool } from "../config/database.js";
import { requireAuth, requireReader } from "../middleware/auth.js";

export const reviewsRouter = Router();

reviewsRouter.get("/api/can-review/:bookId", requireAuth, requireReader, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.session.user.id;

    const [loans] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM loans l
      JOIN loan_statuses ls ON l.status_id = ls.id
      WHERE l.user_id = ? AND l.book_id = ? AND ls.name = 'on_loan'
    `, [userId, bookId]);

    const hasLoaned = loans[0].count > 0;

    const [reviews] = await pool.execute(
      'SELECT id FROM reviews WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    const hasReview = reviews.length > 0;
    const reviewId = hasReview ? reviews[0].id : null;

    res.json({
      success: true,
      canReview: hasLoaned,
      hasReview: hasReview,
      reviewId: reviewId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при проверке возможности отзыва'
    });
  }
});

reviewsRouter.get("/api/:bookId", async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.session.user ? req.session.user.id : null;

    const [reviews] = await pool.execute(`
      SELECT 
        r.id,
        r.user_id,
        u.name as user_name,
        r.rating,
        r.comment,
        DATE_FORMAT(r.review_date, '%d.%m.%Y') as review_date_formatted,
        CASE 
          WHEN r.user_id = ? THEN true
          ELSE false
        END as is_own_review
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.book_id = ?
      ORDER BY r.review_date DESC
    `, [userId, bookId]);

    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / reviews.length;
    }

    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    res.json({
      success: true,
      reviews,
      averageRating: averageRating.toFixed(1),
      totalReviews: reviews.length,
      ratingDistribution
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке отзывов'
    });
  }
});

reviewsRouter.post("/api/:bookId", requireAuth, requireReader, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.session.user.id;
    const { rating, comment, reviewId } = req.body;

    const [loans] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM loans l
      JOIN loan_statuses ls ON l.status_id = ls.id
      WHERE l.user_id = ? AND l.book_id = ? AND ls.name = 'on_loan'
    `, [userId, bookId]);

    if (loans[0].count === 0) {
      return res.status(403).json({
        success: false,
        message: 'Вы можете оставлять отзывы только на книги, которые получали в библиотеке'
      });
    }

    if (reviewId) {
      await pool.execute(
        'UPDATE reviews SET rating = ?, comment = ?, review_date = CURRENT_DATE WHERE id = ? AND user_id = ?',
        [rating, comment, reviewId, userId]
      );

      res.json({
        success: true,
        message: 'Отзыв успешно обновлен',
        reviewId: reviewId
      });
    } else {
      const [result] = await pool.execute(
        'INSERT INTO reviews (user_id, book_id, rating, comment) VALUES (?, ?, ?, ?)',
        [userId, bookId, rating, comment]
      );

      await pool.execute(
        'INSERT INTO activity_logs (user_id, action) VALUES (?, ?)',
        [userId, `Оставил отзыв на книгу ID: ${bookId}`]
      );

      res.json({
        success: true,
        message: 'Отзыв успешно добавлен',
        reviewId: result.insertId
      });
    }
  } catch (error) {
    console.error(error);
    
    if (error.code === 'ER_SIGNAL_EXCEPTION') {
      return res.status(400).json({
        success: false,
        message: 'Вы уже оставляли отзыв на эту книгу'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка при сохранении отзыва'
    });
  }
});

reviewsRouter.delete("/api/:reviewId", requireAuth, requireReader, async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const userId = req.session.user.id;

    const [reviews] = await pool.execute(
      'SELECT id FROM reviews WHERE id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Отзыв не найден или у вас нет прав на его удаление'
      });
    }

    await pool.execute(
      'DELETE FROM reviews WHERE id = ?',
      [reviewId]
    );

    res.json({
      success: true,
      message: 'Отзыв успешно удален'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении отзыва'
    });
  }
});