import express from "express";
import bootstrap from "./bootstrap.js";
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, 'uploads')));

bootstrap(app);
export default app;

const port = process.env.port || 3000;
app.listen(port, () => console.log(`Listening to port ${port}`));