const express = require('express');
const app = express();
const port = 4001;

app.use(express.json());

// Простой тестовый маршрут
app.get('/work-types', (req, res) => {
    res.json({ message: 'Work types endpoint works!', data: [] });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`Test server listening on http://localhost:${port}`);
    console.log('Available routes:');
    console.log('- GET /health');
    console.log('- GET /work-types');
});
