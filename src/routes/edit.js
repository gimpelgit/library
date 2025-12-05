import { Router } from "express";
import { pool } from "../config/database.js";
import { requireAuth, requireLibrarian } from "../middleware/auth.js";

export const editRouter = Router();

editRouter.use(requireAuth);
editRouter.use(requireLibrarian);

// Главная страница редактирования с сеткой
editRouter.get("/", async (req, res) => {
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

// CRUD для авторов
editRouter.get("/authors", async (req, res) => {
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

editRouter.post("/authors", async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Имя автора не может быть пустым' 
      });
    }
    
    await pool.execute(
      'INSERT INTO authors (name) VALUES (?)',
      [name.trim()]
    );
    
    res.json({ 
      success: true, 
      message: 'Автор успешно добавлен' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при добавлении автора' 
    });
  }
});

editRouter.put("/authors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Имя автора не может быть пустым' 
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE authors SET name = ? WHERE id = ?',
      [name.trim(), id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Автор не найден' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Автор успешно обновлен' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении автора' 
    });
  }
});

editRouter.delete("/authors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, есть ли книги у этого автора
    const [books] = await pool.execute(
      'SELECT COUNT(*) as count FROM books_authors WHERE author_id = ?',
      [id]
    );
    
    if (books[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Невозможно удалить автора, так как с ним связаны книги' 
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM authors WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Автор не найден' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Автор успешно удален' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении автора' 
    });
  }
});

// CRUD для жанров
editRouter.get("/genres", async (req, res) => {
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

editRouter.post("/genres", async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Название жанра не может быть пустым' 
      });
    }
    
    await pool.execute(
      'INSERT INTO genres (name) VALUES (?)',
      [name.trim()]
    );
    
    res.json({ 
      success: true, 
      message: 'Жанр успешно добавлен' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при добавлении жанра' 
    });
  }
});

editRouter.put("/genres/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Название жанра не может быть пустым' 
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE genres SET name = ? WHERE id = ?',
      [name.trim(), id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Жанр не найден' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Жанр успешно обновлен' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении жанра' 
    });
  }
});

editRouter.delete("/genres/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, есть ли книги в этом жанре
    const [books] = await pool.execute(
      'SELECT COUNT(*) as count FROM books_genres WHERE genre_id = ?',
      [id]
    );
    
    if (books[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Невозможно удалить жанр, так как с ним связаны книги' 
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM genres WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Жанр не найден' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Жанр успешно удален' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении жанра' 
    });
  }
});