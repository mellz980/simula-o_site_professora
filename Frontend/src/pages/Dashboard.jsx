import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, ExternalLink, FileText, Link as LinkIcon, BookOpen } from 'lucide-react';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('content');
  const [contentUrl, setContentUrl] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && profile) {
      fetchClasses();
      fetchMaterials();
    }
  }, [user, profile]);

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('name');
    if (data) setClasses(data);
  };

  const fetchMaterials = async () => {
    setLoading(true);
    let query = supabase
      .from('materials')
      .select('*, classes(name)')
      .order('created_at', { ascending: false });

    // Students only see their class (Handled by RLS, but we can double check here)
    if (profile?.role === 'student' && profile.class_id) {
      query = query.eq('class_id', profile.class_id);
    }

    const { data, error } = await query;
    if (data) setMaterials(data);
    setLoading(false);
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('materials').insert([
        {
          title,
          description,
          type,
          content_url: contentUrl,
          class_id: targetClass,
          teacher_id: user.id
        }
      ]);

      if (error) throw error;

      // Reset form
      setTitle('');
      setDescription('');
      setContentUrl('');
      setTargetClass('');
      setShowAddForm(false);
      fetchMaterials();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este conteúdo?')) return;
    
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (!error) fetchMaterials();
    else alert(error.message);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando conteúdos...</div>;

  const isTeacher = profile?.role === 'teacher';

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1>Olá, {profile?.full_name?.split(' ')[0]}!</h1>
          <p className="text-muted">
            {isTeacher 
              ? 'Gerencie os materiais e conteúdos de suas turmas.' 
              : `Conteúdos para a turma ${profile?.classes?.name || ''}`}
          </p>
        </div>
        {isTeacher && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={20} /> {showAddForm ? 'Cancelar' : 'Novo Conteúdo'}
          </button>
        )}
      </header>

      {showAddForm && isTeacher && (
        <div className="card" style={{ marginBottom: '40px', border: '2px solid var(--primary-light)' }}>
          <h3 style={{ marginBottom: '20px' }}>Publicar Novo Conteúdo</h3>
          <form onSubmit={handleAddMaterial}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Título</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Ex: Atividade de Matemática - Frações" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Turma</label>
                <select 
                  className="form-control" 
                  value={targetClass} 
                  onChange={(e) => setTargetClass(e.target.value)} 
                  required
                >
                  <option value="">Selecione a turma</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Descrição / Instruções</label>
              <textarea 
                className="form-control" 
                rows="3" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explique o que o aluno deve fazer..."
              ></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Tipo de Conteúdo</label>
                <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="content">Conteúdo de Aula</option>
                  <option value="activity">Atividade</option>
                  <option value="lesson_plan">Plano de Aula</option>
                </select>
              </div>
              <div className="form-group">
                <label>Link ou URL do Arquivo</label>
                <input 
                  type="url" 
                  className="form-control" 
                  value={contentUrl} 
                  onChange={(e) => setContentUrl(e.target.value)} 
                  placeholder="https://drive.google.com/..." 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Publicando...' : 'Publicar Agora'}
            </button>
          </form>
        </div>
      )}

      <div className="dashboard-grid">
        {materials.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <BookOpen size={48} style={{ marginBottom: '20px', opacity: 0.3 }} />
            <h3>Nenhum conteúdo postado ainda.</h3>
            {isTeacher && <p>Comece criando sua primeira atividade!</p>}
          </div>
        ) : (
          materials.map((item) => (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <span className="material-type">
                  {item.type === 'activity' && <><FileText size={14} /> Atividade</>}
                  {item.type === 'lesson_plan' && <><BookOpen size={14} /> Plano de Aula</>}
                  {item.type === 'content' && <><LinkIcon size={14} /> Conteúdo</>}
                </span>
                {isTeacher && (
                  <button 
                    onClick={() => handleDelete(item.id)}
                    style={{ background: 'transparent', border: 'none', color: '#ff5252', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              
              <span className="class-badge">Turma {item.classes?.name}</span>
              <h3 style={{ marginBottom: '10px' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px' }}>
                {item.description}
              </p>

              {item.content_url && (
                <a 
                  href={item.content_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-outline" 
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <ExternalLink size={16} /> Acessar Material
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
