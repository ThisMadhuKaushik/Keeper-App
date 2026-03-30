import express from "express";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import pg from "pg";
import { authenticateToken } from "./auth.js";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET;
// ✅ Database connection (FINAL)
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ✅ Connect to DB
db.connect()
  .then(() => console.log("Connected to DB"))
  .catch(err => console.error("DB connection error:", err));

// Middlewares
app.use(cors());
app.use(express.json());
// Start server
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});
app.post("/signup", async (req, res) => {
  try {
   const { email, password, name } = req.body;
    // Check if email & password are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    // Check if user already exists
    const existingUser = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Store user in database
     const result = await db.query(
   "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
   [email, name || 'Unknown', hashedPassword]
   );
    const user = result.rows[0];
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    //  Send token with response
    res.status(201).json({
      message: "User created successfully",
      user,
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post('/tasks',authenticateToken, async (req, res) => {
  try {
    const { title, status, user_id } = req.body;

    const result = await db.query(
      `INSERT INTO tasks (title, status, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, status || 'TODO', user_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});
//  GET /users/:user_id/tasks - fetch all tasks for a particular user
app.get('/users/:user_id/tasks',authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    // Query tasks that belong to this user
    const result = await db.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No tasks found for this user' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user tasks' });
  }
});

//  DELETE /tasks/:task_id - delete a task by ID
app.delete("/tasks/:task_id",authenticateToken, async (req, res) => {
  try {
    const { task_id } = req.params;

    // Delete the task
    const result = await db.query(
      "DELETE FROM tasks WHERE task_id = $1 RETURNING *",
      [task_id]
    );

    // If no task found with that ID
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      message: "Task deleted successfully",
      deletedTask: result.rows[0],
    });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});
//  PATCH /tasks/:task_id/status - update task status only
app.patch("/tasks/:task_id/status",authenticateToken, async (req, res) => {
  try {
    const { task_id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["TODO", "INPROGRESS", "DONE"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await db.query(
      `UPDATE tasks
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE task_id = $2
       RETURNING *`,
      [status, task_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      message: "Task status updated successfully",
      updatedTask: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating task status:", err);
    res.status(500).json({ error: "Failed to update task status" });
  }
});
//  PATCH /tasks/:task_id/title - update task title only
app.patch("/tasks/:task_id/title",authenticateToken, async (req, res) => {
  try {
    const { task_id } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const result = await db.query(
      `UPDATE tasks
       SET title = $1, updated_at = CURRENT_TIMESTAMP
       WHERE task_id = $2
       RETURNING *`,
      [title, task_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      message: "Task title updated successfully",
      updatedTask: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating task title:", err);
    res.status(500).json({ error: "Failed to update task title" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    // console.log(user);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.rows[0].id, email: user.rows[0].email },
      jwtSecret,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", user_id:user.rows[0].id ,username:user.rows[0].username,token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
 
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});