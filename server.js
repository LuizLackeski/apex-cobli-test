const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();

// --- AJUSTE 1: Caminho Inteligente do Banco (Suporte ao Volume) ---
const dbFolder = process.env.RAILWAY_VOLUME_MOUNT_PATH || './';
const dbPath = path.join(dbFolder, 'apex.db');
const db = new sqlite3.Database(dbPath);

app.use(express.json()); 
app.use(cors());

// Criar tabelas
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS prestadores (id INTEGER PRIMARY KEY, nome TEXT, endereco TEXT, cidade TEXT, uf TEXT, cep TEXT, responsavel TEXT, contato TEXT, qtdTecnicos INTEGER, range INTEGER, agenda TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS agendamentos (id INTEGER PRIMARY KEY, prestador TEXT, qtdTecnicos INTEGER, produtos TEXT, data TEXT, ticket TEXT, cliente TEXT, solicitante TEXT, rawDate TEXT)");
});

// ROTAS
app.get('/api/teste', (req, res) => {
    res.send("O SERVIDOR ESTÁ LENDO O ARQUIVO CORRETO!");
});

app.put('/api/prestadores/:id', (req, res) => {
    const { nome, endereco, cidade, uf, cep, responsavel, contato, qtdTecnicos, range, agenda } = req.body;
    db.run("UPDATE prestadores SET nome=?, endereco=?, cidade=?, uf=?, cep=?, responsavel=?, contato=?, qtdTecnicos=?, range=?, agenda=? WHERE id=?",
        [nome, endereco, cidade, uf, cep, responsavel, contato, qtdTecnicos, range, JSON.stringify(agenda), req.params.id],
        (err) => { 
            if (err) return res.status(500).json({error: err.message});
            res.sendStatus(200); 
        });
});

app.delete('/api/agendamentos/:id', (req, res) => {
    db.run("DELETE FROM agendamentos WHERE id = ?", req.params.id, () => res.sendStatus(200));
});

app.get('/api/prestadores', (req, res) => {
    db.all("SELECT * FROM prestadores", [], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows.map(r => ({...r, agenda: JSON.parse(r.agenda)})));
    });
});

app.post('/api/prestadores', (req, res) => {
    const { nome, endereco, cidade, uf, cep, responsavel, contato, qtdTecnicos, range, agenda } = req.body;
    db.run("INSERT INTO prestadores (nome, endereco, cidade, uf, cep, responsavel, contato, qtdTecnicos, range, agenda) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [nome, endereco, cidade, uf, cep, responsavel, contato, qtdTecnicos, range, JSON.stringify(agenda)],
        function(err) { 
            if (err) return res.status(500).json({error: err.message});
            res.json({ id: this.lastID }); 
        });
});

app.delete('/api/prestadores/:id', (req, res) => {
    db.run("DELETE FROM prestadores WHERE id = ?", req.params.id, () => res.sendStatus(200));
});

app.get('/api/agendamentos', (req, res) => {
    db.all("SELECT * FROM agendamentos", [], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows.map(r => ({...r, produtos: JSON.parse(r.produtos)})));
    });
});

app.post('/api/agendamentos', (req, res) => {
    const { prestador, qtdTecnicos, produtos, data, ticket, cliente, solicitante, rawDate } = req.body;
    db.run("INSERT INTO agendamentos (prestador, qtdTecnicos, produtos, data, ticket, cliente, solicitante, rawDate) VALUES (?,?,?,?,?,?,?,?)",
        [prestador, qtdTecnicos, JSON.stringify(produtos), data, ticket, cliente, solicitante, rawDate],
        () => res.sendStatus(200));
});

app.post('/api/distancia', async (req, res) => {
    try {
        const { origin, destination } = req.body;
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${process.env.API_KEY}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) { res.status(500).json({ error: 'Erro no Google Maps' }); }
});
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- AJUSTE 2: Porta Dinâmica ---
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 2. Porta Dinâmica (O segredo do Railway) ---
// O Railway injeta a porta certa na variável process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}!`);
});
