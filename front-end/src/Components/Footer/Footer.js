import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="pie-footer">
      <div className="pie-footer__inner">
        <Link to="/" className="pie-footer__logo">
          <img src="/assets/pie-kidz-logo.png" alt="PIE KIDZ home" />
        </Link>

        <nav className="pie-footer__links" aria-label="Footer navigation">
          <Link to="/courses">Explore</Link>
          <Link to="/TeachWithUs">Teach with us</Link>
        </nav>

        <p className="pie-footer__copyright">
          © {new Date().getFullYear()} PIE KIDZ. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;