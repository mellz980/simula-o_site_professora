import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GraduationCap } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data, error } = await supabase.from('classes').select('*').order('name');
    if (data) setClasses(data);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create profile
        // Logic: First user is teacher, others are students
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const role = count === 0 ? 'teacher' : 'student';

        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            full_name: fullName,
            role: role,
            class_id: role === 'student' ? classId : null,
          },
        ]);

        if (profileError) throw profileError;
        
        alert('Cadastro realizado com sucesso! Verifique seu email ou faça login.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '450px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '10px' }}><GraduationCap size={48} /></div>
          <h2>Criar Conta</h2>
          <p className="text-muted">Junte-se ao portal da Profa. Fabiana</p>
        </div>

        {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Nome Completo</label>
            <input 
              type="text" 
              className="form-control" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Sua Turma (Apenas para Alunos)</label>
            <select 
              className="form-control" 
              value={classId} 
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Selecione sua turma</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <small style={{ color: 'var(--text-muted)' }}>O primeiro cadastro será definido como Professor.</small>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Processando...' : 'Cadastrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Já tem uma conta? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Entrar</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
