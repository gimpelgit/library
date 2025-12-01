import { Router } from "express";
import { pool } from "../config/database.js";

export const booksRouter = Router();

// Главная страница с книгами
booksRouter.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    
    const { title, author, genre, available } = req.query;
    
    // Базовый запрос для книг
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
    
    // Фильтры
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
    
    if (available === 'true') {
      conditions.push("b.quantity > 0");
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY b.id ORDER BY b.title`;
    
    // Получение книг
    let [books] = await pool.execute(query, params);
    books = books.slice(offset, offset + limit);

    // Подсчет общего количества для пагинации
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
    
    // Получение всех авторов и жанров для автокомплита
    const [authors] = await pool.execute('SELECT DISTINCT name FROM authors ORDER BY name');
    const [genres] = await pool.execute('SELECT DISTINCT name FROM genres ORDER BY name');
    
    res.render("books", {
      user: req.session.user,
      page: 'books',
      title: 'Каталог книг',
      books,
      currentPage: page,
      totalPages,
      filters: { title, author, genre, available },
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

// Страница детального просмотра книги
booksRouter.get("/:id", async (req, res) => {
  try {
    const bookId = req.params.id;
    
    const [books] = await pool.execute(`
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
      WHERE b.id = ?
      GROUP BY b.id
    `, [bookId]);
    
    if (books.length === 0) {
      return res.status(404).render("error", {
        user: req.session.user,
        title: 'Книга не найдена',
        message: 'Запрошенная книга не существует'
      });
    }
    
    const book = books[0];
    
    res.render("book-detail", {
      user: req.session.user,
      page: 'book-detail',
      title: book.title,
      book
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      user: req.session.user,
      title: 'Ошибка',
      message: 'Произошла ошибка при загрузке книги'
    });
  }
});

// API для автокомплита авторов
booksRouter.get("/api/authors", async (req, res) => {
  try {
    const { q } = req.query;
    let query = 'SELECT DISTINCT name FROM authors';
    const params = [];
    
    if (q) {
      query += ' WHERE name LIKE ?';
      params.push(`%${q}%`);
    }
    
    query += ' ORDER BY name LIMIT 10';
    
    const [authors] = await pool.execute(query, params);
    res.json(authors.map(a => a.name));
    
  } catch (error) {
    console.error(error);
    res.status(500).json([]);
  }
});

// API для автокомплита жанров
booksRouter.get("/api/genres", async (req, res) => {
  try {
    const { q } = req.query;
    let query = 'SELECT DISTINCT name FROM genres';
    const params = [];
    
    if (q) {
      query += ' WHERE name LIKE ?';
      params.push(`%${q}%`);
    }
    
    query += ' ORDER BY name LIMIT 10';
    
    const [genres] = await pool.execute(query, params);
    res.json(genres.map(g => g.name));
    
  } catch (error) {
    console.error(error);
    res.status(500).json([]);
  }
});