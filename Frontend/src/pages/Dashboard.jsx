import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, ExternalLink, FileText, Link as LinkIcon, BookOpen, LayoutGrid, ArrowLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('content');
  const [contentUrl, setContentUrl] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postToAll, setPostToAll] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (user && profile) {
        fetchClasses();
        if (profile.role === 'student' && profile.class_id) {
          fetchMaterials(profile.class_id);
        }
      } else {
        setLoading(false);
      }
    }
  }, [user, profile, authLoading]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase.from('classes').select('*').order('name');
      if (error) throw error;
      if (data) setClasses(data);
    } catch (err) {
      console.error('Erro ao buscar turmas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async (classId) => {
    setLoading(true);
    const { data } = await supabase
      .from('materials')
      .select('*, classes(name)')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });
    
    if (data) setMaterials(data);
    setLoading(false);
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('classes').insert([{ name: newClassName }]);
      if (error) throw error;
      setNewClassName('');
      setShowClassForm(false);
      fetchClasses();
    } catch (err) { alert(err.message); }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const materialData = { 
        title, 
        description, 
        type, 
        content_url: contentUrl, 
        teacher_id: user.id 
      };

      if (postToAll) {
        const inserts = classes.map(c => ({ ...materialData, class_id: c.id }));
        const { error } = await supabase.from('materials').insert(inserts);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('materials').insert([
          { ...materialData, class_id: selectedClass.id }
        ]);
        if (error) throw error;
      }

      setTitle(''); setDescription(''); setContentUrl('');
      setPostToAll(false);
      setShowAddForm(false);
      if (selectedClass) fetchMaterials(selectedClass.id);
    } catch (err) { alert(err.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Excluir este conteúdo?')) return;
    await supabase.from('materials').delete().eq('id', id);
    fetchMaterials(selectedClass.id);
  };

  if (loading || authLoading) return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando...</div>;

  const isTeacher = profile?.role === 'teacher';

  // --- VIEW: STUDENT WITH NO CLASS ---
  if (!isTeacher && !profile?.class_id) {
    return (
      <div className="card fade-in" style={{ textAlign: 'center', padding: '60px', marginTop: '40px' }}>
        <Users size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
        <h2>Ops! Você ainda não tem uma turma vinculada.</h2>
        <p className="text-muted" style={{ marginTop: '10px' }}>
          Peça para sua professora (Fabiana Nunes) autorizar seu e-mail no portal dela. 
          Assim que ela fizer isso, sua turma aparecerá aqui automaticamente.
        </p>
      </div>
    );
  }

  // --- VIEW: CLASS DETAILS (OR STUDENT VIEW) ---
  if (selectedClass || (!isTeacher && profile?.class_id)) {
    const currentClass = selectedClass || classes.find(c => c.id === profile.class_id);
    
    return (
      <div className="fade-in">
        <header style={{ marginBottom: '30px' }}>
          {isTeacher && (
            <button className="btn btn-outline" onClick={() => setSelectedClass(null)} style={{ marginBottom: '20px', padding: '8px 12px' }}>
              <ArrowLeft size={18} /> Voltar para Turmas
            </button>
          )}
            <div>
              <h1>Turma {currentClass?.name}</h1>
              <p className="text-muted">Materiais e conteúdos postados para esta sala</p>
            </div>
            {isTeacher && (
              <button 
                className="btn btn-primary" 
                onClick={() => setShowAddForm(!showAddForm)}
                style={{ padding: '12px 20px', fontSize: '1rem', boxShadow: '0 4px 15px rgba(211, 47, 47, 0.3)' }}
              >
                {showAddForm ? 'Cancelar' : <><Plus size={20} /> Adicionar Conteúdo</>}
              </button>
            )}
        </header>

        {showAddForm && (
          <div className="card fade-in" style={{ marginBottom: '40px', border: '2px solid var(--primary-light)' }}>
            <h3 style={{ marginBottom: '20px' }}>Publicar em {currentClass?.name}</h3>
            <form onSubmit={handleAddMaterial}>
              <div className="form-group">
                <label>Título do Conteúdo / Arquivo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Dê um nome para este material"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Texto Informativo / Descrição</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Digite aqui o conteúdo em texto ou instruções para os alunos..."
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label>Tipo</label>
                  <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="content">Conteúdo de Aula</option>
                    <option value="activity">Atividade</option>
                    <option value="lesson_plan">Plano de Aula</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Link (URL do Arquivo ou Site)</label>
                  <input 
                    type="url" 
                    className="form-control" 
                    placeholder="https://exemplo.com/arquivo.pdf"
                    value={contentUrl} 
                    onChange={(e) => setContentUrl(e.target.value)} 
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <input 
                  type="checkbox" 
                  id="postToAll" 
                  checked={postToAll} 
                  onChange={(e) => setPostToAll(e.target.checked)} 
                  style={{ width: '20px', height: '20px' }}
                />
                <label htmlFor="postToAll" style={{ margin: 0, fontWeight: 600, color: 'var(--primary)' }}>
                  Postar em TODAS as minhas turmas simultaneamente
                </label>
              </div>

              <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%' }}>
                {isSubmitting ? 'Publicando...' : 'Publicar Agora'}
              </button>
            </form>
          </div>
        )}

        <div className="dashboard-grid">
          {materials.length === 0 ? (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
              <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
              <p>Nenhum conteúdo para esta turma.</p>
            </div>
          ) : (
            materials.map(item => (
              <div key={item.id} className="card fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="material-type">{item.type}</span>
                  {isTeacher && <button onClick={() => handleDeleteMaterial(item.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>}
                </div>
                <h3>{item.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '10px 0 20px' }}>{item.description}</p>
                {item.content_url && <a href={item.content_url} target="_blank" className="btn btn-outline" style={{ width: '100%' }}><ExternalLink size={16} /> Acessar</a>}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // --- VIEW: CLASS GRID (TEACHER) ---
  return (
    <div className="fade-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Olá, {profile?.full_name || 'Professora'}!</h1>
          <p className="text-muted">Selecione uma turma para gerenciar conteúdos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowClassForm(!showClassForm)}>
          <Plus size={20} /> Adicionar Turma
        </button>
      </header>

      {showClassForm && (
        <div className="card fade-in" style={{ marginBottom: '30px' }}>
          <h3>Nova Turma</h3>
          <form onSubmit={handleAddClass} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <input type="text" className="form-control" placeholder="Ex: 3º Ano B" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} required />
            <button type="submit" className="btn btn-primary">Criar</button>
          </form>
        </div>
      )}

      <div className="dashboard-grid">
        {classes.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px' }}>
            <Users size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
            <p>Você ainda não tem turmas. Clique em "Adicionar Turma" para começar.</p>
          </div>
        ) : (
          classes.map(c => (
            <div key={c.id} className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: '40px' }} onClick={() => { setSelectedClass(c); fetchMaterials(c.id); }}>
              <div style={{ background: 'var(--bg-soft)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--primary)' }}>
                <Users size={30} />
              </div>
              <h2 style={{ fontSize: '1.5rem' }}>Turma {c.name}</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Clique para abrir</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
