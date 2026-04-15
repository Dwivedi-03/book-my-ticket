import express from "express";
import dotenv from "dotenv";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import session from "express-session";
import bcrypt from "bcrypt";
import crypto from "crypto";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = process.env.PORT || 8080;

const pool = new pg.Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
});

const app = express();
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: "stellar-cinema-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).send({ error: "Not authenticated" });
  }
};

async function sendEmail(to, link) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your@gmail.com",
      pass: "your-app-password",
    },
  });

  await transporter.sendMail({
    from: "🎌 Shinjuku Cinema",
    to,
    subject: "Reset Your Password",
    html: `
      <h2>Password Reset</h2>
      <p>Click below to reset:</p>
      <a href="${link}">${link}</a>
      <p>Valid for 15 minutes</p>
    `,
  });
}

// Serve the single HTML page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Test route
app.get("/api", async (req, res) => {
  res.json({ message: "Movie Ticket API Running 🚀" });
});

// Auth endpoints
app.post("/api/signup", async (req, res) => {
  try {
    const { firstname, lastname, username, email, password } = req.body;

    if ( !firstname || !lastname || !username || !email || !password) {
      return res.status(400).send({ error: "All fields are required" });
    }

    const checkUser = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );

    if (checkUser.rowCount > 0) {
      return res.status(400).send({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (first_name, last_name, username, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email",
      [firstname, lastname, username, email, hashedPassword],
    );

    res.send({
      success: true,
      message: "Account created successfully",
      user: result.rows[0],
    });
  } catch (ex) {
    console.error(ex);
    res.status(500).send({ error: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send({ error: "Username and password are required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (result.rowCount === 0) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    res.send({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (ex) {
    console.error(ex);
    res.status(500).send({ error: "Server error" });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send({ error: "Could not log out" });
    }
    res.send({ success: true });
  });
});

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

    if (!user.rows.length) {
      return res.json({ message: "If email exists, reset link sent" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      "UPDATE users SET reset_token=$1, reset_token_expiry=$2 WHERE email=$3",
      [token, expiry, email]
    );

    const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;

    // TEMP: console instead of email (recommended for now)
    console.log("RESET LINK:", resetLink);

    res.json({ message: "Reset link generated (check console)" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// app.post("/api/forgot-password", async (req, res) => {
//   const { email } = req.body;

//   const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

//   if (!user.rows.length) {
//     return res.json({ message: "If email exists, reset link sent" });
//   }

//   const token = crypto.randomBytes(32).toString("hex");

//   const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

//   await db.query(
//     "UPDATE users SET reset_token=$1, reset_token_expiry=$2 WHERE email=$3",
//     [token, expiry, email],
//   );

//   const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;

//   await sendEmail(email, resetLink);

//   res.json({ message: "Reset link sent 🎌" });
// });

app.get("/api/check-auth", (req, res) => {
  if (req.session.userId) {
    res.send({
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
      },
    });
  } else {
    res.send({ authenticated: false });
  }
});

// Seat booking endpoints (protected)
app.get("/api/seats", isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM seats ORDER BY id");
    res.send(result.rows);
  } catch (ex) {
    console.error(ex);
    res.status(500).send({ error: "Server error" });
  }
});

app.put("/api/book/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.session.userId;
    const username = req.session.username;

    const conn = await pool.connect();

    await conn.query("BEGIN");

    const sql = "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE";
    const result = await conn.query(sql, [id]);

    if (result.rowCount === 0) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.status(400).send({ error: "Seat already booked" });
    }

    const sqlU =
      "UPDATE seats SET isbooked = 1, name = $2, user_id = $3, booked_at = NOW() WHERE id = $1";
    await conn.query(sqlU, [id, username, userId]);

    await conn.query("COMMIT");
    conn.release();

    res.send({
      success: true,
      message: "Seat booked successfully",
      seatId: id,
      bookedBy: username,
    });
  } catch (ex) {
    console.error(ex);
    res.status(500).send({ error: "Server error" });
  }
});

app.get("/api/my-bookings", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const result = await pool.query(
      "SELECT * FROM seats WHERE user_id = $1 ORDER BY booked_at DESC",
      [userId],
    );
    res.send(result.rows);
  } catch (ex) {
    console.error(ex);
    res.status(500).send({ error: "Server error" });
  }
});

app.listen(port, () => console.log("Server starting on port: " + port));
