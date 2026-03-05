import 'dotenv/config'; 
import express from 'express';

console.log('Available environment variables:', Object.keys(process.env).filter(k => k.startsWith('DB_') || k === 'PORT'));
import cors from 'cors';
import bodyParser from 'body-parser';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, 'db-config.json');

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); 
app.use(express.static(path.join(__dirname, 'dist')));

// 鉴权中间件
const authMiddleware = (req, res, next) => {
  // 允许登录、初始化、配置和健康检查接口
  const publicPaths = ['/login', '/health', '/init', '/config', '/db/version'];
  if (publicPaths.includes(req.path)) {
    return next();
  }
  
  const commanderId = req.headers['x-commander-id'];
  if (!commanderId) {
    return res.status(401).json({ error: '未授权访问，请先接入作战系统' });
  }
  next();
};

app.use('/api', authMiddleware);

async function getDbConfig() {
  console.log('Checking environment variables for DB config...');
  if (process.env.DB_HOST && process.env.DB_USER) {
    console.log('Found DB config in environment variables:', process.env.DB_HOST);
    return {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'taskpulse'
    };
  }
  console.log('DB config not found in environment, checking db-config.json...');
  try {
    await fs.access(CONFIG_FILE);
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

async function getDbConnection() {
  const config = await getDbConfig();
  if (!config) throw new Error('DB_NOT_CONFIGURED');
  
  console.log('Attempting to connect to database at:', config.host);
  try {
    const conn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      multipleStatements: true
    });
    console.log('Database connection successful');
    return conn;
  } catch (err) {
    console.error('Database connection failed:', err.message);
    throw err;
  }
}

const toCamel = (o) => {
  const newO = { ...o };
  if (newO.group_id) { newO.groupId = newO.group_id; delete newO.group_id; }
  if (newO.assignee_ids) {
    try { newO.assigneeIds = JSON.parse(newO.assignee_ids); } catch (e) { newO.assigneeIds = []; }
    delete newO.assignee_ids;
  }
  if (newO.manager_ids) {
    try { newO.managerIds = JSON.parse(newO.manager_ids); } catch (e) { newO.managerIds = []; }
    delete newO.manager_ids;
  }
  if (newO.start_date) { newO.startDate = newO.start_date; delete newO.start_date; }
  if (newO.due_date) { newO.dueDate = newO.due_date; delete newO.due_date; }
  if (newO.end_date) { newO.endDate = newO.end_date; delete newO.end_date; }
  if (newO.task_id) { newO.taskId = newO.task_id; delete newO.task_id; }
  if (newO.execution_task_id) { newO.executionTaskId = newO.execution_task_id; delete newO.execution_task_id; }
  if (newO.progress_snapshot) { newO.progressSnapshot = newO.progress_snapshot; delete newO.progress_snapshot; }
  if (newO.is_completed !== undefined) { newO.isCompleted = !!newO.is_completed; delete newO.is_completed; }
  if (newO.project_id) { newO.projectId = newO.project_id; delete newO.project_id; }
  if (newO.member_ids) {
    try { newO.memberIds = JSON.parse(newO.member_ids); } catch (e) { newO.memberIds = []; }
    delete newO.member_ids;
  }
  if (newO.member_id) { newO.memberId = newO.member_id; delete newO.member_id; }
  if (newO.visible_to_ids) {
    try { newO.visibleToIds = JSON.parse(newO.visible_to_ids); } catch (e) { newO.visibleToIds = []; }
    delete newO.visible_to_ids;
  }
  return newO;
};

const MIGRATIONS = [
  {
    version: 1,
    description: "初始化基础表结构",
    up: async (conn) => {
      const queries = [
        `CREATE TABLE IF NOT EXISTS \`groups\` (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255))`,
        `CREATE TABLE IF NOT EXISTS members (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), role VARCHAR(255), avatar TEXT, group_id VARCHAR(255))`,
        `CREATE TABLE IF NOT EXISTS projects (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description TEXT, status VARCHAR(50), start_date VARCHAR(50), end_date VARCHAR(50), member_ids TEXT)`,
        `CREATE TABLE IF NOT EXISTS tasks (id VARCHAR(255) PRIMARY KEY, title VARCHAR(255), outcome TEXT, project_id VARCHAR(255), assignee_ids TEXT, manager_ids TEXT, start_date VARCHAR(50), due_date VARCHAR(50), progress INT)`,
        `CREATE TABLE IF NOT EXISTS daily_logs (id VARCHAR(255) PRIMARY KEY, task_id VARCHAR(255), date VARCHAR(50), progress_snapshot INT, note TEXT, execution_task_id VARCHAR(255))`,
        `CREATE TABLE IF NOT EXISTS milestones (id VARCHAR(255) PRIMARY KEY, task_id VARCHAR(255), title VARCHAR(255), outcome TEXT, is_completed BOOLEAN, assignee_ids TEXT, progress INT, start_date VARCHAR(50), due_date VARCHAR(50))`
      ];
      for (const q of queries) await conn.query(q);
    }
  },
  {
    version: 8,
    description: "创建用户表并初始化 admin 指挥官账号",
    up: async (conn) => {
      await conn.query(`CREATE TABLE IF NOT EXISTS users (id VARCHAR(255) PRIMARY KEY, username VARCHAR(255) UNIQUE, password VARCHAR(255), role VARCHAR(50), member_id VARCHAR(255))`);
      await conn.query(`INSERT IGNORE INTO users (id, username, password, role) VALUES ('admin-uuid', 'admin', '123456', 'ADMIN')`);
    }
  },
  {
    version: 9,
    description: "优化用户与成员的关联约束",
    up: async (conn) => {
      await conn.query(`ALTER TABLE users ADD INDEX idx_member_id (member_id)`);
    }
  },
  {
    version: 10,
    description: "创建系统设置表，持久化 AI 配置等参数",
    up: async (conn) => {
      await conn.query(`CREATE TABLE IF NOT EXISTS settings (\`key\` VARCHAR(255) PRIMARY KEY, \`value\` TEXT)`);
    }
  },
  {
    version: 11,
    description: "为拆解任务增加可见性权限字段",
    up: async (conn) => {
      await conn.query(`ALTER TABLE milestones ADD COLUMN visible_to_ids TEXT`);
    }
  }
];

async function runMigrations(connection) {
  await connection.query(`CREATE TABLE IF NOT EXISTS _schema_version (version INT PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  const [rows] = await connection.query("SELECT MAX(version) as v FROM _schema_version");
  const currentVersion = rows[0].v || 0;
  let appliedCount = 0;
  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      try {
        await connection.beginTransaction();
        await migration.up(connection);
        await connection.query("INSERT INTO _schema_version (version) VALUES (?)", [migration.version]);
        await connection.commit();
        appliedCount++;
      } catch (err) {
        await connection.rollback();
        throw new Error(`Migration v${migration.version} 失败: ${err.message}`);
      }
    }
  }
  return { currentVersion: currentVersion + appliedCount, appliedCount };
}

// 系统配置接口
app.get('/api/health', async (req, res) => {
  try {
    const config = await getDbConfig();
    if (!config) return res.json({ status: 'NEED_CONFIG' });
    const connection = await getDbConnection();
    await connection.end();
    res.json({ status: 'OK' });
  } catch (error) {
    if (error.message === 'DB_NOT_CONFIGURED') return res.json({ status: 'NEED_CONFIG' });
    res.json({ status: 'ERROR', message: error.message });
  }
});

app.get('/api/config', async (req, res) => {
  const config = await getDbConfig();
  res.json({ config: config || {} });
});

app.post('/api/config', async (req, res) => {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 数据库初始化接口
app.post('/api/init', async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();
    const result = await runMigrations(connection);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// 数据库版本查询接口
app.get('/api/db/version', async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();
    const [rows] = await connection.query("SELECT MAX(version) as v FROM _schema_version");
    res.json({ version: rows[0].v || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// 系统设置持久化接口 (AI 配置等)
app.get('/api/settings/:key', async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();
    const [rows] = await connection.query('SELECT value FROM settings WHERE `key` = ?', [req.params.key]);
    if (rows.length > 0) {
      res.json({ value: JSON.parse(rows[0].value) });
    } else {
      res.status(404).json({ error: 'Setting not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/api/settings/:key', async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();
    const value = JSON.stringify(req.body);
    await connection.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)', [req.params.key, value]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/api/login', async (req, res) => {
  let connection;
  try {
    const { username, password } = req.body;
    connection = await getDbConnection();
    const [rows] = await connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) {
      const user = toCamel(rows[0]);
      delete user.password;
      res.json({ success: true, user });
    } else {
      res.status(401).json({ error: '指挥官身份核验失败，请检查账号或密钥' });
    }
  } catch (error) { res.status(500).json({ error: error.message }); } finally { if (connection) await connection.end(); }
});

app.post('/api/change-password', async (req, res) => {
  let connection;
  try {
    const { userId, newPassword } = req.body;
    connection = await getDbConnection();
    await connection.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); } finally { if (connection) await connection.end(); }
});

app.get('/api/data', async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();
    const [groups] = await connection.query('SELECT * FROM `groups`');
    const [members] = await connection.query(`
      SELECT m.*, u.username, u.password 
      FROM members m 
      LEFT JOIN users u ON m.id = u.member_id
    `);
    const [projects] = await connection.query('SELECT * FROM projects');
    const [tasks] = await connection.query('SELECT * FROM tasks');
    const [logs] = await connection.query('SELECT * FROM daily_logs');
    const [milestones] = await connection.query('SELECT * FROM milestones');

    const formattedTasks = tasks.map(t => {
      const task = toCamel(t);
      task.logs = logs.filter(l => l.task_id === t.id).map(toCamel);
      task.executionTasks = milestones.filter(m => m.task_id === t.id).map(toCamel);
      return task;
    });

    res.json({
      tasks: formattedTasks,
      members: members.map(toCamel),
      groups: groups.map(toCamel),
      projects: projects.map(toCamel)
    });
  } catch (error) { 
    if (error.message === 'DB_NOT_CONFIGURED' || error.code === 'ECONNREFUSED' || error.code === 'ER_BAD_DB_ERROR') {
       return res.status(503).json({ error: 'DB_NOT_CONFIGURED' });
    }
    res.status(500).json({ error: error.message }); 
  } finally { if (connection) await connection.end(); }
});

app.post('/api/data', async (req, res) => {
  let connection;
  try {
    const { tasks, members, groups, projects } = req.body;
    connection = await getDbConnection();
    await connection.beginTransaction();

    await connection.query('DELETE FROM daily_logs');
    await connection.query('DELETE FROM milestones');
    await connection.query('DELETE FROM tasks');
    await connection.query('DELETE FROM members');
    await connection.query('DELETE FROM `groups`');
    await connection.query('DELETE FROM projects');
    await connection.query("DELETE FROM users WHERE role = 'MEMBER' AND member_id IS NOT NULL");

    if (groups?.length) await connection.query('INSERT INTO `groups` (id, name) VALUES ?', [groups.map(g => [g.id, g.name])]);
    
    if (members?.length) {
      await connection.query('INSERT INTO members (id, name, role, avatar, group_id) VALUES ?', [members.map(m => [m.id, m.name, m.role, m.avatar, m.groupId])]);
      for (const m of members) {
        if (m.username && m.password) {
          await connection.query(
            "INSERT INTO users (id, username, password, role, member_id) VALUES (?, ?, ?, 'MEMBER', ?) ON DUPLICATE KEY UPDATE password = VALUES(password), member_id = VALUES(member_id)",
            [`user-${m.id}`, m.username, m.password, m.id]
          );
        }
      }
    }

    if (projects?.length) await connection.query('INSERT INTO projects (id, name, description, status, start_date, end_date, member_ids) VALUES ?', 
      [projects.map(p => [p.id, p.name, p.description, p.status, p.startDate, p.endDate, JSON.stringify(p.memberIds || [])])]);

    if (tasks?.length) {
      await connection.query('INSERT INTO tasks (id, title, outcome, project_id, assignee_ids, manager_ids, start_date, due_date, progress) VALUES ?', 
        [tasks.map(t => [t.id, t.title, t.outcome, t.projectId || 'default_project', JSON.stringify(t.assigneeIds || []), JSON.stringify(t.managerIds || []), t.startDate, t.dueDate, t.progress])]);
      
      const logValues = [];
      const msValues = [];
      tasks.forEach(t => {
        t.logs?.forEach(l => logValues.push([l.id, t.id, l.date, l.progressSnapshot, l.note, l.executionTaskId || null]));
        t.executionTasks?.forEach(m => msValues.push([m.id, t.id, m.title, m.outcome || '', m.isCompleted, JSON.stringify(m.assigneeIds || []), m.progress || 0, m.startDate, m.dueDate, JSON.stringify(m.visibleToIds || [])]));
      });
      if (logValues.length) await connection.query('INSERT INTO daily_logs (id, task_id, date, progress_snapshot, note, execution_task_id) VALUES ?', [logValues]);
      if (msValues.length) await connection.query('INSERT INTO milestones (id, task_id, title, outcome, is_completed, assignee_ids, progress, start_date, due_date, visible_to_ids) VALUES ?', [msValues]);
    }

    await connection.commit();
    res.json({ success: true });
  } catch (error) { if (connection) await connection.rollback(); res.status(500).json({ error: error.message }); } finally { if (connection) await connection.end(); }
});

app.get('*', (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`后端服务已启动：端口 ${PORT}`));
}

startServer();
