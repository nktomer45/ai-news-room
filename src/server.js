const app = require('./app');
const connectDB = require('./config/db');
const { setupCronJobs } = require('./jobs/cronJobs');
const config = require('./config/config');
require('./workers/articleWorker'); // Start BullMQ worker

const PORT = config.port;

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Initialize Agentic Cron Pipeline
    await setupCronJobs();

    // Start Server
    app.listen(PORT, () => {
      console.log(`Server running on port http://localhost:${PORT}`); //http://localhost:3000
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
