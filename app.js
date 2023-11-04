import express from "express";
import bootstrap from "./bootstrap.js";

const app = express();

bootstrap(app);
export default app;

const port = process.env.port || 3000;
app.listen(port, () => console.log(`Listening to port ${port}`));