import '../css/Footer.css';
import { FaFacebook, FaInstagram, FaTwitter, FaCcVisa, FaCcPaypal } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
  <div className="footer-section">
    <h4>Liens utiles</h4>
    <a href="/">Accueil</a>
    <a href="/boutique">Boutique</a>
    <a href="/ebooks">E-books</a>
    <a href="/faq">FAQ</a>
    <a href="/apropos">À propos</a>
    <a href="/contact">Contact</a>
  </div>

  <div className="footer-section">
    <h4>Contact & Support</h4>
    <p>Email : support@maboutique.com</p>
    <p>Tél : +33 6 12 34 56 78</p>
    <p>Service client : 9h-18h</p>
  </div>

  <div className="footer-section">
    <h4>Mentions légales</h4>
    <a href="/cgv">CGV</a>
    <a href="/confidentialite">Confidentialité</a>
  </div>

  <div className="footer-section">
    <h4>Newsletter</h4>
    <input type="email" placeholder="Votre email" />
    <button>S’abonner</button>
  </div>

  <div className="footer-section social-payments">
    <div className="social-icons">
      <FaFacebook />
      <FaInstagram />
      <FaTwitter />
    </div>
    <div className="payment-icons">
      <FaCcVisa />
      <FaCcPaypal />
    </div>
  </div>
</footer>

  );
};

export default Footer;
