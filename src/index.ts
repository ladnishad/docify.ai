import { startServer } from './server.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3200;

startServer(PORT);
