// server.ts
import { createServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';
import path from 'path';
import { initializeSocketServer } from '@/lib/realtime/socket-server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const useHttps = process.env.USE_HTTPS === 'true' || !dev;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const requestHandler = async (req: any, res: any) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  };

  let server;

  if (useHttps) {
    // Check for certificates in multiple locations
    const certPaths = [
      {
        key: path.join(process.cwd(), 'certificates', 'localhost+2-key.pem'),
        cert: path.join(process.cwd(), 'certificates', 'localhost+2.pem'),
      },
      {
        key: path.join(process.cwd(), 'localhost+2-key.pem'),
        cert: path.join(process.cwd(), 'localhost+2.pem'),
      },
    ];

    let sslOptions: { key: Buffer; cert: Buffer } | null = null;

    for (const paths of certPaths) {
      if (fs.existsSync(paths.key) && fs.existsSync(paths.cert)) {
        sslOptions = {
          key: fs.readFileSync(paths.key),
          cert: fs.readFileSync(paths.cert),
        };
        console.log(`✅ SSL certificates loaded successfully`);
        console.log(`   Key:  ${paths.key}`);
        console.log(`   Cert: ${paths.cert}`);
        break;
      }
    }

    if (sslOptions) {
      server = createServer(sslOptions, requestHandler);
      console.log('🔒 HTTPS server created');
    } else {
      console.warn('⚠️  SSL certificates not found. Falling back to HTTP.');
      console.warn('   Run: npm run cert:generate to create certificates');
      server = createHttpServer(requestHandler);
    }
  } else {
    server = createHttpServer(requestHandler);
    console.log('🌐 HTTP server created (development mode)');
  }

  // Initialize Socket.IO (works with both HTTP and HTTPS)
  initializeSocketServer(server);

  server.listen(port, () => {
    const protocol = server instanceof (await import('https')).Server ? 'https' : 'http';
    console.log(`\n🚀 Server ready on ${protocol}://${hostname}:${port}`);
    console.log(`📦 Environment: ${dev ? 'development' : 'production'}`);
    console.log(`🔌 WebSocket server initialized`);
    
    if (process.env.PAYMENT_SIMULATION_ENABLED !== 'false') {
      console.log(`💳 Payment mode: SIMULATION (no real API calls)`);
    } else {
      console.log(`💳 Payment mode: LIVE (real PayChangu API)`);
    }

    if (protocol === 'https') {
      console.log(`\n⚠️  First time? You may need to trust the certificate:`);
      console.log(`   Visit: ${protocol}://${hostname}:${port} and accept the security warning`);
    }
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
});