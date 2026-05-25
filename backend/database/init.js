const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'kudos.db');

function initDatabase() {
  const db = new Database(DB_PATH);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      department VARCHAR(100),
      role VARCHAR(20) DEFAULT 'user',
      join_date DATE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kudos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_visible BOOLEAN DEFAULT TRUE,
      moderated_by INTEGER,
      moderated_at TIMESTAMP,
      moderation_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id),
      FOREIGN KEY (moderated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kudos_id INTEGER NOT NULL,
      reporter_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      reviewed_by INTEGER,
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (kudos_id) REFERENCES kudos(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      kudos_id INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (kudos_id) REFERENCES kudos(id)
    );

    CREATE INDEX IF NOT EXISTS idx_kudos_sender ON kudos(sender_id);
    CREATE INDEX IF NOT EXISTS idx_kudos_recipient ON kudos(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_kudos_visible ON kudos(is_visible);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_kudos ON reports(kudos_id);
  `);

  // Seed demo users
  const users = [
    { employee_id: 'EMP001', name: 'Alice Johnson', email: 'alice@company.com', password: 'password123', department: 'Engineering', role: 'admin', join_date: '2022-01-15' },
    { employee_id: 'EMP002', name: 'Bob Smith', email: 'bob@company.com', password: 'password123', department: 'Design', role: 'user', join_date: '2022-03-20' },
    { employee_id: 'EMP003', name: 'Carol White', email: 'carol@company.com', password: 'password123', department: 'Product', role: 'user', join_date: '2021-11-05' },
    { employee_id: 'EMP004', name: 'David Lee', email: 'david@company.com', password: 'password123', department: 'Engineering', role: 'user', join_date: '2023-02-10' },
    { employee_id: 'EMP005', name: 'Emma Davis', email: 'emma@company.com', password: 'password123', department: 'Marketing', role: 'user', join_date: '2022-07-18' },
    { employee_id: 'EMP006', name: 'Frank Miller', email: 'frank@company.com', password: 'password123', department: 'Sales', role: 'user', join_date: '2021-09-30' },
    { employee_id: 'EMP007', name: 'Grace Kim', email: 'grace@company.com', password: 'password123', department: 'HR', role: 'user', join_date: '2023-05-22' },
    { employee_id: 'EMP008', name: 'Henry Brown', email: 'henry@company.com', password: 'password123', department: 'Finance', role: 'user', join_date: '2022-12-01' },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (employee_id, name, email, password_hash, department, role, join_date)
    VALUES (@employee_id, @name, @email, @password_hash, @department, @role, @join_date)
  `);

  for (const user of users) {
    const password_hash = bcrypt.hashSync(user.password, 10);
    insertUser.run({ ...user, password_hash });
  }

  // Seed demo kudos
  const existingKudos = db.prepare('SELECT COUNT(*) as count FROM kudos').get();
  if (existingKudos.count === 0) {
    const kudosSeed = [
      { sender_id: 2, recipient_id: 1, message: "Alice, your code review on the authentication module was incredibly thorough. You caught three edge cases I completely missed. Thank you for making our codebase stronger!" },
      { sender_id: 3, recipient_id: 2, message: "Bob's redesign of the onboarding flow is stunning! User testing scores went up 40%. This is exactly the kind of impactful work that makes a difference." },
      { sender_id: 1, recipient_id: 3, message: "Carol, the product roadmap you presented was crystal clear. You anticipated every stakeholder question before it was asked. Truly excellent preparation!" },
      { sender_id: 4, recipient_id: 5, message: "Emma's campaign launch was flawlessly executed. The attention to detail and the way she coordinated with all teams was outstanding!" },
      { sender_id: 5, recipient_id: 4, message: "David just solved a production bug that had us stumped for two days. He stayed late, stayed calm, and wrote a post-mortem that helped the whole team learn." },
      { sender_id: 6, recipient_id: 7, message: "Grace handled our new hire onboarding with so much warmth and efficiency. Everyone feels welcomed and ready to contribute from day one." },
      { sender_id: 7, recipient_id: 8, message: "Henry's quarterly financial report was the clearest, most actionable one we've ever received. It genuinely changed how leadership is thinking about Q4." },
      { sender_id: 8, recipient_id: 6, message: "Frank closed the biggest deal of the quarter and brought the entire team along for the ride, sharing his playbook and lifting everyone's performance." },
    ];

    const insertKudos = db.prepare(`
      INSERT INTO kudos (sender_id, recipient_id, message) VALUES (@sender_id, @recipient_id, @message)
    `);
    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, kudos_id, type) VALUES (@user_id, @kudos_id, 'kudos_received')
    `);

    for (const k of kudosSeed) {
      const result = insertKudos.run(k);
      insertNotif.run({ user_id: k.recipient_id, kudos_id: result.lastInsertRowid });
    }
  }

  db.close();
  console.log('✅ Database initialized successfully');
}

initDatabase();
module.exports = { DB_PATH };
