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
  const [role, setRole] = useState('student');
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
      // 1. If student, check if email is authorized
      let studentClassId = null;
      if (role === 'student') {
        const { data: allowed, error: allowedError } = await supabase
          .from('allowed_students')
          .select('class_id')
          .eq('email', email.toLowerCase())
          .single();

        if (allowedError || !allowed) {
          throw new Error('Seu e-mail não está autorizado pela professora. Entre em contato com ela.');
        }
        studentClassId = allowed.class_id;
      }

      // 2. Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 3. Create profile
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            full_name: fullName,
            role: role,
            class_id: role === 'student' ? studentClassId : null,
          },
        ]);

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          alert('Conta criada! Por favor, verifique seu email para confirmar o acesso.');
          navigate('/login');
          return;
        }
        
        alert('Cadastro realizado com sucesso!');
        
        // Wait a small moment for Supabase to sync session
        setTimeout(() => {
          if (role === 'teacher') {
            navigate('/manage-classes');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Erro no registro:', err);
      setError(err.message || 'Erro ao realizar cadastro.');
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
            <label>Eu sou:</label>
            <select 
              className="form-control" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="student">Aluno(a)</option>
              <option value="teacher">Professor(a)</option>
            </select>
          </div>

          {/* Students don't need to select class anymore, it's automatic based on their email */}
          {role === 'student' && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Sua turma será vinculada automaticamente após o cadastro.
            </p>
          )}

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
