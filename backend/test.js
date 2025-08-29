const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createUser() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'bechir',
    password: 'azerty',
    database: 'rituels_d_ebene',
  });

  const password = 'azerty';
  const hashedPassword = await bcrypt.hash(password, 10);

  await connection.execute(
    'INSERT INTO utilisateur (email, mdp) VALUES (?, ?)',
    ['a@gmail.com', hashedPassword]
  );

  await connection.end();
  console.log('Utilisateur créé avec mot de passe hashé.');
}

createUser();
