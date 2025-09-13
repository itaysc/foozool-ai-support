import { BaseMigration } from '../BaseMigration';
import { MigrationResult } from '../types';
import QdrantService from '../../qdrant/service';
import { ticketCollectionConfig, QdrantTicketPoint } from '../../qdrant/schemas/ticket';
import { v5 as uuidv5 } from 'uuid';
import { QDRANT_POINT_NAMESPACE } from '../../qdrant/utils';
import { analyzeSentiment } from '../../services/nlp';
import { getSBERTEmbedding } from '../../services/call-python';

/**
 * Migration to add 50 realistic tickets for Amazon Web Services customer to Qdrant collection.
 * 
 * This migration is idempotent - it will only create tickets if none exist for the customer.
 * 
 * To run this migration:
 * 1. Via API: POST /api/v1/migrations/run/add-amazon-web-services-tickets
 * 2. Via migration service: The migration will be automatically discovered and available
 * 
 * The migration creates realistic tickets covering all 5 services:
 * - API Access Logs
 * - Consultant Hours  
 * - Threat Monitoring
 * - Onboarding Support
 * - Compliance Reporting
 */
export class AddAmazonWebServicesTicketsMigration extends BaseMigration {
  name = 'add-amazon-web-services-tickets';
  description = 'Add 50 realistic tickets for Amazon Web Services customer to Qdrant collection';
  version = '1.0.0';
  databaseType = 'qdrant' as const;

  private readonly COLLECTION_NAME = ticketCollectionConfig.name;
  private readonly ORGANIZATION_ID = '68485e9d1b8bc528969fee61';
  private readonly CUSTOMER_ID = '68bf380892aa6032eb66826e';
  private readonly CUSTOMER_NAME = 'Amazon Web Services';

  // Realistic AWS-related ticket data
  private readonly AWS_TICKETS = [
    {
      subject: 'API Access Logs - Missing authentication events',
      description: 'We are not seeing authentication events in our API access logs for the last 24 hours. This is critical for our security monitoring. Can you please check if there is an issue with the logging service?',
      user: 'Sarah Chen',
      email: 'sarah.chen@amazon.com',
      tags: ['api-access-logs', 'authentication', 'security', 'urgent'],
      status: 'open' as const,
      priority: 'high'
    },
    {
      subject: 'Consultant Hours - Billing discrepancy for Q4',
      description: 'We noticed a discrepancy in our consultant hours billing for Q4. The invoice shows 120 hours but our internal tracking shows 95 hours. Can you provide a detailed breakdown of the hours billed?',
      user: 'Michael Rodriguez',
      email: 'michael.rodriguez@amazon.com',
      tags: ['consultant-hours', 'billing', 'discrepancy', 'q4'],
      status: 'pending' as const,
      priority: 'medium'
    },
    {
      subject: 'Threat Monitoring - False positive alerts',
      description: 'We are receiving too many false positive alerts from the threat monitoring system. This is causing alert fatigue for our security team. Can we adjust the sensitivity settings or implement better filtering?',
      user: 'Jennifer Liu',
      email: 'jennifer.liu@amazon.com',
      tags: ['threat-monitoring', 'false-positives', 'alerts', 'security'],
      status: 'open' as const,
      priority: 'medium'
    },
    {
      subject: 'Onboarding Support - New team member access',
      description: 'We have a new team member joining our AWS account team next week. They need access to all our services including API logs, threat monitoring, and compliance reporting. Can you help set up their access?',
      user: 'David Kim',
      email: 'david.kim@amazon.com',
      tags: ['onboarding', 'access', 'new-user', 'setup'],
      status: 'new' as const,
      priority: 'medium'
    },
    {
      subject: 'Compliance Reporting - SOC 2 report generation',
      description: 'We need to generate our SOC 2 compliance report for the audit next month. The automated report generation seems to be missing some data points. Can you help us troubleshoot this?',
      user: 'Lisa Thompson',
      email: 'lisa.thompson@amazon.com',
      tags: ['compliance', 'soc2', 'reporting', 'audit'],
      status: 'open' as const,
      priority: 'high'
    },
    {
      subject: 'API Access Logs - Performance degradation',
      description: 'We are experiencing slow response times when querying our API access logs. The queries that used to take 2-3 seconds are now taking 15-20 seconds. This is affecting our monitoring dashboards.',
      user: 'Robert Johnson',
      email: 'robert.johnson@amazon.com',
      tags: ['api-access-logs', 'performance', 'slow-queries', 'monitoring'],
      status: 'open' as const,
      priority: 'high'
    },
    {
      subject: 'Consultant Hours - Project scope clarification',
      description: 'We need clarification on the scope of the consultant hours for our migration project. The current allocation seems insufficient for the complexity of our AWS infrastructure migration.',
      user: 'Maria Garcia',
      email: 'maria.garcia@amazon.com',
      tags: ['consultant-hours', 'migration', 'scope', 'infrastructure'],
      status: 'pending' as const,
      priority: 'medium'
    },
    {
      subject: 'Threat Monitoring - Integration with AWS Security Hub',
      description: 'We want to integrate your threat monitoring system with AWS Security Hub for centralized security management. Is this integration supported and how can we set it up?',
      user: 'James Wilson',
      email: 'james.wilson@amazon.com',
      tags: ['threat-monitoring', 'integration', 'aws-security-hub', 'centralized'],
      status: 'new' as const,
      priority: 'low'
    },
    {
      subject: 'Onboarding Support - Training materials request',
      description: 'Our team needs updated training materials for the new features in your platform. Can you provide comprehensive documentation and training resources?',
      user: 'Amanda Davis',
      email: 'amanda.davis@amazon.com',
      tags: ['onboarding', 'training', 'documentation', 'materials'],
      status: 'open' as const,
      priority: 'low'
    },
    {
      subject: 'Compliance Reporting - GDPR data export',
      description: 'We need to export all our data for GDPR compliance purposes. Can you help us generate a complete data export including all logs, reports, and user data?',
      user: 'Christopher Brown',
      email: 'christopher.brown@amazon.com',
      tags: ['compliance', 'gdpr', 'data-export', 'privacy'],
      status: 'open' as const,
      priority: 'high'
    },
    {
      subject: 'API Access Logs - Data retention policy',
      description: 'We need to understand your data retention policy for API access logs. How long are the logs kept and can we request longer retention for compliance purposes?',
      user: 'Emily Taylor',
      email: 'emily.taylor@amazon.com',
      tags: ['api-access-logs', 'retention', 'policy', 'compliance'],
      status: 'pending' as const,
      priority: 'medium'
    },
    {
      subject: 'Consultant Hours - Emergency support request',
      description: 'We have a critical production issue and need immediate consultant support. Our AWS services are experiencing downtime and we need expert assistance to resolve this quickly.',
      user: 'Daniel Martinez',
      email: 'daniel.martinez@amazon.com',
      tags: ['consultant-hours', 'emergency', 'production', 'downtime'],
      status: 'open' as const,
      priority: 'urgent'
    },
    {
      subject: 'Threat Monitoring - Custom alert rules',
      description: 'We need to create custom alert rules for our specific AWS environment. The default rules are not catching some of our security concerns. Can you help us configure custom rules?',
      user: 'Rachel Green',
      email: 'rachel.green@amazon.com',
      tags: ['threat-monitoring', 'custom-rules', 'alerts', 'configuration'],
      status: 'open' as const,
      priority: 'medium'
    },
    {
      subject: 'Onboarding Support - SSO integration issues',
      description: 'We are having trouble setting up SSO integration with our AWS account. The SAML configuration seems to be failing. Can you provide step-by-step guidance?',
      user: 'Kevin Lee',
      email: 'kevin.lee@amazon.com',
      tags: ['onboarding', 'sso', 'saml', 'integration'],
      status: 'open' as const,
      priority: 'high'
    },
    {
      subject: 'Compliance Reporting - Audit trail missing',
      description: 'Our audit trail seems to be missing some entries for the last week. This is concerning for our compliance requirements. Can you investigate and restore the missing data?',
      user: 'Nicole White',
      email: 'nicole.white@amazon.com',
      tags: ['compliance', 'audit-trail', 'missing-data', 'investigation'],
      status: 'open' as const,
      priority: 'high'
    },
    {
      subject: 'API Access Logs - Unusual traffic patterns',
      description: 'We are seeing unusual traffic patterns in our API access logs. There seems to be a spike in requests from unusual IP addresses. Can you help us investigate this potential security issue?',
      user: 'Andrew Clark',
      email: 'andrew.clark@amazon.com',
      tags: ['api-access-logs', 'security', 'unusual-traffic', 'investigation'],
      status: 'open' as const,
      priority: 'urgent'
    },
    {
      subject: 'Consultant Hours - Project timeline extension',
      description: 'We need to extend our consultant hours project timeline due to additional requirements from our AWS architecture team. Can we discuss extending the current engagement?',
      user: 'Stephanie Adams',
      email: 'stephanie.adams@amazon.com',
      tags: ['consultant-hours', 'timeline', 'extension', 'requirements'],
      status: 'pending' as const,
      priority: 'medium'
    },
    {
      subject: 'Threat Monitoring - Dashboard customization',
      description: 'We need to customize our threat monitoring dashboard to better fit our AWS security workflow. Can you help us configure the dashboard layout and widgets?',
      user: 'Matthew Turner',
      email: 'matthew.turner@amazon.com',
      tags: ['threat-monitoring', 'dashboard', 'customization', 'workflow'],
      status: 'new' as const,
      priority: 'low'
    },
    {
      subject: 'Onboarding Support - API key management',
      description: 'We need help setting up proper API key management for our team. We want to implement rotation policies and access controls. Can you guide us through this process?',
      user: 'Jessica Hall',
      email: 'jessica.hall@amazon.com',
      tags: ['onboarding', 'api-keys', 'management', 'security'],
      status: 'open' as const,
      priority: 'medium'
    },
    {
      subject: 'Compliance Reporting - Automated report scheduling',
      description: 'We want to set up automated compliance reports that are generated and sent to our compliance team on a monthly basis. Is this feature available and how can we configure it?',
      user: 'Ryan Murphy',
      email: 'ryan.murphy@amazon.com',
      tags: ['compliance', 'automation', 'scheduling', 'reports'],
      status: 'new' as const,
      priority: 'low'
    },
    {
      subject: 'API Access Logs - Data format changes',
      description: 'We noticed that the data format in our API access logs has changed recently. This is breaking our downstream processing systems. Can you provide documentation on the new format?',
      user: 'Laura Scott',
      email: 'laura.scott@amazon.com',
      tags: ['api-access-logs', 'format', 'breaking-change', 'documentation'],
      status: 'open' as const,
      priority: 'high'
    },
    {
      subject: 'Consultant Hours - Technical deep dive session',
      description: 'We need a technical deep dive session with your consultant to understand the advanced features of your platform. Can we schedule a 2-hour session for next week?',
      user: 'Brian Young',
      email: 'brian.young@amazon.com',
      tags: ['consultant-hours', 'training', 'deep-dive', 'advanced-features'],
      status: 'pending' as const,
      priority: 'low'
    },
    {
      subject: 'Threat Monitoring - Integration with AWS CloudTrail',
      description: 'We want to integrate your threat monitoring with AWS CloudTrail for comprehensive security monitoring. Is this integration available and how do we set it up?',
      user: 'Michelle King',
      email: 'michelle.king@amazon.com',
      tags: ['threat-monitoring', 'cloudtrail', 'integration', 'security'],
      status: 'new' as const,
      priority: 'medium'
    },
    {
      subject: 'Onboarding Support - Multi-region deployment',
      description: 'We need to deploy your services across multiple AWS regions for redundancy. Can you provide guidance on the best practices for multi-region deployment?',
      user: 'Jason Wright',
      email: 'jason.wright@amazon.com',
      tags: ['onboarding', 'multi-region', 'deployment', 'redundancy'],
      status: 'open' as const,
      priority: 'medium'
    },
    {
      subject: 'Compliance Reporting - Data encryption verification',
      description: 'We need to verify that all our data is properly encrypted both in transit and at rest. Can you provide documentation on your encryption standards and verification methods?',
      user: 'Ashley Lopez',
      email: 'ashley.lopez@amazon.com',
      tags: ['compliance', 'encryption', 'verification', 'security'],
      status: 'pending' as const,
      priority: 'high'
    },
    {
      subject: 'API Access Logs - Rate limiting issues',
      description: 'We are experiencing rate limiting issues when accessing our API logs. The limits seem too restrictive for our monitoring needs. Can we discuss increasing the limits?',
      user: 'Brandon Hill',
      email: 'brandon.hill@amazon.com',
      tags: ['api-access-logs', 'rate-limiting', 'monitoring', 'limits'],
      status: 'open' as const,
      priority: 'medium'
    },
    {
      subject: 'Consultant Hours - Architecture review',
      description: 'We need a comprehensive architecture review of our AWS setup by your consultant. This is for our upcoming security audit and we need expert recommendations.',
      user: 'Samantha Carter',
      email: 'samantha.carter@amazon.com',
      tags: ['consultant-hours', 'architecture', 'review', 'audit'],
      status: 'pending' as const,
      priority: 'high'
    },
    {
      subject: 'Threat Monitoring - Custom threat intelligence',
      description: 'We want to integrate our custom threat intelligence feeds with your monitoring system. Can you help us configure this integration and ensure proper data flow?',
      user: 'Tyler Reed',
      email: 'tyler.reed@amazon.com',
      tags: ['threat-monitoring', 'threat-intelligence', 'custom-feeds', 'integration'],
      status: 'new' as const,
      priority: 'medium'
    },
    {
      subject: 'Onboarding Support - Disaster recovery planning',
      description: 'We need help developing a disaster recovery plan for our AWS services using your platform. Can you provide guidance on backup strategies and recovery procedures?',
      user: 'Vanessa Cooper',
      email: 'vanessa.cooper@amazon.com',
      tags: ['onboarding', 'disaster-recovery', 'backup', 'planning'],
      status: 'open' as const,
      priority: 'medium'
    },
    {
      subject: 'Compliance Reporting - Penetration testing results',
      description: 'We need to include our penetration testing results in our compliance reports. Can you help us format and integrate this data into our existing reports?',
      user: 'Gregory Ward',
      email: 'gregory.ward@amazon.com',
      tags: ['compliance', 'penetration-testing', 'reports', 'integration'],
      status: 'pending' as const,
      priority: 'medium'
    },
    {
      subject: 'API Access Logs - Historical data access',
      description: 'We need to access historical API access logs from 6 months ago for a compliance audit. The current interface only shows 3 months of data. Can you help us retrieve this data?',
      user: 'Catherine Bell',
      email: 'catherine.bell@amazon.com',
      tags: ['api-access-logs', 'historical-data', 'compliance', 'audit'],
      status: 'open' as const,
      priority: 'high'
    },
    {
      subject: 'Consultant Hours - Performance optimization',
      description: 'We need consultant support to optimize the performance of our AWS services. We are experiencing slow response times and need expert guidance on optimization strategies.',
      user: 'Nathan Foster',
      email: 'nathan.foster@amazon.com',
      tags: ['consultant-hours', 'performance', 'optimization', 'response-times'],
      status: 'open' as const,
      priority: 'high'
    },
    {
      subject: 'Threat Monitoring - Machine learning models',
      description: 'We are interested in using machine learning models for threat detection. Does your platform support custom ML models and how can we integrate them?',
      user: 'Olivia Price',
      email: 'olivia.price@amazon.com',
      tags: ['threat-monitoring', 'machine-learning', 'models', 'detection'],
      status: 'new' as const,
      priority: 'low'
    },
    {
      subject: 'Onboarding Support - Cost optimization',
      description: 'We need help optimizing our AWS costs while maintaining performance. Can your consultant provide recommendations for cost-effective configurations?',
      user: 'Ethan Brooks',
      email: 'ethan.brooks@amazon.com',
      tags: ['onboarding', 'cost-optimization', 'aws-costs', 'recommendations'],
      status: 'pending' as const,
      priority: 'medium'
    },
    {
      subject: 'Compliance Reporting - Data residency requirements',
      description: 'We have data residency requirements for our European operations. Can you confirm that our data is stored in EU regions and provide documentation for compliance?',
      user: 'Isabella Wood',
      email: 'isabella.wood@amazon.com',
      tags: ['compliance', 'data-residency', 'eu-regions', 'documentation'],
      status: 'open' as const,
      priority: 'high'
    },
    {
      subject: 'API Access Logs - Real-time streaming',
      description: 'We need real-time streaming of our API access logs for our monitoring systems. Is this feature available and how can we set it up?',
      user: 'Alexander Rivera',
      email: 'alexander.rivera@amazon.com',
      tags: ['api-access-logs', 'real-time', 'streaming', 'monitoring'],
      status: 'new' as const,
      priority: 'medium'
    },
    {
      subject: 'Consultant Hours - Security best practices',
      description: 'We need a comprehensive session on security best practices for our AWS environment. Can we schedule a consultant session to cover all aspects of security?',
      user: 'Grace Torres',
      email: 'grace.torres@amazon.com',
      tags: ['consultant-hours', 'security', 'best-practices', 'training'],
      status: 'pending' as const,
      priority: 'medium'
    },
    {
      subject: 'Threat Monitoring - Incident response automation',
      description: 'We want to automate our incident response processes using your threat monitoring system. Can you help us set up automated responses and workflows?',
      user: 'Lucas Peterson',
      email: 'lucas.peterson@amazon.com',
      tags: ['threat-monitoring', 'incident-response', 'automation', 'workflows'],
      status: 'new' as const,
      priority: 'medium'
    },
    {
      subject: 'Onboarding Support - Multi-account management',
      description: 'We manage multiple AWS accounts and need help setting up centralized management through your platform. Can you guide us through the multi-account setup?',
      user: 'Chloe Gray',
      email: 'chloe.gray@amazon.com',
      tags: ['onboarding', 'multi-account', 'centralized', 'management'],
      status: 'open' as const,
      priority: 'medium'
    },
    {
      subject: 'Compliance Reporting - Third-party integrations',
      description: 'We need to integrate our compliance reports with third-party compliance tools. Can you provide APIs or integration options for this?',
      user: 'Mason Hughes',
      email: 'mason.hughes@amazon.com',
      tags: ['compliance', 'third-party', 'integrations', 'apis'],
      status: 'pending' as const,
      priority: 'low'
    },
    {
      subject: 'API Access Logs - Data anonymization',
      description: 'We need to anonymize sensitive data in our API access logs for privacy compliance. Can you help us configure data anonymization settings?',
      user: 'Zoe Butler',
      email: 'zoe.butler@amazon.com',
      tags: ['api-access-logs', 'anonymization', 'privacy', 'compliance'],
      status: 'open' as const,
      priority: 'high'
    },
    {
      subject: 'Consultant Hours - Migration planning',
      description: 'We are planning to migrate some of our legacy systems to AWS and need consultant support for the migration planning. Can we schedule a planning session?',
      user: 'Logan Simmons',
      email: 'logan.simmons@amazon.com',
      tags: ['consultant-hours', 'migration', 'planning', 'legacy-systems'],
      status: 'pending' as const,
      priority: 'medium'
    },
    {
      subject: 'Threat Monitoring - Custom dashboards',
      description: 'We need to create custom dashboards for different teams in our organization. Can you help us set up role-based dashboard access and customization?',
      user: 'Ava Russell',
      email: 'ava.russell@amazon.com',
      tags: ['threat-monitoring', 'dashboards', 'role-based', 'customization'],
      status: 'new' as const,
      priority: 'low'
    },
    {
      subject: 'Onboarding Support - Backup and restore testing',
      description: 'We need to test our backup and restore procedures for disaster recovery. Can you help us plan and execute comprehensive backup testing?',
      user: 'Jackson Bryant',
      email: 'jackson.bryant@amazon.com',
      tags: ['onboarding', 'backup', 'restore', 'testing'],
      status: 'open' as const,
      priority: 'medium'
    },
    {
      subject: 'Compliance Reporting - Data lineage tracking',
      description: 'We need to track data lineage for our compliance reports to show how data flows through our systems. Is this feature available in your platform?',
      user: 'Sophia Griffin',
      email: 'sophia.griffin@amazon.com',
      tags: ['compliance', 'data-lineage', 'tracking', 'data-flow'],
      status: 'pending' as const,
      priority: 'medium'
    },
    {
      subject: 'API Access Logs - Custom log formats',
      description: 'We need to customize the format of our API access logs to match our internal logging standards. Can you help us configure custom log formats?',
      user: 'Benjamin Diaz',
      email: 'benjamin.diaz@amazon.com',
      tags: ['api-access-logs', 'custom-formats', 'logging', 'standards'],
      status: 'new' as const,
      priority: 'low'
    },
    {
      subject: 'Consultant Hours - Capacity planning',
      description: 'We need help with capacity planning for our AWS services to handle expected growth. Can we schedule a consultant session to discuss scaling strategies?',
      user: 'Emma Hayes',
      email: 'emma.hayes@amazon.com',
      tags: ['consultant-hours', 'capacity-planning', 'scaling', 'growth'],
      status: 'pending' as const,
      priority: 'medium'
    },
    {
      subject: 'Threat Monitoring - Threat hunting queries',
      description: 'We want to create custom threat hunting queries to proactively search for security threats. Can you help us develop and implement these queries?',
      user: 'William Myers',
      email: 'william.myers@amazon.com',
      tags: ['threat-monitoring', 'threat-hunting', 'queries', 'proactive'],
      status: 'new' as const,
      priority: 'medium'
    },
    {
      subject: 'Onboarding Support - Performance monitoring setup',
      description: 'We need to set up comprehensive performance monitoring for our AWS services. Can you help us configure monitoring dashboards and alerting?',
      user: 'Abigail Flores',
      email: 'abigail.flores@amazon.com',
      tags: ['onboarding', 'performance-monitoring', 'dashboards', 'alerting'],
      status: 'open' as const,
      priority: 'medium'
    },
    {
      subject: 'Compliance Reporting - Data quality validation',
      description: 'We need to validate the quality of data in our compliance reports. Can you help us set up data quality checks and validation rules?',
      user: 'Henry Washington',
      email: 'henry.washington@amazon.com',
      tags: ['compliance', 'data-quality', 'validation', 'checks'],
      status: 'pending' as const,
      priority: 'medium'
    },
    {
      subject: 'API Access Logs - Log aggregation optimization',
      description: 'We need to optimize our log aggregation process to reduce storage costs while maintaining data integrity. Can you provide recommendations?',
      user: 'Madison Cook',
      email: 'madison.cook@amazon.com',
      tags: ['api-access-logs', 'aggregation', 'optimization', 'storage'],
      status: 'open' as const,
      priority: 'low'
    },
    {
      subject: 'Consultant Hours - Security architecture review',
      description: 'We need a comprehensive security architecture review of our AWS environment. Can we schedule a consultant session to evaluate our security posture?',
      user: 'Sebastian Bailey',
      email: 'sebastian.bailey@amazon.com',
      tags: ['consultant-hours', 'security-architecture', 'review', 'posture'],
      status: 'pending' as const,
      priority: 'high'
    },
    {
      subject: 'Threat Monitoring - Behavioral analytics',
      description: 'We want to implement behavioral analytics to detect anomalous user behavior. Does your platform support behavioral analysis and how can we configure it?',
      user: 'Evelyn Reed',
      email: 'evelyn.reed@amazon.com',
      tags: ['threat-monitoring', 'behavioral-analytics', 'anomaly-detection', 'users'],
      status: 'new' as const,
      priority: 'low'
    },
    {
      subject: 'Onboarding Support - Network security configuration',
      description: 'We need help configuring network security settings for our AWS environment. Can you provide guidance on best practices for network security?',
      user: 'Gabriel Cox',
      email: 'gabriel.cox@amazon.com',
      tags: ['onboarding', 'network-security', 'configuration', 'best-practices'],
      status: 'open' as const,
      priority: 'medium'
    },
    {
      subject: 'Compliance Reporting - Automated compliance checks',
      description: 'We want to set up automated compliance checks that run continuously. Can you help us configure automated compliance monitoring and reporting?',
      user: 'Lily Ward',
      email: 'lily.ward@amazon.com',
      tags: ['compliance', 'automation', 'continuous-monitoring', 'checks'],
      status: 'pending' as const,
      priority: 'medium'
    }
  ];

  protected async execute(): Promise<MigrationResult> {
    const qdrantService = new QdrantService();
    const result: MigrationResult = {
      success: false,
      totalRecords: this.AWS_TICKETS.length,
      processedRecords: 0,
      errors: []
    };

    console.log(`🚀 Starting ${this.name} migration...`);
    console.log(`📊 Will create ${this.AWS_TICKETS.length} tickets for ${this.CUSTOMER_NAME}`);

    try {
      // Check if collection exists
      console.log(`🔍 Checking if collection "${this.COLLECTION_NAME}" exists...`);
      const collections = await qdrantService.client.getCollections();
      const collection = collections.collections.find(
        col => col.name === this.COLLECTION_NAME
      );
      
      if (!collection) {
        console.log(`⚠️  Collection "${this.COLLECTION_NAME}" does not exist. Creating it...`);
        await qdrantService.createCollection({
          collectionName: this.COLLECTION_NAME,
          vectorSize: ticketCollectionConfig.vectorConfig.size,
          distance: ticketCollectionConfig.vectorConfig.distance
        });
      }

      // Check if tickets already exist for this customer (idempotency check)
      console.log(`🔍 Checking if tickets already exist for customer ${this.CUSTOMER_ID}...`);
      const existingTickets = await qdrantService.client.scroll(this.COLLECTION_NAME, {
        filter: {
          must: [
            {
              key: 'customer_id',
              match: { value: this.CUSTOMER_ID }
            }
          ]
        },
        limit: 1,
        with_payload: true,
        with_vector: false
      });

      if (existingTickets.points && existingTickets.points.length > 0) {
        console.log(`✅ Tickets already exist for customer ${this.CUSTOMER_ID}. Migration already completed.`);
        result.success = true;
        result.processedRecords = 0;
        result.totalRecords = 0;
        return result;
      }

      console.log(`📝 No existing tickets found for customer ${this.CUSTOMER_ID}. Proceeding with ticket creation...`);

      // Process tickets in batches
      const batchSize = 10;
      let totalInserted = 0;
      for (let i = 0; i < this.AWS_TICKETS.length; i += batchSize) {
        const batch = this.AWS_TICKETS.slice(i, i + batchSize);
        console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(this.AWS_TICKETS.length / batchSize)} (${batch.length} tickets)`);
        
        const insertedCount = await this.processBatch(batch, qdrantService);
        totalInserted += insertedCount;
      }
      
      result.processedRecords = totalInserted;

      result.success = true;
      console.log(`✅ Successfully created ${result.processedRecords || 0} tickets for ${this.CUSTOMER_NAME}`);
      
    } catch (error: any) {
      console.error(`❌ Migration failed:`, error);
      result.errors.push(error.message);
    }

    return result;
  }

  private async processBatch(tickets: any[], qdrantService: QdrantService): Promise<number> {
    const qdrantPoints: QdrantTicketPoint[] = [];
    let processedCount = 0;
    let errorCount = 0;
    
    for (const ticketData of tickets) {
      try {
        // Generate unique ticket ID
        const ticketId = `AWS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create ticket payload for analysis
        const ticketPayload = {
          subject: ticketData.subject,
          description: ticketData.description,
        };

        // Analyze sentiment
        const sentimentResult = analyzeSentiment(ticketPayload.subject + ' ' + ticketPayload.description);

        // Generate SBERT embedding
        const [sbertEmbedding] = await getSBERTEmbedding([ticketPayload]);

        // Generate Qdrant point ID
        const qdrantPointId = uuidv5(ticketId, QDRANT_POINT_NAMESPACE);

        // Create Qdrant point
        const qdrantPoint: QdrantTicketPoint = {
          id: qdrantPointId,
          vector: sbertEmbedding,
          payload: {
            ticket_id: ticketId,
            organization: this.ORGANIZATION_ID,
            customer_id: this.CUSTOMER_ID,
            sentiment_score: sentimentResult.score,
            sentiment: sentimentResult.sentiment,
            created_at: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Random time within last 30 days
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ticketData.tags,
            intent: this.generateIntent(ticketData.subject, ticketData.description),
            user_agent: this.getRandomUserAgent(),
            resolution_time_ms: this.generateResolutionTime(ticketData.priority),
            resolved_at: ticketData.status === 'closed' || ticketData.status === 'solved' 
              ? Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 
              : undefined,
            long_resolution_predicted: Math.random() > 0.7, // 30% chance of long resolution
            prediction_confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
            prediction_added_at: Date.now() - Math.random() * 24 * 60 * 60 * 1000 // Within last 24 hours
          }
        };

        qdrantPoints.push(qdrantPoint);
        processedCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error processing ticket "${ticketData.subject}":`, error);
      }
    }

    console.log(`📊 Batch processing: ${processedCount} successful, ${errorCount} failed`);

    // Insert batch into Qdrant
    if (qdrantPoints.length > 0) {
      try {
        await qdrantService.client.upsert(this.COLLECTION_NAME, {
          wait: true,
          points: qdrantPoints
        });
        console.log(`✅ Inserted ${qdrantPoints.length} tickets into Qdrant`);
      } catch (error) {
        console.error(`Error inserting batch:`, error);
        throw error;
      }
    } else {
      console.log(`⚠️ No tickets to insert in this batch`);
    }
    
    return qdrantPoints.length;
  }

  private generateIntent(subject: string, description: string): string {
    const text = (subject + ' ' + description).toLowerCase();
    
    if (text.includes('api') && text.includes('log')) return 'api-logs';
    if (text.includes('consultant') && text.includes('hour')) return 'consultant-hours';
    if (text.includes('threat') && text.includes('monitor')) return 'threat-monitoring';
    if (text.includes('onboard') && text.includes('support')) return 'onboarding-support';
    if (text.includes('compliance') && text.includes('report')) return 'compliance-reporting';
    if (text.includes('security')) return 'security';
    if (text.includes('billing') || text.includes('cost')) return 'billing';
    if (text.includes('performance') || text.includes('slow')) return 'performance';
    if (text.includes('integration')) return 'integration';
    if (text.includes('access') || text.includes('permission')) return 'access-management';
    
    return 'general-support';
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.60 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.120 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.86 Safari/537.36'
    ];
    
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  private generateResolutionTime(priority: string): number {
    const baseTime = {
      'urgent': 2 * 60 * 60 * 1000, // 2 hours
      'high': 8 * 60 * 60 * 1000,   // 8 hours
      'medium': 24 * 60 * 60 * 1000, // 24 hours
      'low': 72 * 60 * 60 * 1000    // 72 hours
    };
    
    const base = baseTime[priority as keyof typeof baseTime] || baseTime.medium;
    return base + Math.random() * base; // Add some variance
  }
}

export default AddAmazonWebServicesTicketsMigration;
