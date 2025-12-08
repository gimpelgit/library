import { Router } from "express";
import { pool } from "../../config/database.js";
import { requireAuth, requireLibrarian } from "../../middleware/auth.js";


export const pagesLibrarianRouter = Router();

// /librarian/api/readers
// /librarian/issue
// /librarian/return/:loanId

pagesLibrarianRouter.use(requireAuth);
pagesLibrarianRouter.use(requireLibrarian);

pagesLibrarianRouter.get("/issue", async (req, res) => {
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


pagesLibrarianRouter.get("/return", async (req, res) => {
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
