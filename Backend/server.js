const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// Routes

// 1. Get all materials (with optional class filtering)
app.get('/api/materials', async (req, res) => {
  const { class_id } = req.query;
  
  try {
    let query = supabase
      .from('materials')
      .select('*, classes(name)')
      .order('created_at', { ascending: false });

    if (class_id) {
      query = query.eq('class_id', class_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Post new material
app.post('/api/materials', async (req, res) => {
  const { title, description, type, content_url, class_id, teacher_id } = req.body;

  try {
    const { data, error } = await supabase
      .from('materials')
      .insert([{ title, description, type, content_url, class_id, teacher_id }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Delete material
app.delete('/api/materials/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Conteúdo excluído com sucesso' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Get all classes
app.get('/api/classes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
