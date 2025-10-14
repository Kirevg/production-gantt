"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const projects_1 = __importDefault(require("./routes/projects"));
const products_1 = __importDefault(require("./routes/products"));
const users_1 = __importDefault(require("./routes/users"));
const persons_1 = __importDefault(require("./routes/persons"));
const counterparties_1 = __importDefault(require("./routes/counterparties"));
const specifications_1 = __importDefault(require("./routes/specifications"));
const product_specifications_1 = __importDefault(require("./routes/product-specifications"));
const nomenclature_1 = __importDefault(require("./routes/nomenclature"));
const nomenclature_kinds_1 = __importDefault(require("./routes/nomenclature-kinds"));
const units_1 = __importDefault(require("./routes/units"));
const migrations_1 = __importDefault(require("./routes/migrations"));
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost,http://localhost:5173').split(',');
app.use((0, cors_1.default)({ origin: corsOrigins, credentials: true }));
app.use(express_1.default.json());
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
app.use('/auth', auth_1.default);
app.use('/projects', projects_1.default);
app.use('/projects', products_1.default);
app.use('/users', users_1.default);
app.use('/persons', persons_1.default);
app.use('/counterparties', counterparties_1.default);
app.use('/nomenclature', nomenclature_1.default);
app.use('/nomenclature-kinds', nomenclature_kinds_1.default);
app.use('/units', units_1.default);
app.use('/', specifications_1.default);
app.use('/product-specifications', product_specifications_1.default);
app.use('/api/migrations', migrations_1.default);
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map