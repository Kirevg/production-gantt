import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import productRoutes from './routes/products';
import userRoutes from './routes/users';
import personRoutes from './routes/persons';
import counterpartyRoutes from './routes/counterparties';
import specificationRoutes from './routes/specifications';
import productSpecificationRoutes from './routes/product-specifications';
import nomenclatureRoutes from './routes/nomenclature';
import nomenclatureKindRoutes from './routes/nomenclature-kinds';
import unitRoutes from './routes/units';
import migrationRoutes from './routes/migrations';
import backupRoutes from './routes/backup';
import catalogProductRoutes from './routes/catalog-products';
import clientLogsRoutes from './routes/client-logs';
import modelLinksRoutes from './routes/model-links';

const app = express();
const port = process.env.PORT || 4000;
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost,http://localhost:5173').split(',');

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Прокси для производственного календаря РФ
app.get('/api/calendar/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const response = await fetch(`https://calendar.kuzyak.in/api/calendar/${year}`);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch calendar' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Ошибка загрузки календаря:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/:year/holidays', async (req, res) => {
  try {
    const { year } = req.params;
    const response = await fetch(`https://calendar.kuzyak.in/api/calendar/${year}/holidays`);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch calendar holidays' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Ошибка загрузки календаря:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/projects', productRoutes);
app.use('/users', userRoutes);
app.use('/persons', personRoutes);
app.use('/counterparties', counterpartyRoutes);
app.use('/nomenclature', nomenclatureRoutes);
app.use('/nomenclature-kinds', nomenclatureKindRoutes);
app.use('/units', unitRoutes);
app.use('/', specificationRoutes);
app.use('/product-specifications', productSpecificationRoutes);
app.use('/catalog-products', catalogProductRoutes);
app.use('/api/migrations', migrationRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/client-logs', clientLogsRoutes);
app.use('/', modelLinksRoutes);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});