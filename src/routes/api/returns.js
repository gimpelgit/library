import { Router } from "express";
import { pool } from "../../config/database.js";
import { requireAuth, requireLibrarian } from "../../middleware/auth.js";


export const apiReturnsRouter = Router();
// librarian/return/:loanId

apiReturnsRouter.post("/:loanId", requireAuth, requireLibrarian, async (req, res) => {
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