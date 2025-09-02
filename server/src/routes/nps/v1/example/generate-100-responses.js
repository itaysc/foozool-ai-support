#!/usr/bin/env node

/**
 * Script to generate 100 NPS responses in alternative format
 * Run with: node generate-100-responses.js > sample-nps-data-100-responses.json
 */

const companies = [
  'TechCorp Inc', 'StartupXYZ', 'Enterprise Solutions', 'Small Business Co', 'Consulting Partners',
  'Retail Solutions', 'Finance Corp', 'Healthcare Systems', 'Education First', 'NonProfit Org',
  'Manufacturing Ltd', 'Software House', 'Digital Agency', 'E-commerce Platform', 'SaaS Company',
  'Consulting Group', 'Financial Services', 'Healthcare Provider', 'Educational Institute', 'Government Agency'
];

const names = [
  'John Doe', 'Sarah Smith', 'Mike Johnson', 'Emma Wilson', 'David Brown',
  'Lisa Garcia', 'Robert Taylor', 'Anna Lee', 'James Martinez', 'Maria Rodriguez',
  'Alex Thompson', 'Jennifer White', 'Michael Davis', 'Emily Anderson', 'Christopher Lee',
  'Jessica Taylor', 'Daniel Wilson', 'Amanda Garcia', 'Matthew Rodriguez', 'Stephanie Martinez'
];

const domains = [
  'techcorp.com', 'startupxyz.com', 'enterprise.com', 'smallbiz.com', 'consulting.com',
  'retail.com', 'finance.com', 'healthcare.com', 'education.com', 'nonprofit.com',
  'manufacturing.com', 'software.com', 'digital.com', 'ecommerce.com', 'saas.com',
  'consultinggroup.com', 'financial.com', 'healthcare.com', 'edu.com', 'gov.com'
];

const satisfactionLevels = [
  'Extremely Satisfied', 'Very Satisfied', 'Satisfied', 'Somewhat Satisfied', 'Neutral',
  'Somewhat Dissatisfied', 'Dissatisfied', 'Very Dissatisfied'
];

const qualityLevels = [
  'Outstanding', 'Excellent', 'Very Good', 'Good', 'Average', 'Fair', 'Poor'
];

const valueLevels = [
  'Excellent Value', 'Good Value', 'Fair Value', 'Overpriced', 'Too Expensive', 'Not Worth It'
];

const usageFrequencies = [
  'Multiple times daily', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Rarely', 'Never'
];

const improvementSuggestions = [
  'The mobile app could use some UI improvements',
  'More integration options would be helpful',
  'No improvements needed - perfect as is!',
  'Pricing is too high for small businesses',
  'Better documentation would help',
  'Customer service needs major improvement',
  'More financial reporting features',
  'HIPAA compliance features needed',
  'Student dashboard improvements',
  'Need nonprofit pricing tiers',
  'Performance optimization required',
  'More customization options',
  'Better search functionality',
  'Mobile responsiveness improvements',
  'API rate limiting issues',
  'Data export features needed',
  'Real-time notifications',
  'Advanced analytics dashboard',
  'Multi-language support',
  'Dark mode theme'
];

function generateRandomResponse(index) {
  const companyIndex = index % companies.length;
  const nameIndex = index % names.length;
  const domainIndex = index % domains.length;
  
  const npsRating = Math.floor(Math.random() * 11); // 0-10
  const satisfactionIndex = Math.min(Math.floor(npsRating / 1.5), satisfactionLevels.length - 1);
  const qualityIndex = Math.min(Math.floor(npsRating / 1.5), qualityLevels.length - 1);
  const valueIndex = Math.min(Math.floor(npsRating / 1.5), valueLevels.length - 1);
  
  const baseDate = new Date('2025-08-01T00:00:00Z');
  const randomHours = Math.floor(Math.random() * 24 * 20); // Random time over 20 days
  const submissionTime = new Date(baseDate.getTime() + randomHours * 60 * 60 * 1000);
  
  return {
    "response_id": `fb_${String(index + 1).padStart(3, '0')}`,
    "submission_time": submissionTime.toISOString(),
    "customer_email": `${names[nameIndex].toLowerCase().replace(' ', '.')}@${domains[domainIndex]}`,
    "customer_name": names[nameIndex],
    "customer_company": companies[companyIndex],
    "survey_version": "v2.1",
    "responses": {
      "nps_rating": npsRating,
      "overall_satisfaction": satisfactionLevels[satisfactionIndex],
      "product_quality": qualityLevels[qualityIndex],
      "customer_support": qualityLevels[qualityIndex],
      "value_for_money": valueLevels[valueIndex],
      "improvement_suggestions": improvementSuggestions[Math.floor(Math.random() * improvementSuggestions.length)],
      "would_recommend": npsRating >= 7,
      "usage_frequency": usageFrequencies[Math.floor(Math.random() * usageFrequencies.length)]
    }
  };
}

function generateFullDataset() {
  const responses = [];
  
  for (let i = 0; i < 100; i++) {
    responses.push(generateRandomResponse(i));
  }
  
  return {
    "metadata": {
      "source": "Customer Feedback Platform",
      "version": "2.1",
      "exported_at": "2024-01-20T15:30:00Z",
      "total_responses": 100,
      "survey_period": "2024-01-01 to 2024-01-20",
      "generated_by": "generate-100-responses.js script"
    },
    "feedback_data": responses
  };
}

// Generate and output the data
const data = generateFullDataset();
console.log(JSON.stringify(data, null, 2));

