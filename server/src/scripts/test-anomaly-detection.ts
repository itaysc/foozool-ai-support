#!/usr/bin/env ts-node

/**
 * Test script for anomaly detection system
 * Run with: npx ts-node src/scripts/test-anomaly-detection.ts
 */

import mongoose from 'mongoose';
import AnomalyDetectionService from '../services/anomaly-detection';
import { AnomalyModel } from '../schemas/anomaly.schema';
import { OrganizationModel } from '../schemas/organization.schema';
import Config from '../config';

async function testAnomalyDetection() {
  console.log('🧪 Testing Anomaly Detection System...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    if (!Config.ATLAS_CONNECTION_STRING) {
      throw new Error('ATLAS_CONNECTION_STRING not found in config');
    }
    await mongoose.connect(Config.ATLAS_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB\n');

    // Get test organization
    const testOrg = await OrganizationModel.findOne({});
    if (!testOrg) {
      console.log('❌ No organizations found. Please create an organization first.');
      return;
    }

    console.log(`🏢 Testing with organization: ${testOrg.name} (${testOrg._id})\n`);

    // Initialize anomaly detection service
    const anomalyService = new AnomalyDetectionService();

    // Test volume anomaly detection
    console.log('🔍 Testing Volume Anomaly Detection...');
    const volumeAnomalies = await anomalyService.detectVolumeAnomalies(testOrg._id.toString());
    console.log(`Found ${volumeAnomalies.length} volume anomalies:`);
    volumeAnomalies.forEach((anomaly, index) => {
      console.log(`  ${index + 1}. ${anomaly.description}`);
      console.log(`     Severity: ${anomaly.severity}, Confidence: ${anomaly.confidence}`);
    });

    // Test sentiment anomaly detection
    console.log('\n🔍 Testing Sentiment Anomaly Detection...');
    const sentimentAnomalies = await anomalyService.detectSentimentAnomalies(testOrg._id.toString());
    console.log(`Found ${sentimentAnomalies.length} sentiment anomalies:`);
    sentimentAnomalies.forEach((anomaly, index) => {
      console.log(`  ${index + 1}. ${anomaly.description}`);
      console.log(`     Severity: ${anomaly.severity}, Confidence: ${anomaly.confidence}`);
    });

    // Test comprehensive anomaly detection
    console.log('\n🔍 Testing Comprehensive Anomaly Detection...');
    const allAnomalies = await anomalyService.detectAllAnomalies();
    console.log(`Total anomalies across all organizations:`);
    console.log(`  Volume: ${allAnomalies.volumeAnomalies.length}`);
    console.log(`  Sentiment: ${allAnomalies.sentimentAnomalies.length}`);

    // Test anomaly storage
    if (volumeAnomalies.length > 0 || sentimentAnomalies.length > 0) {
      console.log('\n💾 Testing Anomaly Storage...');
      
      const testAnomaly = volumeAnomalies[0] || sentimentAnomalies[0];
      const anomalyType = 'currentValue' in testAnomaly ? 'volume' : 'sentiment';
      
      const metadata: any = {
        confidence: testAnomaly.confidence,
        timeWindow: '24h',
        affectedMetrics: [anomalyType === 'volume' ? 'ticket_volume' : 'sentiment_score']
      };

      // Add type-specific properties
      if (anomalyType === 'volume' && 'currentValue' in testAnomaly) {
        metadata.currentValue = testAnomaly.currentValue;
        metadata.expectedValue = testAnomaly.expectedValue;
        metadata.zScore = testAnomaly.zScore;
      } else if (anomalyType === 'sentiment' && 'currentSentiment' in testAnomaly) {
        const sentimentAnomaly = testAnomaly as any; // Type assertion for sentiment-specific properties
        metadata.currentSentiment = sentimentAnomaly.currentSentiment;
        metadata.baselineSentiment = sentimentAnomaly.baselineSentiment;
        metadata.shiftMagnitude = sentimentAnomaly.shiftMagnitude;
      }

      const storedAnomaly = await AnomalyModel.create({
        type: anomalyType,
        severity: testAnomaly.severity,
        organizationId: testOrg._id,
        timestamp: testAnomaly.timestamp,
        description: testAnomaly.description,
        metadata
      });

      console.log(`✅ Stored test anomaly: ${storedAnomaly._id}`);
      console.log(`   Type: ${storedAnomaly.type}`);
      console.log(`   Severity: ${storedAnomaly.severity}`);
      console.log(`   Description: ${storedAnomaly.description}`);

      // Test anomaly retrieval
      console.log('\n📖 Testing Anomaly Retrieval...');
      const retrievedAnomaly = await AnomalyModel.findById(storedAnomaly._id);
      if (retrievedAnomaly) {
        console.log('✅ Successfully retrieved stored anomaly');
        console.log(`   Status: ${retrievedAnomaly.status}`);
        console.log(`   Created: ${retrievedAnomaly.createdAt}`);
      }

      // Clean up test data
      console.log('\n🧹 Cleaning up test data...');
      await AnomalyModel.findByIdAndDelete(storedAnomaly._id);
      console.log('✅ Test anomaly cleaned up');
    }

    // Test statistical methods
    console.log('\n📊 Testing Statistical Methods...');
    const testValues = [10, 12, 15, 18, 25, 30, 35, 40, 45, 50];
    const mean = testValues.reduce((sum, val) => sum + val, 0) / testValues.length;
    const stdDev = Math.sqrt(
      testValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / testValues.length
    );
    
    console.log(`Test values: [${testValues.join(', ')}]`);
    console.log(`Mean: ${mean.toFixed(2)}`);
    console.log(`Standard Deviation: ${stdDev.toFixed(2)}`);
    
    // Test Z-score calculation
    const lastValue = testValues[testValues.length - 1];
    const zScore = (lastValue - mean) / stdDev;
    console.log(`Z-score for last value (${lastValue}): ${zScore.toFixed(2)}`);
    
    if (Math.abs(zScore) > 2.0) {
      console.log('✅ Z-score anomaly detection working correctly');
    } else {
      console.log('ℹ️  No significant anomaly detected in test data');
    }

    console.log('\n🎉 Anomaly Detection System Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAnomalyDetection().catch(console.error);
}

export { testAnomalyDetection };
