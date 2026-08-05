#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  AzureCostService,
  CostDataParams,
  AnomalyParams,
  OptimizationParams,
  UsageTrendsParams,
  RightsizingParams,
} from './services/azure-cost-service.js';
import { MockDataService } from './services/mock-data-service.js';

/**
 * Azure Cost Management MCP Server
 * Provides tools for querying Azure cost data and generating AI-powered insights
 */

// NOTE: the SDK's `Tool.inputSchema` type wants a plain JSON-Schema-shaped
// object ({ type: 'object', properties: {...} }), not a live Zod schema
// instance — the original code passed the Zod schema objects directly,
// which doesn't match that type. This is a minimal, local converter (no
// new dependency) that covers the field types actually used below:
// string/number/enum, .optional(), and .default().
function zodObjectToJsonSchema(schema: z.ZodObject<any>): { type: 'object'; properties: Record<string, unknown>; required: string[] } {
  const shape = schema.shape;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries<any>(shape)) {
    let def = value;
    let isOptional = false;
    let defaultValue: unknown;

    if (def instanceof z.ZodDefault) {
      defaultValue = def._def.defaultValue();
      def = def._def.innerType;
    }
    if (def instanceof z.ZodOptional) {
      isOptional = true;
      def = def._def.innerType;
    }

    const prop: Record<string, unknown> = {};
    if (def instanceof z.ZodString) prop.type = 'string';
    else if (def instanceof z.ZodNumber) prop.type = 'number';
    else if (def instanceof z.ZodEnum) {
      prop.type = 'string';
      prop.enum = def._def.values;
    } else {
      prop.type = 'string';
    }

    const description = def._def?.description || value._def?.description;
    if (description) prop.description = description;
    if (defaultValue !== undefined) prop.default = defaultValue;

    properties[key] = prop;
    if (!isOptional && defaultValue === undefined) required.push(key);
  }

  return { type: 'object', properties, required };
}

// NOTE: the installed @modelcontextprotocol/sdk (0.4.0) Server constructor
// only accepts the server info object — capabilities are auto-derived at
// runtime from which request handlers you register below (see
// getCapabilities() in the SDK), so the second `{ capabilities: {...} }`
// argument the code previously passed doesn't exist in this version's API.
const server = new Server({
  name: 'azure-cost-mcp-server',
  version: '1.0.0',
});

// Initialize services
const mockDataService = new MockDataService();
const azureCostService = new AzureCostService(mockDataService);

// Define tool schemas
const GetCostDataSchema = z.object({
  startDate: z.string().describe('Start date in YYYY-MM-DD format'),
  endDate: z.string().describe('End date in YYYY-MM-DD format'),
  subscriptionId: z.string().optional().describe('Optional subscription ID filter'),
  department: z.string().optional().describe('Optional department filter'),
  resourceType: z.string().optional().describe('Optional resource type filter'),
});

const GetCostAnomaliesSchema = z.object({
  days: z.number().default(30).describe('Number of days to analyze for anomalies'),
  threshold: z.number().default(2.0).describe('Standard deviation threshold for anomaly detection'),
});

const GetOptimizationRecommendationsSchema = z.object({
  department: z.string().optional().describe('Department to analyze'),
  minSavings: z.number().default(100).describe('Minimum monthly savings to recommend'),
});

const GetUsageTrendsSchema = z.object({
  resourceType: z.string().optional().describe('Resource type to analyze'),
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily').describe('Trend analysis period'),
  days: z.number().default(90).describe('Number of days to analyze'),
});

// Define available tools
const tools: Tool[] = [
  {
    name: 'get_cost_data',
    description: 'Retrieve Azure cost data for specified time period and filters',
    inputSchema: zodObjectToJsonSchema(GetCostDataSchema),
  },
  {
    name: 'get_cost_anomalies',
    description: 'Detect cost anomalies and unusual spending patterns',
    inputSchema: zodObjectToJsonSchema(GetCostAnomaliesSchema),
  },
  {
    name: 'get_optimization_recommendations',
    description: 'Generate AI-powered cost optimization recommendations',
    inputSchema: zodObjectToJsonSchema(GetOptimizationRecommendationsSchema),
  },
  {
    name: 'get_usage_trends',
    description: 'Analyze resource usage trends and patterns',
    inputSchema: zodObjectToJsonSchema(GetUsageTrendsSchema),
  },
  {
    name: 'get_department_breakdown',
    description: 'Get cost breakdown by department and team',
    inputSchema: zodObjectToJsonSchema(z.object({
      month: z.string().optional().describe('Month in YYYY-MM format, defaults to current month'),
    })),
  },
  {
    name: 'get_resource_rightsizing',
    description: 'Identify over-provisioned resources for rightsizing',
    inputSchema: zodObjectToJsonSchema(z.object({
      utilizationThreshold: z.number().default(20).describe('CPU utilization threshold percentage'),
    })),
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_cost_data': {
        const parsed = GetCostDataSchema.parse(args);
        const params: CostDataParams = {
          startDate: parsed.startDate,
          endDate: parsed.endDate,
          subscriptionId: parsed.subscriptionId,
          department: parsed.department,
          resourceType: parsed.resourceType,
        };
        const data = await azureCostService.getCostData(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_cost_anomalies': {
        const parsed = GetCostAnomaliesSchema.parse(args);
        const params: AnomalyParams = {
          days: parsed.days,
          threshold: parsed.threshold,
        };
        const anomalies = await azureCostService.detectCostAnomalies(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(anomalies, null, 2),
            },
          ],
        };
      }

      case 'get_optimization_recommendations': {
        const parsed = GetOptimizationRecommendationsSchema.parse(args);
        const params: OptimizationParams = {
          department: parsed.department,
          minSavings: parsed.minSavings,
        };
        const recommendations = await azureCostService.getOptimizationRecommendations(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(recommendations, null, 2),
            },
          ],
        };
      }

      case 'get_usage_trends': {
        const parsed = GetUsageTrendsSchema.parse(args);
        const params: UsageTrendsParams = {
          resourceType: parsed.resourceType,
          period: parsed.period,
          days: parsed.days,
        };
        const trends = await azureCostService.getUsageTrends(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(trends, null, 2),
            },
          ],
        };
      }

      case 'get_department_breakdown': {
        const params = z.object({
          month: z.string().optional(),
        }).parse(args);
        const breakdown = await azureCostService.getDepartmentBreakdown(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(breakdown, null, 2),
            },
          ],
        };
      }

      case 'get_resource_rightsizing': {
        const parsed = z.object({
          utilizationThreshold: z.number().default(20),
        }).parse(args);
        const params: RightsizingParams = {
          utilizationThreshold: parsed.utilizationThreshold,
        };
        const rightsizing = await azureCostService.getResourceRightsizing(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(rightsizing, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Azure Cost MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});