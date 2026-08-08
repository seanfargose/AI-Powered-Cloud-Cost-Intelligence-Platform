// import { Router } from "express";

// export function dashboardCompatRoutes() {
//     const router = Router();

//     // Azure Cost API
//     router.get("/azure/costs", async (req, res) => {

//         const records = generateMockCosts();

//         res.json({
//             success: true,
//             data: {
//                 records,
//                 summary: {
//                     totalCost: records.reduce((a,b)=>a+b.cost,0),
//                     totalRecords: records.length,
//                     dateRange:{
//                         start:records[0].date,
//                         end:records[records.length-1].date
//                     }
//                 }
//             }
//         });

//     });

//     // Claude Analysis API
//     router.post("/ai/analyze", async(req,res)=>{

//         res.json({
//             success:true,
//             data:{
//                 analysis:{
//                     summary:"Cloud spending is stable.",
//                     insights:[
//                         "VMs contribute most of the spend",
//                         "Storage utilization can be optimized"
//                     ],
//                     recommendations:[
//                         "Purchase Reserved Instances",
//                         "Delete idle disks"
//                     ],
//                     riskFactors:[
//                         "Budget may exceed 95%"
//                     ],
//                     confidence:0.91
//                 },
//                 query:req.body.query,
//                 dataAnalyzed:150,
//                 tokensUsed:245
//             }
//         });

//     });

//     // Full Analysis
//     router.get("/full-analysis", async(req,res)=>{

//         const records=generateMockCosts();

//         res.json({

//             success:true,

//             data:{

//                 azureData:{
//                     records:records.length,
//                     totalCost:records.reduce((a,b)=>a+b.cost,0),
//                     sampleRecords:records
//                 },

//                 aiAnalysis:{
//                     summary:"Cloud spend healthy",
//                     insights:[
//                         "Storage costs increasing",
//                         "VM utilization acceptable"
//                     ],
//                     recommendations:[
//                         "Reserved Instances",
//                         "Rightsize VMs"
//                     ],
//                     riskFactors:[
//                         "Budget nearing limit"
//                     ],
//                     confidence:0.94
//                 },

//                 metadata:{
//                     subscriptionId:
//                         process.env.AZURE_SUBSCRIPTION_ID ??
//                         "MOCK-SUBSCRIPTION",

//                     dateRange:{
//                         start:records[0].date,
//                         end:records[records.length-1].date
//                     },

//                     tokensUsed:327
//                 }

//             }

//         });

//     });

//     return router;
// }

// function generateMockCosts(){

//     const data=[];

//     for(let i=0;i<30;i++){

//         const d=new Date();

//         d.setDate(d.getDate()-29+i);

//         data.push({

//             date:d.toISOString().slice(0,10),

//             cost:1200+Math.random()*500,

//             service:"Virtual Machines",

//             resourceGroup:"rg-engineering",

//             department:"Engineering"

//         });

//     }

//     return data;
// }


import { Router } from "express";

interface CostRecord {
  date: string;
  cost: number;
  service: string;
  resourceGroup: string;
  department: string;
}

export function dashboardCompatRoutes() {
  const router = Router();

  /**
   * Azure Costs
   */
  router.get("/azure/costs", async (_, res) => {
    const records = generateMockCosts();

    res.json({
      success: true,
      data: {
        records,
        summary: {
          totalCost: records.reduce((sum, r) => sum + r.cost, 0),
          totalRecords: records.length,
          dateRange: {
            start: records[0].date,
            end: records[records.length - 1].date,
          },
        },
      },
    });
  });

  /**
   * AI Analysis
   */
  router.post("/ai/analyze", async (req, res) => {
    const records = generateMockCosts();

    res.json({
      success: true,
      data: {
        analysis: generateAIAnalysis(records),
        query: req.body.query ?? "",
        dataAnalyzed: records.length,
        tokensUsed: 327,
      },
    });
  });

  /**
   * Full Dashboard Analysis
   */
  router.get("/full-analysis", async (_, res) => {
    const records = generateMockCosts();

    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

    res.json({
      success: true,
      data: {
        azureData: {
          records: records.length,
          totalCost,
          sampleRecords: records,
        },

        aiAnalysis: generateAIAnalysis(records),

        metadata: {
          subscriptionId:
            process.env.AZURE_SUBSCRIPTION_ID ?? "MOCK-SUBSCRIPTION",

          dateRange: {
            start: records[0].date,
            end: records[records.length - 1].date,
          },

          tokensUsed: 327,
        },
      },
    });
  });

  return router;
}

/**
 * Mock Azure Cost Data
 */
// function generateMockCosts(): CostRecord[] {
//   const data: CostRecord[] = [];

//   const base = 1200;

//   for (let i = 0; i < 30; i++) {
//     const d = new Date();

//     d.setDate(d.getDate() - 29 + i);

//     const growth = i * 12;

//     const random = Math.random() * 150 - 75;

//     data.push({
//       date: d.toISOString().slice(0, 10),

//       cost: Math.round(base + growth + random),

//       service: "Virtual Machines",

//       resourceGroup: "rg-engineering",

//       department: "Engineering",
//     });
//   }

//   return data;
// }
function generateMockCosts(): CostRecord[] {
    const departments = [
        "Engineering",
        "Finance",
        "Marketing",
        "Sales",
        "HR",
        "Operations"
    ];

    const services = [
        "Virtual Machines",
        "Azure SQL",
        "Storage Account",
        "AKS",
        "App Service",
        "Cosmos DB",
        "Azure Functions",
        "Load Balancer"
    ];

    const data: CostRecord[] = [];

    const baseCost = 1200;

    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - 29 + i);

        const department =
            departments[Math.floor(Math.random() * departments.length)];

        const service =
            services[Math.floor(Math.random() * services.length)];

        const growth = i * 12;

        const random = Math.random() * 150 - 75;

        let multiplier = 1;

        switch (department) {
            case "Engineering":
                multiplier = 1.6;
                break;

            case "Finance":
                multiplier = 1.25;
                break;

            case "Marketing":
                multiplier = 0.9;
                break;

            case "Sales":
                multiplier = 1.15;
                break;

            case "Operations":
                multiplier = 1.05;
                break;

            case "HR":
                multiplier = 0.75;
                break;
        }

        data.push({
            date: d.toISOString().slice(0, 10),

            cost: Math.round((baseCost + growth + random) * multiplier),

            service,

            resourceGroup: `rg-${department.toLowerCase()}`,

            department
        });
    }

    return data;
}

/**
 * AI Analysis Generator
 */
function generateAIAnalysis(records: CostRecord[]) {
  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

  const avgDailyCost = totalCost / records.length;

  const maxCost = Math.max(...records.map((r) => r.cost));

  const minCost = Math.min(...records.map((r) => r.cost));

  const savings = totalCost * 0.18;

  const risk =
    avgDailyCost > 1600
      ? "Daily spending is above the expected threshold."
      : "Budget utilization remains healthy.";

  return {
    summary: `Azure spending is healthy. Average daily spend is $${avgDailyCost.toFixed(
      2
    )}. Estimated optimization opportunity is $${Math.round(savings)}.`,

    insights: [
      `Average daily spend is $${avgDailyCost.toFixed(2)}.`,
      `Highest daily spend reached $${maxCost.toFixed(2)}.`,
      `Lowest daily spend was $${minCost.toFixed(2)}.`,
      `Potential annual savings exceed $${Math.round(savings * 12)}.`,
    ],

    recommendations: [
      `Purchase Reserved Instances to save approximately $${Math.round(
        savings * 0.45
      )}.`,
      "Rightsize underutilized virtual machines.",
      "Move infrequently accessed storage to the Cool Tier.",
      "Enable Azure Advisor recommendations.",
    ],

    riskFactors: [
      risk,
      "Compute resources contribute over 70% of monthly spend.",
    ],

    confidence: 0.96,
  };
}