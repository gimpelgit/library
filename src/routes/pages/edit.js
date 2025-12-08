import { Router } from "express";
import { pool } from "../../config/database.js";
import { requireAuth, requireLibrarian } from "../../middleware/auth.js";

export const pagesEditRouter = Router();

pagesEditRouter.use(requireAuth);
pagesEditRouter.use(requireLibrarian);


pagesEditRouter.get("/", async (req, res) => {
  try {
    // Получаем статистику для отображения в карточках
    const [authorsCount] = await pool.execute('SELECT COUNT(*) as count FROM authors');
    const [genresCount] = await pool.execute('SELECT COUNT(*) as count FROM genres');
    const [booksCount] = await pool.execute('SELECT COUNT(*) as count FROM books');
    
    res.render("edit/index", {
      user: req.session.user,
      page: 'edit',
      title: 'Редактирование',
      stats: {
        authors: authorsCount[0].count,
        genres: genresCount[0].count,
        books: booksCount[0].count
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      user: req.session.user,
      title: 'Ошибка',
      message: 'Произошла ошибка при загрузке страницы редактирования'
    });
  }
});


pagesEditRouter.get("/authors", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search } = req.query;
    
    let query = 'SELECT * FROM authors';
    let countQuery = 'SELECT COUNT(*) as total FROM authors';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' WHERE name LIKE ?';
      countQuery += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }
    query += ' ORDER BY name';
    
    let [authors] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    authors = authors.slice(offset, offset + limit);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.render("edit/authors", {
      user: req.session.user,
      page: 'edit-authors',
      title: 'Редактирование авторов',
      authors,
      currentPage: page,
      totalPages,
      search: search || ''
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      user: req.session.user,
      title: 'Ошибка',
      message: 'Произошла ошибка при загрузке авторов'
    });
  }
});


pagesEditRouter.get("/genres", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search } = req.query;
    
    let query = 'SELECT * FROM genres';
    let countQuery = 'SELECT COUNT(*) as total FROM genres';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' WHERE name LIKE ?';
      countQuery += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }   
    query += ' ORDER BY name';
    
    let [genres] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    genres = genres.slice(offset, offset + limit);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.render("edit/genres", {
      user: req.session.user,
      page: 'edit-genres',
      title: 'Редактирование жанров',
      genres,
      currentPage: page,
      totalPages,
      search: search || ''
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      user: req.session.user,
      title: 'Ошибка',
      message: 'Произошла ошибка при загрузке жанров'
    });
  }
});


pagesEditRouter.get("/books", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, author, genre } = req.query;
    
    let query = `
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
    `;
    
    let countQuery = 'SELECT COUNT(DISTINCT b.id) as total FROM books b';
    const conditions = [];
    const params = [];
    const countParams = [];
    
    if (search) {
      conditions.push("b.title LIKE ?");
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }
    
    if (author) {
      conditions.push("a.name LIKE ?");
      params.push(`%${author}%`);
      countParams.push(`%${author}%`);
    }
    
    if (genre) {
      conditions.push("g.name = ?");
      params.push(genre);
      countParams.push(genre);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
      countQuery += ` LEFT JOIN books_authors ba ON b.id = ba.book_id 
                     LEFT JOIN authors a ON ba.author_id = a.id
                     LEFT JOIN books_genres bg ON b.id = bg.book_id
                     LEFT JOIN genres g ON bg.genre_id = g.id
                     WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY b.id ORDER BY b.title`;
    
    let [books] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    books = books.slice(offset, offset + limit);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    // Получить всех авторов и жанры для форм
    const [authors] = await pool.execute('SELECT * FROM authors ORDER BY name');
    const [genres] = await pool.execute('SELECT * FROM genres ORDER BY name');
    
    res.render("edit/books", {
      user: req.session.user,
      page: 'edit-books',
      title: 'Редактирование книг',
      books,
      authors,
      genres,
      currentPage: page,
      totalPages,
      filters: { search, author, genre }
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

pagesEditRouter.get("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === 'new') {
      // Новая книга
      const [authors] = await pool.execute('SELECT * FROM authors ORDER BY name');
      const [genres] = await pool.execute('SELECT * FROM genres ORDER BY name');
      
      return res.render("edit/book-edit", {
        user: req.session.user,
        page: 'edit-books',
        title: 'Добавление книги',
        book: {
          id: null,
          title: '',
          summary: '',
          page_count: '',
          quantity: 1,
          cover_image_url: '',
          author_ids: [],
          genre_ids: []
        },
        authors,
        genres
      });
    }
    
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
      return res.status(404).render("error", {
        user: req.session.user,
        title: 'Книга не найдена',
        message: 'Запрошенная книга не существует'
      });
    }
    
    const book = books[0];
    
    // Преобразуем строки в массивы
    book.author_ids = book.author_ids ? book.author_ids.split(',').map(Number) : [];
    book.genre_ids = book.genre_ids ? book.genre_ids.split(',').map(Number) : [];
    
    res.render("edit/book-edit", {
      user: req.session.user,
      page: 'edit-books',
      title: 'Редактирование книги',
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