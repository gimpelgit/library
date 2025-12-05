import { Router } from "express";
import { pool } from "../config/database.js";
import { requireAuth, requireLibrarian } from "../middleware/auth.js";

export const librarianRouter = Router();

librarianRouter.use(requireAuth);
librarianRouter.use(requireLibrarian);

// Страница выдачи книг
librarianRouter.get("/issue", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    
    const { title, author, genre } = req.query;
    
    let query = `
      SELECT 
        b.id,
        b.title,
        b.summary,
        b.page_count,
        b.quantity,
        b.cover_image_url,
        GROUP_CONCAT(DISTINCT a.name) as authors,
        GROUP_CONCAT(DISTINCT g.name) as genres
      FROM books b
      LEFT JOIN books_authors ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.id
      LEFT JOIN books_genres bg ON b.id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.id
    `;
    
    const conditions = [];
    const params = [];

    conditions.push("b.quantity > 0");
    
    if (title) {
      conditions.push("b.title LIKE ?");
      params.push(`%${title}%`);
    }
    
    if (author) {
      conditions.push("a.name LIKE ?");
      params.push(`%${author}%`);
    }
    
    if (genre) {
      conditions.push("g.name = ?");
      params.push(genre);
    }
    
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY b.id ORDER BY b.title`;
    
    let [books] = await pool.execute(query, params);
    books = books.slice(offset, offset + limit);

    let countQuery = `
      SELECT COUNT(DISTINCT b.id) as total
      FROM books b
      LEFT JOIN books_authors ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.id
      LEFT JOIN books_genres bg ON b.id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.id
    `;
    
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const [countResult] = await pool.execute(countQuery, params);
    const totalBooks = countResult[0].total;
    const totalPages = Math.ceil(totalBooks / limit);
    
    const [authors] = await pool.execute('SELECT DISTINCT name FROM authors ORDER BY name');
    const [genres] = await pool.execute('SELECT DISTINCT name FROM genres ORDER BY name');
    
    res.render("librarian/issue", {
      user: req.session.user,
      page: 'librarian-issue',
      title: 'Выдача книг',
      books,
      currentPage: page,
      totalPages,
      filters: { title, author, genre },
      authors: authors.map(a => a.name),
      genres: genres.map(g => g.name)
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      user: req.session.user,
      title: 'Ошибка',
      message: 'Произошла ошибка при загрузке книг'
    });
  }
});

// API для поиска читателей
librarianRouter.get("/api/readers", async (req, res) => {
  try {
    const { q } = req.query;
    let query = `
      SELECT u.id, u.name, u.email 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name = 'reader'
    `;
    const params = [];
    
    if (q) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    
    query += ' ORDER BY u.name LIMIT 10';
    
    const [readers] = await pool.execute(query, params);
    res.json(readers);
    
  } catch (error) {
    console.error(error);
    res.status(500).json([]);
  }
});

// Оформление выдачи книг
librarianRouter.post("/issue", async (req, res) => {
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

// Страница возврата книг
librarianRouter.get("/return", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    
    const { readerName, bookTitle } = req.query;
    
    let query = `
      SELECT 
        l.id as loan_id,
        l.loan_date,
        l.return_date,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        b.id as book_id,
        b.title as book_title,
        b.cover_image_url,
        GROUP_CONCAT(DISTINCT a.name) as authors
      FROM loans l
      JOIN users u ON l.user_id = u.id
      JOIN books b ON l.book_id = b.id
      LEFT JOIN books_authors ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.id
      JOIN loan_statuses ls ON l.status_id = ls.id
      WHERE ls.name = 'on_loan'
    `;
    
    const conditions = [];
    const params = [];
    
    if (readerName) {
      conditions.push("u.name LIKE ?");
      params.push(`%${readerName}%`);
    }
    
    if (bookTitle) {
      conditions.push("b.title LIKE ?");
      params.push(`%${bookTitle}%`);
    }
    
    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY l.id ORDER BY l.return_date ASC`;
    
    let [loans] = await pool.execute(query, params);
    const totalLoans = loans.length;
    loans = loans.slice(offset, offset + limit);
    const totalPages = Math.ceil(totalLoans / limit);
    
    res.render("librarian/return", {
      user: req.session.user,
      page: 'librarian-return',
      title: 'Возврат книг',
      loans,
      currentPage: page,
      totalPages,
      filters: { readerName, bookTitle }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      user: req.session.user,
      title: 'Ошибка',
      message: 'Произошла ошибка при загрузке данных'
    });
  }
});

// Обработка возврата книги
librarianRouter.post("/return/:loanId", async (req, res) => {
  try {
    const { loanId } = req.params;
    
    const [returnedStatus] = await pool.execute(
      'SELECT id FROM loan_statuses WHERE name = "returned"'
    );
    
    if (returnedStatus.length === 0) {
      throw new Error('Статус returned не найден');
    }
    
    await pool.execute(
      'UPDATE loans SET status_id = ? WHERE id = ?',
      [returnedStatus[0].id, loanId]
    );
    
    res.json({ 
      success: true, 
      message: 'Книга успешно возвращена' 
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обработке возврата' 
    });
  }
});