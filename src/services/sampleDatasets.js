// Sample multi-dimensional business datasets for immediate demonstration

export const SAMPLE_DATASETS = {
  financials: {
    id: 'financials',
    name: 'Executive Financials & P&L (2024 - 2025)',
    description: 'Quarterly and monthly revenue, COGS, EBITDA, OPEX, and net income performance across regional divisions.',
    category: 'Finance & Strategy',
    source: 'Enterprise ERP / SAP Integration',
    dateColumn: 'Date',
    defaultMetrics: {
      primary: 'Revenue',
      secondary: 'EBITDA',
      dimension: 'Quarter'
    },
    data: [
      { Date: '2024-01', Quarter: 'Q1-2024', Region: 'North America', Business_Unit: 'Enterprise Cloud', Revenue: 420000, COGS: 126000, Gross_Profit: 294000, OPEX: 145000, EBITDA: 149000, Net_Income: 112000, Budget_Target: 390000, Headcount: 240, Customer_Satisfaction: 89 },
      { Date: '2024-01', Quarter: 'Q1-2024', Region: 'Europe', Business_Unit: 'Enterprise Cloud', Revenue: 310000, COGS: 99200, Gross_Profit: 210800, OPEX: 110000, EBITDA: 100800, Net_Income: 75600, Budget_Target: 300000, Headcount: 175, Customer_Satisfaction: 86 },
      { Date: '2024-01', Quarter: 'Q1-2024', Region: 'Asia-Pacific', Business_Unit: 'AI Hardware', Revenue: 510000, COGS: 234600, Gross_Profit: 275400, OPEX: 130000, EBITDA: 145400, Net_Income: 109050, Budget_Target: 470000, Headcount: 310, Customer_Satisfaction: 92 },
      { Date: '2024-02', Quarter: 'Q1-2024', Region: 'North America', Business_Unit: 'AI Hardware', Revenue: 580000, COGS: 266800, Gross_Profit: 313200, OPEX: 155000, EBITDA: 158200, Net_Income: 118650, Budget_Target: 520000, Headcount: 330, Customer_Satisfaction: 91 },
      { Date: '2024-02', Quarter: 'Q1-2024', Region: 'Europe', Business_Unit: 'Consumer SaaS', Revenue: 240000, COGS: 57600, Gross_Profit: 182400, OPEX: 98000, EBITDA: 84400, Net_Income: 63300, Budget_Target: 230000, Headcount: 120, Customer_Satisfaction: 84 },
      { Date: '2024-02', Quarter: 'Q1-2024', Region: 'Latin America', Business_Unit: 'FinTech Solutions', Revenue: 180000, COGS: 61200, Gross_Profit: 118800, OPEX: 72000, EBITDA: 46800, Net_Income: 35100, Budget_Target: 170000, Headcount: 95, Customer_Satisfaction: 87 },
      { Date: '2024-03', Quarter: 'Q1-2024', Region: 'North America', Business_Unit: 'FinTech Solutions', Revenue: 340000, COGS: 108800, Gross_Profit: 231200, OPEX: 115000, EBITDA: 116200, Net_Income: 87150, Budget_Target: 320000, Headcount: 160, Customer_Satisfaction: 88 },
      { Date: '2024-03', Quarter: 'Q1-2024', Region: 'Asia-Pacific', Business_Unit: 'Enterprise Cloud', Revenue: 390000, COGS: 117000, Gross_Profit: 273000, OPEX: 128000, EBITDA: 145000, Net_Income: 108750, Budget_Target: 360000, Headcount: 210, Customer_Satisfaction: 90 },

      { Date: '2024-04', Quarter: 'Q2-2024', Region: 'North America', Business_Unit: 'Enterprise Cloud', Revenue: 465000, COGS: 139500, Gross_Profit: 325500, OPEX: 152000, EBITDA: 173500, Net_Income: 130125, Budget_Target: 430000, Headcount: 255, Customer_Satisfaction: 91 },
      { Date: '2024-04', Quarter: 'Q2-2024', Region: 'Europe', Business_Unit: 'Enterprise Cloud', Revenue: 340000, COGS: 108800, Gross_Profit: 231200, OPEX: 118000, EBITDA: 113200, Net_Income: 84900, Budget_Target: 325000, Headcount: 180, Customer_Satisfaction: 87 },
      { Date: '2024-04', Quarter: 'Q2-2024', Region: 'Asia-Pacific', Business_Unit: 'AI Hardware', Revenue: 620000, COGS: 279000, Gross_Profit: 341000, OPEX: 145000, EBITDA: 196000, Net_Income: 147000, Budget_Target: 560000, Headcount: 345, Customer_Satisfaction: 93 },
      { Date: '2024-05', Quarter: 'Q2-2024', Region: 'North America', Business_Unit: 'AI Hardware', Revenue: 680000, COGS: 306000, Gross_Profit: 374000, OPEX: 168000, EBITDA: 206000, Net_Income: 154500, Budget_Target: 600000, Headcount: 360, Customer_Satisfaction: 94 },
      { Date: '2024-05', Quarter: 'Q2-2024', Region: 'Europe', Business_Unit: 'Consumer SaaS', Revenue: 265000, COGS: 60950, Gross_Profit: 204050, OPEX: 102000, EBITDA: 102050, Net_Income: 76537, Budget_Target: 250000, Headcount: 125, Customer_Satisfaction: 86 },
      { Date: '2024-05', Quarter: 'Q2-2024', Region: 'Latin America', Business_Unit: 'FinTech Solutions', Revenue: 205000, COGS: 67650, Gross_Profit: 137350, OPEX: 76000, EBITDA: 61350, Net_Income: 46012, Budget_Target: 190000, Headcount: 102, Customer_Satisfaction: 89 },
      { Date: '2024-06', Quarter: 'Q2-2024', Region: 'North America', Business_Unit: 'FinTech Solutions', Revenue: 390000, COGS: 120900, Gross_Profit: 269100, OPEX: 122000, EBITDA: 147100, Net_Income: 110325, Budget_Target: 360000, Headcount: 172, Customer_Satisfaction: 90 },
      { Date: '2024-06', Quarter: 'Q2-2024', Region: 'Asia-Pacific', Business_Unit: 'Enterprise Cloud', Revenue: 440000, COGS: 132000, Gross_Profit: 308000, OPEX: 134000, EBITDA: 174000, Net_Income: 130500, Budget_Target: 400000, Headcount: 225, Customer_Satisfaction: 91 },

      { Date: '2024-07', Quarter: 'Q3-2024', Region: 'North America', Business_Unit: 'Enterprise Cloud', Revenue: 510000, COGS: 153000, Gross_Profit: 357000, OPEX: 160000, EBITDA: 197000, Net_Income: 147750, Budget_Target: 470000, Headcount: 265, Customer_Satisfaction: 92 },
      { Date: '2024-07', Quarter: 'Q3-2024', Region: 'Europe', Business_Unit: 'Enterprise Cloud', Revenue: 375000, COGS: 116250, Gross_Profit: 258750, OPEX: 124000, EBITDA: 134750, Net_Income: 101062, Budget_Target: 350000, Headcount: 190, Customer_Satisfaction: 88 },
      { Date: '2024-07', Quarter: 'Q3-2024', Region: 'Asia-Pacific', Business_Unit: 'AI Hardware', Revenue: 730000, COGS: 328500, Gross_Profit: 401500, OPEX: 158000, EBITDA: 243500, Net_Income: 182625, Budget_Target: 650000, Headcount: 380, Customer_Satisfaction: 95 },
      { Date: '2024-08', Quarter: 'Q3-2024', Region: 'North America', Business_Unit: 'AI Hardware', Revenue: 790000, COGS: 347600, Gross_Profit: 442400, OPEX: 182000, EBITDA: 260400, Net_Income: 195300, Budget_Target: 710000, Headcount: 400, Customer_Satisfaction: 95 },
      { Date: '2024-08', Quarter: 'Q3-2024', Region: 'Europe', Business_Unit: 'Consumer SaaS', Revenue: 290000, COGS: 63800, Gross_Profit: 226200, OPEX: 108000, EBITDA: 118200, Net_Income: 88650, Budget_Target: 275000, Headcount: 130, Customer_Satisfaction: 87 },
      { Date: '2024-08', Quarter: 'Q3-2024', Region: 'Latin America', Business_Unit: 'FinTech Solutions', Revenue: 230000, COGS: 73600, Gross_Profit: 156400, OPEX: 81000, EBITDA: 75400, Net_Income: 56550, Budget_Target: 210000, Headcount: 110, Customer_Satisfaction: 90 },
      { Date: '2024-09', Quarter: 'Q3-2024', Region: 'North America', Business_Unit: 'FinTech Solutions', Revenue: 430000, COGS: 133300, Gross_Profit: 296700, OPEX: 130000, EBITDA: 166700, Net_Income: 125025, Budget_Target: 395000, Headcount: 180, Customer_Satisfaction: 91 },
      { Date: '2024-09', Quarter: 'Q3-2024', Region: 'Asia-Pacific', Business_Unit: 'Enterprise Cloud', Revenue: 490000, COGS: 147000, Gross_Profit: 343000, OPEX: 142000, EBITDA: 201000, Net_Income: 150750, Budget_Target: 440000, Headcount: 240, Customer_Satisfaction: 92 },

      { Date: '2024-10', Quarter: 'Q4-2024', Region: 'North America', Business_Unit: 'Enterprise Cloud', Revenue: 560000, COGS: 168000, Gross_Profit: 392000, OPEX: 172000, EBITDA: 220000, Net_Income: 165000, Budget_Target: 510000, Headcount: 280, Customer_Satisfaction: 93 },
      { Date: '2024-10', Quarter: 'Q4-2024', Region: 'Europe', Business_Unit: 'Enterprise Cloud', Revenue: 410000, COGS: 127100, Gross_Profit: 282900, OPEX: 132000, EBITDA: 150900, Net_Income: 113175, Budget_Target: 380000, Headcount: 205, Customer_Satisfaction: 89 },
      { Date: '2024-10', Quarter: 'Q4-2024', Region: 'Asia-Pacific', Business_Unit: 'AI Hardware', Revenue: 850000, COGS: 374000, Gross_Profit: 476000, OPEX: 175000, EBITDA: 301000, Net_Income: 225750, Budget_Target: 760000, Headcount: 420, Customer_Satisfaction: 96 },
      { Date: '2024-11', Quarter: 'Q4-2024', Region: 'North America', Business_Unit: 'AI Hardware', Revenue: 920000, COGS: 404800, Gross_Profit: 515200, OPEX: 198000, EBITDA: 317200, Net_Income: 237900, Budget_Target: 820000, Headcount: 440, Customer_Satisfaction: 96 },
      { Date: '2024-11', Quarter: 'Q4-2024', Region: 'Europe', Business_Unit: 'Consumer SaaS', Revenue: 320000, COGS: 67200, Gross_Profit: 252800, OPEX: 115000, EBITDA: 137800, Net_Income: 103350, Budget_Target: 300000, Headcount: 138, Customer_Satisfaction: 88 },
      { Date: '2024-11', Quarter: 'Q4-2024', Region: 'Latin America', Business_Unit: 'FinTech Solutions', Revenue: 260000, COGS: 80600, Gross_Profit: 179400, OPEX: 87000, EBITDA: 92400, Net_Income: 69300, Budget_Target: 235000, Headcount: 118, Customer_Satisfaction: 91 },
      { Date: '2024-12', Quarter: 'Q4-2024', Region: 'North America', Business_Unit: 'FinTech Solutions', Revenue: 490000, COGS: 147000, Gross_Profit: 343000, OPEX: 141000, EBITDA: 202000, Net_Income: 151500, Budget_Target: 445000, Headcount: 192, Customer_Satisfaction: 93 },
      { Date: '2024-12', Quarter: 'Q4-2024', Region: 'Asia-Pacific', Business_Unit: 'Enterprise Cloud', Revenue: 550000, COGS: 165000, Gross_Profit: 385000, OPEX: 155000, EBITDA: 230000, Net_Income: 172500, Budget_Target: 490000, Headcount: 255, Customer_Satisfaction: 94 },

      { Date: '2025-01', Quarter: 'Q1-2025', Region: 'North America', Business_Unit: 'Enterprise Cloud', Revenue: 620000, COGS: 179800, Gross_Profit: 440200, OPEX: 185000, EBITDA: 255200, Net_Income: 191400, Budget_Target: 570000, Headcount: 295, Customer_Satisfaction: 94 },
      { Date: '2025-01', Quarter: 'Q1-2025', Region: 'Europe', Business_Unit: 'Enterprise Cloud', Revenue: 450000, COGS: 135000, Gross_Profit: 315000, OPEX: 140000, EBITDA: 175000, Net_Income: 131250, Budget_Target: 410000, Headcount: 220, Customer_Satisfaction: 90 },
      { Date: '2025-01', Quarter: 'Q1-2025', Region: 'Asia-Pacific', Business_Unit: 'AI Hardware', Revenue: 980000, COGS: 411600, Gross_Profit: 568400, OPEX: 192000, EBITDA: 376400, Net_Income: 282300, Budget_Target: 880000, Headcount: 460, Customer_Satisfaction: 97 },
      { Date: '2025-02', Quarter: 'Q1-2025', Region: 'North America', Business_Unit: 'AI Hardware', Revenue: 1050000, COGS: 441000, Gross_Profit: 609000, OPEX: 215000, EBITDA: 394000, Net_Income: 295500, Budget_Target: 950000, Headcount: 485, Customer_Satisfaction: 97 },
      { Date: '2025-02', Quarter: 'Q1-2025', Region: 'Europe', Business_Unit: 'Consumer SaaS', Revenue: 355000, COGS: 71000, Gross_Profit: 284000, OPEX: 122000, EBITDA: 162000, Net_Income: 121500, Budget_Target: 330000, Headcount: 145, Customer_Satisfaction: 89 },
      { Date: '2025-02', Quarter: 'Q1-2025', Region: 'Latin America', Business_Unit: 'FinTech Solutions', Revenue: 295000, COGS: 88500, Gross_Profit: 206500, OPEX: 93000, EBITDA: 113500, Net_Income: 85125, Budget_Target: 265000, Headcount: 125, Customer_Satisfaction: 92 },
      { Date: '2025-03', Quarter: 'Q1-2025', Region: 'North America', Business_Unit: 'FinTech Solutions', Revenue: 540000, COGS: 156600, Gross_Profit: 383400, OPEX: 152000, EBITDA: 231400, Net_Income: 173550, Budget_Target: 490000, Headcount: 205, Customer_Satisfaction: 94 },
      { Date: '2025-03', Quarter: 'Q1-2025', Region: 'Asia-Pacific', Business_Unit: 'Enterprise Cloud', Revenue: 620000, COGS: 179800, Gross_Profit: 440200, OPEX: 168000, EBITDA: 272200, Net_Income: 204150, Budget_Target: 550000, Headcount: 270, Customer_Satisfaction: 95 }
    ]
  },

  saas: {
    id: 'saas',
    name: 'SaaS Recurring Revenue & Cohort Metrics',
    description: 'Monthly recurring revenue (MRR), subscriber cohorts, churn rate, customer acquisition cost (CAC), and customer lifetime value (LTV).',
    category: 'Product & Growth',
    source: 'Stripe & Hubspot Telemetry',
    dateColumn: 'Month',
    defaultMetrics: {
      primary: 'MRR',
      secondary: 'Churn_Rate_Pct',
      dimension: 'Month'
    },
    data: [
      { Month: '2024-01', Plan_Tier: 'Starter', Active_Subscribers: 1240, MRR: 37200, New_MRR: 5400, Expansion_MRR: 1200, Churned_MRR: 1800, Churn_Rate_Pct: 4.8, CAC: 145, LTV: 775, LTV_CAC_Ratio: 5.34, Marketing_Spend: 18000, Organic_Signups: 420 },
      { Month: '2024-01', Plan_Tier: 'Professional', Active_Subscribers: 680, MRR: 67320, New_MRR: 8900, Expansion_MRR: 3400, Churned_MRR: 2100, Churn_Rate_Pct: 3.1, CAC: 420, LTV: 3193, LTV_CAC_Ratio: 7.60, Marketing_Spend: 24000, Organic_Signups: 190 },
      { Month: '2024-01', Plan_Tier: 'Enterprise', Active_Subscribers: 145, MRR: 130500, New_MRR: 18000, Expansion_MRR: 9500, Churned_MRR: 1500, Churn_Rate_Pct: 1.1, CAC: 1850, LTV: 81818, LTV_CAC_Ratio: 44.22, Marketing_Spend: 38000, Organic_Signups: 45 },

      { Month: '2024-02', Plan_Tier: 'Starter', Active_Subscribers: 1360, MRR: 40800, New_MRR: 5800, Expansion_MRR: 1400, Churned_MRR: 1600, Churn_Rate_Pct: 3.9, CAC: 138, LTV: 775, LTV_CAC_Ratio: 5.61, Marketing_Spend: 19000, Organic_Signups: 460 },
      { Month: '2024-02', Plan_Tier: 'Professional', Active_Subscribers: 740, MRR: 73260, New_MRR: 9600, Expansion_MRR: 3800, Churned_MRR: 1900, Churn_Rate_Pct: 2.6, CAC: 405, LTV: 3807, LTV_CAC_Ratio: 9.40, Marketing_Spend: 25000, Organic_Signups: 215 },
      { Month: '2024-02', Plan_Tier: 'Enterprise', Active_Subscribers: 162, MRR: 145800, New_MRR: 20500, Expansion_MRR: 11200, Churned_MRR: 1200, Churn_Rate_Pct: 0.8, CAC: 1780, LTV: 112500, LTV_CAC_Ratio: 63.20, Marketing_Spend: 41000, Organic_Signups: 52 },

      { Month: '2024-03', Plan_Tier: 'Starter', Active_Subscribers: 1510, MRR: 45300, New_MRR: 6900, Expansion_MRR: 1600, Churned_MRR: 1700, Churn_Rate_Pct: 3.7, CAC: 132, LTV: 810, LTV_CAC_Ratio: 6.13, Marketing_Spend: 20500, Organic_Signups: 510 },
      { Month: '2024-03', Plan_Tier: 'Professional', Active_Subscribers: 810, MRR: 80190, New_MRR: 10400, Expansion_MRR: 4200, Churned_MRR: 1800, Churn_Rate_Pct: 2.2, CAC: 390, LTV: 4500, LTV_CAC_Ratio: 11.53, Marketing_Spend: 26500, Organic_Signups: 240 },
      { Month: '2024-03', Plan_Tier: 'Enterprise', Active_Subscribers: 184, MRR: 165600, New_MRR: 24000, Expansion_MRR: 13000, Churned_MRR: 1000, Churn_Rate_Pct: 0.6, CAC: 1720, LTV: 150000, LTV_CAC_Ratio: 87.20, Marketing_Spend: 44000, Organic_Signups: 61 },

      { Month: '2024-04', Plan_Tier: 'Starter', Active_Subscribers: 1680, MRR: 50400, New_MRR: 7400, Expansion_MRR: 1800, Churned_MRR: 1900, Churn_Rate_Pct: 3.8, CAC: 128, LTV: 790, LTV_CAC_Ratio: 6.17, Marketing_Spend: 21500, Organic_Signups: 580 },
      { Month: '2024-04', Plan_Tier: 'Professional', Active_Subscribers: 890, MRR: 88110, New_MRR: 11800, Expansion_MRR: 4800, Churned_MRR: 1700, Churn_Rate_Pct: 1.9, CAC: 375, LTV: 5210, LTV_CAC_Ratio: 13.89, Marketing_Spend: 28000, Organic_Signups: 275 },
      { Month: '2024-04', Plan_Tier: 'Enterprise', Active_Subscribers: 208, MRR: 187200, New_MRR: 27500, Expansion_MRR: 15100, Churned_MRR: 800, Churn_Rate_Pct: 0.4, CAC: 1660, LTV: 225000, LTV_CAC_Ratio: 135.54, Marketing_Spend: 47000, Organic_Signups: 74 },

      { Month: '2024-05', Plan_Tier: 'Starter', Active_Subscribers: 1850, MRR: 55500, New_MRR: 8100, Expansion_MRR: 2100, Churned_MRR: 2000, Churn_Rate_Pct: 3.6, CAC: 124, LTV: 833, LTV_CAC_Ratio: 6.71, Marketing_Spend: 23000, Organic_Signups: 640 },
      { Month: '2024-05', Plan_Tier: 'Professional', Active_Subscribers: 980, MRR: 97020, New_MRR: 13200, Expansion_MRR: 5400, Churned_MRR: 1600, Churn_Rate_Pct: 1.6, CAC: 360, LTV: 6187, LTV_CAC_Ratio: 17.18, Marketing_Spend: 29500, Organic_Signups: 310 },
      { Month: '2024-05', Plan_Tier: 'Enterprise', Active_Subscribers: 235, MRR: 211500, New_MRR: 31000, Expansion_MRR: 17500, Churned_MRR: 600, Churn_Rate_Pct: 0.3, CAC: 1600, LTV: 300000, LTV_CAC_Ratio: 187.50, Marketing_Spend: 51000, Organic_Signups: 88 },

      { Month: '2024-06', Plan_Tier: 'Starter', Active_Subscribers: 2040, MRR: 61200, New_MRR: 8900, Expansion_MRR: 2400, Churned_MRR: 2100, Churn_Rate_Pct: 3.4, CAC: 120, LTV: 882, LTV_CAC_Ratio: 7.35, Marketing_Spend: 24500, Organic_Signups: 710 },
      { Month: '2024-06', Plan_Tier: 'Professional', Active_Subscribers: 1080, MRR: 106920, New_MRR: 14800, Expansion_MRR: 6100, Churned_MRR: 1500, Churn_Rate_Pct: 1.4, CAC: 345, LTV: 7071, LTV_CAC_Ratio: 20.49, Marketing_Spend: 31000, Organic_Signups: 350 },
      { Month: '2024-06', Plan_Tier: 'Enterprise', Active_Subscribers: 268, MRR: 241200, New_MRR: 35200, Expansion_MRR: 20400, Churned_MRR: 500, Churn_Rate_Pct: 0.2, CAC: 1540, LTV: 450000, LTV_CAC_Ratio: 292.20, Marketing_Spend: 55000, Organic_Signups: 105 }
    ]
  },

  logistics: {
    id: 'logistics',
    name: 'Global Supply Chain & Logistics Operations',
    description: 'Fleet tracking, freight cost per ton, lead times, defect rates, and supplier delivery SLAs across international trade hubs.',
    category: 'Supply Chain & Ops',
    source: 'Global WMS & IoT Fleet Telemetry',
    dateColumn: 'Date',
    defaultMetrics: {
      primary: 'Total_Freight_Cost',
      secondary: 'Lead_Time_Days',
      dimension: 'Supplier'
    },
    data: [
      { Shipment_ID: 'SHP-901', Date: '2024-01-12', Supplier: 'Apex Silicon', Origin_Country: 'Taiwan', Warehouse_Hub: 'Shenzhen', Transport_Mode: 'Air Express', Units_Shipped: 45000, Unit_Cost: 18.5, Total_Freight_Cost: 62000, Lead_Time_Days: 4, Target_Lead_Time_Days: 5, On_Time: 'Yes', Defect_Rate_Pct: 0.42, CO2_Tons: 18.4 },
      { Shipment_ID: 'SHP-902', Date: '2024-01-18', Supplier: 'Nippon Micro', Origin_Country: 'Japan', Warehouse_Hub: 'Rotterdam', Transport_Mode: 'Ocean Freight', Units_Shipped: 120000, Unit_Cost: 12.0, Total_Freight_Cost: 48000, Lead_Time_Days: 24, Target_Lead_Time_Days: 22, On_Time: 'No', Defect_Rate_Pct: 0.18, CO2_Tons: 42.1 },
      { Shipment_ID: 'SHP-903', Date: '2024-01-25', Supplier: 'Baltic Logistics', Origin_Country: 'Germany', Warehouse_Hub: 'Frankfurt', Transport_Mode: 'Road Fleet', Units_Shipped: 35000, Unit_Cost: 28.0, Total_Freight_Cost: 14500, Lead_Time_Days: 3, Target_Lead_Time_Days: 3, On_Time: 'Yes', Defect_Rate_Pct: 0.31, CO2_Tons: 8.2 },
      { Shipment_ID: 'SHP-904', Date: '2024-02-02', Supplier: 'SingaGlobal', Origin_Country: 'Singapore', Warehouse_Hub: 'Dallas', Transport_Mode: 'Air Express', Units_Shipped: 28000, Unit_Cost: 45.0, Total_Freight_Cost: 59000, Lead_Time_Days: 5, Target_Lead_Time_Days: 6, On_Time: 'Yes', Defect_Rate_Pct: 0.25, CO2_Tons: 22.8 },
      { Shipment_ID: 'SHP-905', Date: '2024-02-14', Supplier: 'EuroTech Labs', Origin_Country: 'USA', Warehouse_Hub: 'Chicago', Transport_Mode: 'Rail Cargo', Units_Shipped: 95000, Unit_Cost: 22.4, Total_Freight_Cost: 26000, Lead_Time_Days: 7, Target_Lead_Time_Days: 8, On_Time: 'Yes', Defect_Rate_Pct: 0.54, CO2_Tons: 14.5 },
      { Shipment_ID: 'SHP-906', Date: '2024-02-28', Supplier: 'Apex Silicon', Origin_Country: 'Taiwan', Warehouse_Hub: 'Chicago', Transport_Mode: 'Air Express', Units_Shipped: 52000, Unit_Cost: 19.0, Total_Freight_Cost: 71000, Lead_Time_Days: 5, Target_Lead_Time_Days: 5, On_Time: 'Yes', Defect_Rate_Pct: 0.38, CO2_Tons: 21.0 },
      { Shipment_ID: 'SHP-907', Date: '2024-03-08', Supplier: 'Nippon Micro', Origin_Country: 'Japan', Warehouse_Hub: 'Rotterdam', Transport_Mode: 'Ocean Freight', Units_Shipped: 140000, Unit_Cost: 11.5, Total_Freight_Cost: 54000, Lead_Time_Days: 21, Target_Lead_Time_Days: 22, On_Time: 'Yes', Defect_Rate_Pct: 0.15, CO2_Tons: 46.0 },
      { Shipment_ID: 'SHP-908', Date: '2024-03-19', Supplier: 'Baltic Logistics', Origin_Country: 'Germany', Warehouse_Hub: 'Rotterdam', Transport_Mode: 'Road Fleet', Units_Shipped: 42000, Unit_Cost: 27.5, Total_Freight_Cost: 16800, Lead_Time_Days: 2, Target_Lead_Time_Days: 3, On_Time: 'Yes', Defect_Rate_Pct: 0.28, CO2_Tons: 9.1 },
      { Shipment_ID: 'SHP-909', Date: '2024-04-05', Supplier: 'SingaGlobal', Origin_Country: 'Singapore', Warehouse_Hub: 'Shenzhen', Transport_Mode: 'Ocean Freight', Units_Shipped: 88000, Unit_Cost: 41.0, Total_Freight_Cost: 38000, Lead_Time_Days: 14, Target_Lead_Time_Days: 15, On_Time: 'Yes', Defect_Rate_Pct: 0.22, CO2_Tons: 31.4 },
      { Shipment_ID: 'SHP-910', Date: '2024-04-16', Supplier: 'EuroTech Labs', Origin_Country: 'USA', Warehouse_Hub: 'Dallas', Transport_Mode: 'Rail Cargo', Units_Shipped: 105000, Unit_Cost: 21.8, Total_Freight_Cost: 29500, Lead_Time_Days: 8, Target_Lead_Time_Days: 8, On_Time: 'Yes', Defect_Rate_Pct: 0.49, CO2_Tons: 16.0 },
      { Shipment_ID: 'SHP-911', Date: '2024-05-02', Supplier: 'Apex Silicon', Origin_Country: 'Taiwan', Warehouse_Hub: 'Frankfurt', Transport_Mode: 'Air Express', Units_Shipped: 61000, Unit_Cost: 19.5, Total_Freight_Cost: 84000, Lead_Time_Days: 4, Target_Lead_Time_Days: 5, On_Time: 'Yes', Defect_Rate_Pct: 0.35, CO2_Tons: 25.2 },
      { Shipment_ID: 'SHP-912', Date: '2024-05-18', Supplier: 'Nippon Micro', Origin_Country: 'Japan', Warehouse_Hub: 'Dallas', Transport_Mode: 'Ocean Freight', Units_Shipped: 165000, Unit_Cost: 11.2, Total_Freight_Cost: 63000, Lead_Time_Days: 26, Target_Lead_Time_Days: 25, On_Time: 'No', Defect_Rate_Pct: 0.19, CO2_Tons: 54.5 }
    ]
  }
};
