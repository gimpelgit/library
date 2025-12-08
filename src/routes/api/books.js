import { Router } from "express";
import { pool } from "../../config/database.js";
import { requireAuth, requireLibrarian } from "../../middleware/auth.js";


export const apiBooksRouter = Router();


apiBooksRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [books] = await pool.execute(`
      SELECT 
        b.*,
        GROUP_CONCAT(DISTINCT a.id) as author_ids,
        GROUP_CONCAT(DISTINCT a.name) as author_names,
        GROUP_CONCAT(DISTINCT g.id) as genre_ids,
        GROUP_CONCAT(DISTINCT g.name) as genre_names
      FROM books b
      LEFT JOIN books_authors ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.id
      LEFT JOIN books_genres bg ON b.id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.id
      WHERE b.id = ?
      GROUP BY b.id
    `, [id]);
    
    if (books.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Книга не найдена' 
      });
    }
    
    const book = books[0];
    
    // Получить всех авторов и жанры для форм
    const [authors] = await pool.execute('SELECT * FROM authors ORDER BY name');
    const [genres] = await pool.execute('SELECT * FROM genres ORDER BY name');
    
    // Преобразовать строки в массивы
    book.author_ids = book.author_ids ? book.author_ids.split(',').map(Number) : [];
    book.genre_ids = book.genre_ids ? book.genre_ids.split(',').map(Number) : [];
    
    res.json({ 
      success: true, 
      data: {
        book,
        authors,
        genres
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при загрузке книги' 
    });
  }
});


apiBooksRouter.post("/", requireAuth, requireLibrarian, async (req, res) => {
  try {
    const { title, summary, page_count, quantity, authorIds = [], genreIds = [] } = req.body;
    
    if (!title || !summary || !page_count || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Заполните все обязательные поля' 
      });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO books (title, summary, page_count, quantity) VALUES (?, ?, ?, ?)',
      [title, summary, parseInt(page_count), parseInt(quantity)]
    );
    
    const bookId = result.insertId;
    
    // Добавление авторов
    for (const authorId of authorIds) {
      await pool.execute(
        'INSERT INTO books_authors (book_id, author_id) VALUES (?, ?)',
        [bookId, authorId]
      );
    }
    
    // Добавление жанров
    for (const genreId of genreIds) {
      await pool.execute(
        'INSERT INTO books_genres (book_id, genre_id) VALUES (?, ?)',
        [bookId, genreId]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Книга успешно добавлена',
      bookId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при добавлении книги' 
    });
  }
});


apiBooksRouter.put("/:id", requireAuth, requireLibrarian, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, page_count, quantity, authorIds = [], genreIds = [] } = req.body;
    
    if (!title || !summary || !page_count || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Заполните все обязательные поля' 
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE books SET title = ?, summary = ?, page_count = ?, quantity = ? WHERE id = ?',
      [title, summary, parseInt(page_count), parseInt(quantity), id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Книга не найдена' 
      });
    }
    
    // Удалить старых авторов и добавить новых
    await pool.execute('DELETE FROM books_authors WHERE book_id = ?', [id]);
    for (const authorId of authorIds) {
      await pool.execute(
        'INSERT INTO books_authors (book_id, author_id) VALUES (?, ?)',
        [id, authorId]
      );
    }
    
    // Удалить старые жанры и добавить новые
    await pool.execute('DELETE FROM books_genres WHERE book_id = ?', [id]);
    for (const genreId of genreIds) {
      await pool.execute(
        'INSERT INTO books_genres (book_id, genre_id) VALUES (?, ?)',
        [id, genreId]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Книга успешно обновлена' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении книги' 
    });
  }
});


apiBooksRouter.delete("/:id", requireAuth, requireLibrarian, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [activeLoans] = await pool.execute(
      `SELECT COUNT(*) as count FROM loans l 
       JOIN loan_statuses ls ON l.status_id = ls.id 
       WHERE l.book_id = ? AND ls.name = 'on_loan'`,
      [id]
    );
    
    const [activeReservations] = await pool.execute(
      'SELECT COUNT(*) as count FROM reservations WHERE book_id = ?',
      [id]
    );
    
    if (activeLoans[0].count > 0 || activeReservations[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Невозможно удалить книгу, так как она выдана или забронирована' 
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM books WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Книга не найдена' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Книга успешно удалена' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении книги' 
    });
  }
});