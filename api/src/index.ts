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

const app = express();
const port = process.env.PORT || 4000;
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost,http://localhost:5173').split(',');

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
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
app.use('/products', productSpecificationRoutes);
app.use('/api/migrations', migrationRoutes);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});