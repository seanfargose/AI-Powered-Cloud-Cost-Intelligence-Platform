import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import cron from 'node-cron';
import path from "path";

import { DatabaseService } from './services/database.js';
import { CacheService } from './services/cache.js';
import { AIAnalysisService } from './services/ai-analysis.js';
import { MCPIntegrationService } from './services/mcp-integration.js';
import { RealtimeService } from './services/realtime.js';
import { DataPipelineService } from './services/data-pipeline.js';

import { costRoutes } from './routes/cost.js';
import { analysisRoutes } from './routes/analysis.js';
import { optimizationRoutes } from './routes/optimization.js';
import { alertsRoutes } from './routes/alerts.js';
import { dashboardRoutes } from './routes/dashboard.js';

import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { dashboardCompatRoutes } from "./routes/dashboard-compat.js";


dotenv.config({
  path: path.resolve(process.cwd(), "../.env"),
});
console.log("Current working directory:", process.cwd());
console.log("SKIP_DATABASE =", process.env.SKIP_DATABASE);
console.log("dotenv loaded");
console.log("Loaded .env from:", path.resolve(process.cwd(), "../.env"));
console.log("SKIP_DATABASE =", process.env.SKIP_DATABASE);
/**
 * AI-Powered Cost Optimization Platform - Main Backend Server
 * 
 * Features:
 * - Real-time cost data processing
 * - AI-powered analysis and insights
 * - MCP server integration
 * - WebSocket for live updates
 * - Automated data pipeline
 * - Intelligent caching
 */

class CostOptimizationServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  
  // Core services
  private databaseService: DatabaseService;
  private cacheService: CacheService;
  private aiAnalysisService: AIAnalysisService;
  private mcpIntegrationService: MCPIntegrationService;
  private realtimeService: RealtimeService;
  private dataPipelineService: DataPipelineService;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    // NOTE: setupRoutes() used to be called here, before initializeServices()
    // ever ran. Route handlers like costRoutes(this.dataPipelineService, ...)
    // read `this.dataPipelineService` / `this.cacheService` eagerly as plain
    // function arguments at call time — at that point they were still
    // `undefined`, so every route silently closed over `undefined` forever,
    // even after the real services were constructed later. Moved to start()
    // after initializeServices() completes so routes get the real instances.
    this.setupWebSocket();
    this.setupScheduledTasks();
  }

  private async initializeServices() {
    console.log('🚀 Initializing services...');
    
    // Initialize core services
    this.aiAnalysisService = new AIAnalysisService(process.env.ANTHROPIC_API_KEY!);
    this.mcpIntegrationService = new MCPIntegrationService();
    // NOTE: constructing MCPIntegrationService only registers which servers
    // *could* run — it doesn't spawn them. .initialize() is what actually
    // spawns the azure-cost-mcp child process. This call was missing
    // entirely, so /api/cost/* routes (which go through this service) would
    // fail even with a fully working database/cache, and /health always
    // reported mcp: false.
    try {
      await this.mcpIntegrationService.initialize();
    } catch (error) {
      console.error('⚠️ MCP Integration Service failed to start (routes depending on it will fail):', error);
    }
    
    // Initialize database and cache connections (skip if flags are set)
    if (process.env.SKIP_DATABASE !== 'true') {
      this.databaseService = new DatabaseService();
      await this.databaseService.initialize();
    } else {
      console.log('⚠️ Skipping database initialization (SKIP_DATABASE=true)');
    }
    
    if (process.env.SKIP_REDIS !== 'true') {
      this.cacheService = new CacheService();
      await this.cacheService.initialize();
    } else {
      console.log('⚠️ Skipping Redis initialization (SKIP_REDIS=true)');
    }
    
    // Initialize data pipeline and realtime services (with null checks)
    if (this.databaseService && this.cacheService) {
      this.dataPipelineService = new DataPipelineService(
        this.databaseService,
        this.cacheService,
        this.aiAnalysisService,
        this.mcpIntegrationService
      );
      
      this.realtimeService = new RealtimeService(
        this.dataPipelineService,
        this.aiAnalysisService
      );
    } else {
      console.log('⚠️ Skipping data pipeline and realtime services (no database/cache)');
    }

    console.log('✅ All services initialized');
  }

  private setupMiddleware() {
    // Security and performance middleware
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: this.databaseService ? this.databaseService.isHealthy() : false,
          cache: this.cacheService ? this.cacheService.isHealthy() : false,
          ai: this.aiAnalysisService ? true : false,
          mcp: this.mcpIntegrationService.isHealthy()
        }
      });
    });

    // Test Azure connection
    this.app.get('/test/azure', async (req, res) => {
      try {
        const result = await this.mcpIntegrationService.getCostData({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        });
        res.json({
          success: true,
          message: 'Azure connection successful',
          data: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Azure connection failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Test AI analysis
    this.app.post('/test/ai', async (req, res) => {
      try {
        const { query = "What are the main cost trends?" } = req.body;
        const result = await this.aiAnalysisService.processInteractiveQuery(
          query,
          [], // Empty cost data for test
          {},
          'test-user',
          'test-org'
        );
        res.json({
          success: true,
          message: 'AI analysis successful',
          data: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'AI analysis failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // API routes (with null checks for optional services)
    this.app.use('/api/cost', costRoutes(
      this.dataPipelineService,
      this.cacheService,
      this.mcpIntegrationService
    ));
    
    this.app.use('/api/analysis', analysisRoutes(
      this.aiAnalysisService,
      this.dataPipelineService,
      this.cacheService
    ));
    
    this.app.use('/api/optimization', optimizationRoutes(
      this.aiAnalysisService,
      this.mcpIntegrationService,
      this.cacheService
    ));
    
    if (this.dataPipelineService && this.realtimeService) {
      this.app.use('/api/alerts', alertsRoutes(
        this.dataPipelineService,
        this.aiAnalysisService,
        this.realtimeService
      ));
    }
    
    console.log('🔍 Dashboard dependencies:', {
  dataPipelineService: !!this.dataPipelineService,
  cacheService: !!this.cacheService,
  aiAnalysisService: !!this.aiAnalysisService
});

this.app.use('/api/dashboard', dashboardRoutes(
  this.dataPipelineService,
  this.cacheService,
  this.aiAnalysisService
));
    this.app.use('/api/dashboard', dashboardRoutes(
      this.dataPipelineService,
      this.cacheService,
      this.aiAnalysisService
    ));
// Compatibility endpoints for frontend
this.app.use('/api', dashboardCompatRoutes());
    // Error handling
    this.app.use(errorHandler);

  this.app._router.stack.forEach((r: any) => {
  if (r.route) {
    console.log(r.route.path);
  }
});

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
      });
    });
  }

  private setupWebSocket() {
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      console.log(`🔌 WebSocket connection established from ${req.socket.remoteAddress}`);
      
      // Register client with realtime service
      this.realtimeService.addClient(ws);

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.realtimeService.handleClientMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        this.realtimeService.removeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.realtimeService.removeClient(ws);
      });
    });
  }

  private setupScheduledTasks() {
    console.log('⏰ Setting up scheduled tasks...');

    // Fetch fresh cost data every hour
    cron.schedule('0 * * * *', async () => {
      console.log('🔄 Running hourly cost data sync...');
      try {
        await this.dataPipelineService.syncCostData();
        if (this.dataPipelineService) {
    await this.dataPipelineService.syncCostData();
}
        console.log('✅ Hourly cost data sync completed');
      } catch (error) {
        console.error('❌ Hourly cost data sync failed:', error);
      }
    });

    // Generate AI insights every 4 hours
    cron.schedule('0 */4 * * *', async () => {
      console.log('🧠 Running AI insights generation...');
      try {
        await this.dataPipelineService.generateInsights();
        if (this.dataPipelineService) {
    await this.dataPipelineService.generateInsights();
}
        console.log('✅ AI insights generation completed');
      } catch (error) {
        console.error('❌ AI insights generation failed:', error);
      }
    });

    // Anomaly detection every 2 hours
    cron.schedule('0 */2 * * *', async () => {
      console.log('🔍 Running anomaly detection...');
      try {
       await this.dataPipelineService.detectAnomalies();
       if (this.dataPipelineService) {
    await this.dataPipelineService.detectAnomalies();
}
        console.log('✅ Anomaly detection completed');
      } catch (error) {
        console.error('❌ Anomaly detection failed:', error);
      }
    });

    // Cache cleanup daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🧹 Running cache cleanup...');
      try {
        await this.cacheService.cleanup();
        if (this.cacheService) {
    await this.cacheService.cleanup();
}
        console.log('✅ Cache cleanup completed');
      } catch (error) {
        console.error('❌ Cache cleanup failed:', error);
      }
    });

    console.log('✅ Scheduled tasks configured');
  }

  public async start() {
    // Initialize services before starting server
    await this.initializeServices();

    // Routes are wired here, not in the constructor, so they close over the
    // real service instances instead of undefined placeholders.
    this.setupRoutes();

    const port = process.env.PORT || 8000;
    
    this.server.listen(port, () => {
      console.log(`
🚀 AI Cost Optimization Platform Backend Started!

📊 Server: http://localhost:${port}
🔌 WebSocket: ws://localhost:${port}
🏥 Health: http://localhost:${port}/health
📚 API Docs: http://localhost:${port}/api

🎯 Features Active:
  ✅ Real-time cost monitoring
  ✅ AI-powered analysis
  ✅ MCP server integration
  ✅ Automated data pipeline
  ✅ WebSocket live updates
  ✅ Intelligent caching
  ✅ Anomaly detection
  ✅ Cost optimization recommendations

Environment: ${process.env.NODE_ENV || 'development'}
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  

  private async shutdown() {
    console.log('🛑 Shutting down server...');
    
    // Close WebSocket server
    this.wss.close();
    
    // Close HTTP server
    this.server.close();
    
    // Close database connections (guard: may be undefined if SKIP_DATABASE/SKIP_REDIS was set)
    if (this.databaseService) await this.databaseService.close();
    if (this.cacheService) await this.cacheService.close();
    
    console.log('✅ Server shutdown complete');
    process.exit(0);
  }
}

// Start the server
const server = new CostOptimizationServer();
server.start().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});