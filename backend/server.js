const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[Server] Connecting to MySQL database...');
    await sequelize.authenticate();
    console.log('[Server] MySQL Database connected successfully.');

    // Ensure models are registered (tables created via schema.sql)
    await sequelize.sync();
    console.log('[Server] Sequelize models synchronized.');

    const server = app.listen(PORT, () => {
      console.log(`[Server] Server is running on port ${PORT} (http://localhost:${PORT})`);
      console.log(`[Server] Health check endpoint: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Closing HTTP server and DB connections...`);
      server.close(async () => {
        try {
          await sequelize.close();
          console.log('[Server] MySQL connection closed. Process terminating gracefully.');
          process.exit(0);
        } catch (err) {
          console.error('[Server] Error during DB disconnection:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Critical error starting server:', error.message);
    process.exit(1);
  }
}

startServer();
