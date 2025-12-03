#!/usr/bin/env node

/**
 * Quick Map API Test
 * Tests the dispatch map endpoints to verify optimizations
 */

async function testMapAPIs() {
  console.log('🗺️  Testing Map API Endpoints...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  const endpoints = [
    '/api/test',
    '/api/dispatch/techs',
    '/api/dispatch/jobs/active',
    '/api/dispatch/stats?timeRange=today'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const start = Date.now();
      
      const response = await fetch(`${baseUrl}${endpoint}`);
      const end = Date.now();
      const responseTime = end - start;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint} - ${responseTime}ms`);
        
        // Show some data for dispatch endpoints
        if (endpoint.includes('/dispatch/')) {
          if (data.techs) {
            console.log(`   Techs: ${data.techs.length}`);
          }
          if (data.jobs) {
            console.log(`   Jobs: ${data.jobs.length}`);
          }
          if (data.kpis) {
            console.log(`   KPIs: ${Object.keys(data.kpis).length}`);
          }
        }
      } else {
        console.log(`❌ ${endpoint} - HTTP ${response.status}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}\n`);
    }
  }
  
  console.log('✅ Map API test complete!');
}

// Run the test
testMapAPIs().catch(console.error);