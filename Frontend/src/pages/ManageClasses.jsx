import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageClasses = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [allowedStudents, setAllowedStudents] = useState([]);
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.role !== 'teacher') {
      navigate('/dashboard');
      return;
    }
    fetchClasses();
    fetchAllowedStudents();
  }, [profile]);

  const fetchAllowedStudents = async () => {
    const { data } = await supabase
      .from('allowed_students')
      .select('*, classes(name)')
      .order('created_at', { ascending: false });
    if (data) setAllowedStudents(data);
  };

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('name');
    if (data) setClasses(data);
    setLoading(false);
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName) return;

    try {
      const { error } = await supabase.from('classes').insert([{ name: newClassName }]);
      if (error) throw error;
      setNewClassName('');
      fetchClasses();
    } catch (err) {
      alert('Erro ao adicionar turma: ' + err.message);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Excluir esta turma removerá todos os materiais vinculados. Continuar?')) return;
    
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
      fetchClasses();
    } catch (err) {
      alert('Erro ao excluir turma: ' + err.message);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!studentEmail || !selectedClass) return;

    try {
      const { error } = await supabase
        .from('allowed_students')
        .insert([{ 
          email: studentEmail.toLowerCase(), 
          class_id: selectedClass,
          added_by: profile.id
        }]);
      
      if (error) throw error;
      setStudentEmail('');
      setSelectedClass('');
      fetchAllowedStudents();
    } catch (err) {
      alert('Erro ao autorizar aluno: ' + err.message);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Remover autorização deste aluno?')) return;
    const { error } = await supabase.from('allowed_students').delete().eq('id', id);
    if (!error) fetchAllowedStudents();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando...</div>;

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '40px' }}>
        <h1>Gerenciar Turmas</h1>
        <p className="text-muted">Adicione ou remova as salas de aula que você leciona.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '40px' }}>
        {/* Classes Column */}
        <section>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>Minhas Turmas</h3>
            <form onSubmit={handleAddClass} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ex: 3º Ano A" 
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary">
                <Plus size={20} />
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {classes.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-soft)', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <button onClick={() => handleDeleteClass(c.id)} style={{ color: '#ff5252', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Students Column */}
        <section>
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Autorizar Alunos</h3>
            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              <input 
                type="email" 
                className="form-control" 
                placeholder="E-mail do Aluno" 
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                required
              />
              <select 
                className="form-control" 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                required
              >
                <option value="">Selecione a Turma</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={20} /> Autorizar E-mail
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              {allowedStudents.map((s) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-soft)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.9rem' }}>
                    <div style={{ fontWeight: 600 }}>{s.email}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Turma: {s.classes?.name}</div>
                  </div>
                  <button onClick={() => handleDeleteStudent(s.id)} style={{ color: '#ff5252', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
          Voltar para o Painel de Conteúdos
        </button>
      </div>
    </div>
  );
};

export default ManageClasses;
