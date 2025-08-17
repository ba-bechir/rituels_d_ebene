require('dotenv').config({ path: __dirname + '/../../.env' });
console.log('DB_USER:', process.env.DB_USER);

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

console.log('DB_PASS:', process.env.DB_PASS ? '******' : undefined);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);

const { getConnection } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_JWT = process.env.SECRET_JWT;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// Middleware pour vérifier si l’utilisateur est autorisé
function authorizeManagePortal(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_JWT);
    req.user = decoded; // pour accès dans la route

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' });
  }
}

// Routes publiques
app.get('/boutique/plantes-brutes', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute('SELECT * FROM utilisateur');
    res.json(results);
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/login', async (req, res) => {
  const { email, mdp } = req.body;

  if (!email || !mdp) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute('SELECT email, mdp, role FROM utilisateur WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(mdp, user.mdp);
    if (!validPassword) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const token = jwt.sign({ email: user.email, role: user.role }, SECRET_JWT, { expiresIn: '1h' });
   res.json({ token, role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    if (connection) await connection.end();
  }
});

// Route protégée
app.get('/manage-portal', authorizeManagePortal, (req, res) => {
  
});

app.listen(3001, () => {
  console.log('API démarrée sur http://localhost:3001');
});
