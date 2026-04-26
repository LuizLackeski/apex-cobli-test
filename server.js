const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Configuração Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json()); 
app.use(cors());

// --- API PRESTADORES ---
app.get('/api/prestadores', async (req, res) => {
    const { data, error } = await supabase.from('prestadores').select('*');
    if (error) return res.status(500).json({error: error.message});
    
    // Converte a string agenda de volta para objeto
    const formatted = data.map(r => ({
        ...r, 
        agenda: r.agenda ? JSON.parse(r.agenda) : []
    }));
    res.json(formatted);
});

app.post('/api/prestadores', async (req, res) => {
    const { nome, endereco, cidade, uf, cep, responsavel, contato, qtdTecnicos, range, agenda } = req.body;
    const { data, error } = await supabase.from('prestadores').insert([{
        nome, endereco, cidade, uf, cep, responsavel, contato, qtdTecnicos, range, agenda: JSON.stringify(agenda)
    }]).select();
    
    if (error) return res.status(500).json({error: error.message});
    res.json({ id: data[0].id });
});

app.put('/api/prestadores/:id', async (req, res) => {
    const { nome, endereco, cidade, uf, cep, responsavel, contato, qtdTecnicos, range, agenda } = req.body;
    const { error } = await supabase.from('prestadores').update({
        nome, endereco, cidade, uf, cep, responsavel, contato, qtdTecnicos, range, agenda: JSON.stringify(agenda)
    }).eq('id', req.params.id);
    
    if (error) return res.status(500).json({error: error.message});
    res.sendStatus(200);
});

app.delete('/api/prestadores/:id', async (req, res) => {
    const { error } = await supabase.from('prestadores').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({error: error.message});
    res.sendStatus(200);
});

// --- API AGENDAMENTOS ---
app.get('/api/agendamentos', async (req, res) => {
    const { data, error } = await supabase.from('agendamentos').select('*');
    if (error) return res.status(500).json({error: error.message});
    
    const formatted = data.map(r => ({
        ...r, 
        produtos: r.produtos ? JSON.parse(r.produtos) : [],
        slots: r.slots ? JSON.parse(r.slots) : []
    }));
    res.json(formatted);
});

app.post('/api/agendamentos', async (req, res) => {
    const { prestador, qtdTecnicos, produtos, data, ticket, cliente, solicitante, rawDate, slots } = req.body;
    const { error } = await supabase.from('agendamentos').insert([{
        prestador, qtdTecnicos, produtos: JSON.stringify(produtos), data, ticket, cliente, solicitante, rawDate, slots: JSON.stringify(slots)
    }]);
    
    if (error) return res.status(500).json({error: error.message});
    res.sendStatus(200);
});

app.delete('/api/agendamentos/:id', async (req, res) => {
    const { error } = await supabase.from('agendamentos').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({error: error.message});
    res.sendStatus(200);
});

// --- GOOGLE MAPS ---
app.post('/api/distancia', async (req, res) => {
    try {
        const { origin, destination } = req.body;
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${process.env.API_KEY}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) { res.status(500).json({ error: 'Erro no Google Maps' }); }
});

app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}!`));
