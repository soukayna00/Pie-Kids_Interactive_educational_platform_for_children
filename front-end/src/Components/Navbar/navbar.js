import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignInAlt,
  faSignOutAlt,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';
import './navbar.css';

const Navbar = () => {
  const { authState, setAuthState } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthState({
      isAuthenticated: false,
      name: '',
      age: 0,
    });
    navigate('/login');
  };

  return (
    <nav className="pie-navbar" aria-label="Main navigation">
      <Link to="/" className="logo">
  <img src="/assets/pie-kidz-logo.png" alt="PIE KIDZ home" />
</Link>

      <ul className="nav-links">
        <li><Link to="/">About</Link></li>
        <li><Link to="/courses">Explore</Link></li>
        <li><Link to="/TeachWithUs">Teach with us</Link></li>

        {authState.isAuthenticated ? (
          <li>
            <button type="button" className="btn btn-danger" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} aria-hidden="true" /> Logout
            </button>
          </li>
        ) : (
          <>
            <li>
              <Link to="/register" className="signup-button">
                <FontAwesomeIcon icon={faUserPlus} aria-hidden="true" /> Sign Up
              </Link>
            </li>
            <li>
              <Link to="/login" className="signin-button">
                <FontAwesomeIcon icon={faSignInAlt} aria-hidden="true" /> Sign In
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;