import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Link as LinkIcon, Users } from 'lucide-react';

const Home = () => {
  return (
    <div className="fade-in">
      <section style={{ textAlign: 'center', padding: '60px 0' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '20px', color: 'var(--primary)' }}>
          Bem-vindo ao Portal de Estudos
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto 40px' }}>
          Espaço dedicado para os alunos da Professora Fabiana Nunes acessarem atividades, 
          planos de aula e conteúdos exclusivos de cada turma.
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 32px' }}>
            Começar Agora
          </Link>
          <Link to="/login" className="btn btn-outline" style={{ fontSize: '1.1rem', padding: '14px 32px' }}>
            Já tenho conta
          </Link>
        </div>
      </section>

      <div className="dashboard-grid" style={{ marginTop: '60px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '15px' }}><FileText size={40} /></div>
          <h3>Atividades</h3>
          <p>Acesse as tarefas e exercícios propostos em sala de aula.</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '15px' }}><BookOpen size={40} /></div>
          <h3>Planos de Aula</h3>
          <p>Fique por dentro do cronograma e objetivos de cada aula.</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '15px' }}><LinkIcon size={40} /></div>
          <h3>Links Úteis</h3>
          <p>Materiais complementares e referências externas importantes.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
