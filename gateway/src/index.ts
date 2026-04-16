import { createServer } from 'http';
import { createWsServer } from './wsServer.js';

const PORT = parseInt(process.env.PORT ?? '8080', 10);

const server = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Mini-RAFT Gateway\n');
});

const { wss } = createWsServer(server);

server.listen(PORT, () => {
  console.log(`Gateway listening on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  wss.close();
  server.close();
  process.exit(0);
});
