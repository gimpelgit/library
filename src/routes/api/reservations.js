import { Router } from "express";
import { pool } from "../../config/database.js";
import { requireAuth, requireLibrarian, requireReader } from "../../middleware/auth.js";


export const apiReservationsRouter = Router();

apiReservationsRouter.use(requireAuth);

apiReservationsRouter.get("/readers/:readerId", async (req, res) => {
  try {
    const { readerId } = req.params;
    
    const [reservations] = await pool.execute(`
      SELECT 
        r.id as reservation_id,
        r.reserved_until,
        b.id as book_id,
        b.title,
        b.summary,
        b.page_count,
        b.quantity,
        b.cover_image_url,
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
    `, [readerId]);
    
    res.json(reservations);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при загрузке броней' 
    });
  }
});

apiReservationsRouter.post("/", requireReader, async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.session.user.id;
    
    if (!bookId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Не указан ID книги' 
      });
    }
    
    // Проверяем, доступна ли книга
    const [books] = await pool.execute(
      'SELECT quantity FROM books WHERE id = ?',
      [bookId]
    );
    
    if (books.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Книга не найдена' 
      });
    }
    
    if (books[0].quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Книга недоступна для бронирования' 
      });
    }
    
    // Проверяем, не забронировал ли пользователь уже эту книгу
    const [existingReservations] = await pool.execute(
      'SELECT id FROM reservations WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );
    
    if (existingReservations.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Вы уже забронировали эту книгу' 
      });
    }
    
    // Рассчитываем дату окончания брони (3 дня)
    const reservedUntil = new Date();
    reservedUntil.setDate(reservedUntil.getDate() + 3);
    
    // Создаем бронирование
    await pool.execute(
      'INSERT INTO reservations (user_id, book_id, reserved_until) VALUES (?, ?, ?)',
      [userId, bookId, reservedUntil]
    );
    
    res.json({ 
      success: true, 
      message: 'Книга успешно забронирована',
      reservedUntil: reservedUntil.toLocaleDateString('ru-RU')
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при бронировании книги' 
    });
  }
});

apiReservationsRouter.post("/cancel/:id", requireReader, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    
    // Проверяем, принадлежит ли бронирование пользователю
    const [reservations] = await pool.execute(
      'SELECT id FROM reservations WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (reservations.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Бронирование не найдено' 
      });
    }
    
    // Удаляем бронирование
    await pool.execute(
      'DELETE FROM reservations WHERE id = ?',
      [id]
    );
    
    res.json({ 
      success: true, 
      message: 'Бронирование успешно отменено' 
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при отмене бронирования' 
    });
  }
});