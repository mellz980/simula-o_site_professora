import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="logo">
          <GraduationCap size={32} />
          <span>Profa. Fabiana <span>Nunes</span></span>
        </Link>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {user ? (
            <>
              {profile?.role === 'teacher' && (
                <Link to="/manage-classes" className="btn btn-outline" style={{ padding: '8px 16px' }}>
                  Gerenciar Turmas
                </Link>
              )}
              <Link to="/dashboard" className="btn btn-outline" style={{ padding: '8px 16px' }}>
                Painel
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                <UserIcon size={20} />
                <span style={{ fontWeight: 600 }}>{profile?.full_name || 'Usuário'}</span>
              </div>
              <button onClick={handleSignOut} className="btn btn-primary" style={{ padding: '8px 12px' }}>
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ fontWeight: 600 }}>Entrar</Link>
              <Link to="/register" className="btn btn-primary">Cadastrar</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
