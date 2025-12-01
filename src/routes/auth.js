import { Router } from "express";
import { pool } from "../config/database.js";
import { hashPassword } from "../utils/hash.js";

export const authRouter = Router();

authRouter.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  
  res.render("auth", {
    error: null,
    success: null,
    user: null,
    page: 'auth',
    title: 'Авторизация'
  });
});

authRouter.post("/register", async (req, res) => {
  const title = 'Авторизация';
  
  try {
    const { name, email, password } = req.body;

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.render("auth", {
        error: "Пользователь с таким email уже существует",
        success: null,
        user: null,
        page: 'auth',
        title: title
      });
    }
    
    const [roles] = await pool.execute(
      'SELECT id FROM roles WHERE name = "reader"'
    );
    
    if (roles.length === 0) {
      throw new Error('Роль reader не найдена');
    }
    
    const roleId = roles[0].id;
    const hashedPassword = hashPassword(password);
    
    await pool.execute(
      'INSERT INTO users (role_id, name, email, password) VALUES (?, ?, ?, ?)',
      [roleId, name, email, hashedPassword]
    );
    
    res.render("auth", {
      error: null,
      success: "Регистрация успешна! Теперь вы можете войти.",
      user: null,
      page: 'auth',
      title: title
    });
    
  } catch (error) {
    console.error(error);
    res.render("auth", {
      error: "Ошибка при регистрации",
      success: null,
      user: null,
      page: 'auth',
      title: title
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = hashPassword(password);
    
    const [users] = await pool.execute(
      `SELECT u.id, u.name, u.email, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ? AND u.password = ?`,
      [email, hashedPassword]
    );
    
    if (users.length === 0) {
      return res.render("auth", {
        error: "Неверный email или пароль",
        success: null,
        user: null,
        page: 'auth',
        title: 'Авторизация'
      });
    }
    
    const user = users[0];
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role_name: user.role_name
    };
    
    res.redirect('/');
    
  } catch (error) {
    console.error(error);
    res.render("auth", {
      error: "Ошибка при входе",
      success: null,
      user: null,
      page: 'auth',
      title: 'Авторизация'
    });
  }
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/');
  });
});