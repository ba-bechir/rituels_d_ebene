import React, { useEffect, useState } from 'react';

function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/boutique/plantes-brutes')
      .then(res => res.json())
      .then(data => setUtilisateurs(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>Liste des produits</h2>
      <ul>
        {utilisateurs.map(utilisateur => (
          <li key={utilisateur.id}>{utilisateur.email} {utilisateur.mdp} </li>
        ))}
      </ul>
    </div>
  );
}

export default Utilisateurs;
