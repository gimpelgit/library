import { Router } from "express";
import { pool } from "../../config/database.js";
import { requireAuth, requireLibrarian } from "../../middleware/auth.js";


export const apiIssueRouter = Router();

apiIssueRouter.post("/", requireAuth, requireLibrarian, async (req, res) => {
  try {
    const { readerId, bookIds, reservationIds, loanDays = 30 } = req.body;
    
    if (!readerId || (!bookIds && !reservationIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Необходимо выбрать читателя и хотя бы одну книгу или бронь' 
      });
    }

    const bookIdArray = Array.isArray(bookIds) ? bookIds : (bookIds ? [bookIds] : []);
    const reservationIdArray = Array.isArray(reservationIds) ? reservationIds : (reservationIds ? [reservationIds] : []);
    
    const loanDate = new Date();
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + parseInt(loanDays));
    
    const [loanStatus] = await pool.execute(
      'SELECT id FROM loan_statuses WHERE name = "on_loan"'
    );
    
    if (loanStatus.length === 0) {
      throw new Error('Статус on_loan не найден');
    }
    
    const statusId = loanStatus[0].id;
    
    // Если есть reservationIds, обрабатываем их
    if (reservationIdArray.length > 0) {
      // Получаем информацию о бронях
      const placeholders = reservationIdArray.map(() => '?').join(',');
      const [reservations] = await pool.execute(
        `SELECT book_id FROM reservations WHERE id IN (${placeholders})`,
        reservationIdArray
      );
      
      // Создаем записи о выдаче для броней
      for (const reservation of reservations) {
        await pool.execute(
          'INSERT INTO loans (user_id, book_id, status_id, loan_date, return_date) VALUES (?, ?, ?, ?, ?)',
          [readerId, reservation.book_id, statusId, loanDate, returnDate]
        );
      }
      
      // Удаляем использованные брони
      await pool.execute(
        `DELETE FROM reservations WHERE id IN (${placeholders})`,
        reservationIdArray
      );
    }
    
    // Если есть обычные bookIds, обрабатываем их
    if (bookIdArray.length > 0) {
      // Проверяем доступность книг
      for (const bookId of bookIdArray) {
        const [books] = await pool.execute(
          'SELECT quantity FROM books WHERE id = ?',
          [bookId]
        );
        
        if (books.length === 0 || books[0].quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: `Книга с ID ${bookId} недоступна для выдачи`
          });
        }
      }
      
      // Создаем записи о выдаче для обычных книг
      for (const bookId of bookIdArray) {
        await pool.execute(
          'INSERT INTO loans (user_id, book_id, status_id, loan_date, return_date) VALUES (?, ?, ?, ?, ?)',
          [readerId, bookId, statusId, loanDate, returnDate]
        );
      }
    }
    
    const totalBooks = reservationIdArray.length + bookIdArray.length;
    
    res.json({ 
      success: true, 
      message: `Успешно оформлена выдача ${totalBooks} книг` 
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при оформлении выдачи' 
    });
  }
});