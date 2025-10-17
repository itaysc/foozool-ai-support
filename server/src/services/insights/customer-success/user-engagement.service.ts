import mongoose from 'mongoose';
import { UserActivityModel } from '../../../schemas/userActivity.schema';
import { CustomerSuccessInsight, EnhancedInsightGuidance } from '../../../types/customerSuccessInsight';

/**
 * Generate user engagement insights based on individual user activity
 */
export async function generateUserEngagementInsights(customerId: mongoose.Types.ObjectId, organizationId: mongoose.Types.ObjectId, customerName: string): Promise<CustomerSuccessInsight[]> {
  const insights: CustomerSuccessInsight[] = [];
  const now = new Date();
  const last30Start = new Date(now);
  last30Start.setDate(now.getDate() - 30);

  try {
    // Get user engagement metrics for the last 30 days
    const userMetrics = await UserActivityModel.aggregate([
      {
        $match: {
          customerId: customerId,
          organizationId: organizationId,
          timestamp: { $gte: last30Start }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalActivities: { $sum: 1 },
          uniqueSolutions: { $addToSet: '$solutionName' },
          uniqueActions: { $addToSet: '$action' },
          lastActivity: { $max: '$timestamp' },
          userRole: { $first: '$userRole' },
          sessionCount: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          userId: '$_id',
          totalActivities: 1,
          solutionCount: { $size: '$uniqueSolutions' },
          actionCount: { $size: '$uniqueActions' },
          lastActivity: 1,
          userRole: 1,
          sessionCount: { $size: '$sessionCount' },
          engagementScore: {
            $add: [
              { $multiply: ['$totalActivities', 0.4] },
              { $multiply: [{ $size: '$uniqueSolutions' }, 0.3] },
              { $multiply: [{ $size: '$uniqueActions' }, 0.3] }
            ]
          }
        }
      },
      { $sort: { engagementScore: -1 } }
    ]);

    if (userMetrics.length === 0) {
      return insights;
    }

    const totalUsers = userMetrics.length;
    const activeUsers = userMetrics.filter(u => u.totalActivities > 0).length;
    const inactiveUsers = totalUsers - activeUsers;
    const avgEngagementScore = userMetrics.reduce((sum, u) => sum + u.engagementScore, 0) / totalUsers;

    // 1. User Adoption Insights
    if (inactiveUsers > 0) {
      const inactivePercentage = (inactiveUsers / totalUsers) * 100;
      if (inactivePercentage > 50) {
        insights.push({
          type: 'user_adoption',
          message: `${inactivePercentage.toFixed(0)}% of users are inactive - focus on user adoption`,
          severity: 'red',
          category: 'customer_success',
          meta: { 
            totalUsers, 
            inactiveUsers, 
            inactivePercentage: inactivePercentage.toFixed(1) 
          }
        });
      } else if (inactivePercentage > 25) {
        insights.push({
          type: 'user_adoption',
          message: `${inactivePercentage.toFixed(0)}% of users are inactive - monitor adoption trends`,
          severity: 'yellow',
          category: 'customer_success',
          meta: { 
            totalUsers, 
            inactiveUsers, 
            inactivePercentage: inactivePercentage.toFixed(1) 
          }
        });
      }
    }

    // 2. Power User Identification
    const powerUsers = userMetrics.filter(u => u.engagementScore > avgEngagementScore * 1.5);
    if (powerUsers.length > 0) {
      insights.push({
        type: 'power_users',
        message: `${powerUsers.length} power users identified - leverage for advocacy and feedback`,
        severity: 'info',
        category: 'customer_success',
        meta: { 
          powerUserCount: powerUsers.length,
          powerUserIds: powerUsers.map(u => u.userId),
          avgEngagementScore: avgEngagementScore.toFixed(1)
        }
      });
    }

    // 3. Solution Adoption Gaps
    const solutionUsage = await UserActivityModel.aggregate([
      {
        $match: {
          customerId: customerId,
          organizationId: organizationId,
          timestamp: { $gte: last30Start }
        }
      },
      {
        $group: {
          _id: '$solutionName',
          userCount: { $addToSet: '$userId' },
          totalActivities: { $sum: 1 }
        }
      },
      {
        $project: {
          solutionName: '$_id',
          userCount: { $size: '$userCount' },
          totalActivities: 1,
          adoptionRate: { $divide: [{ $size: '$userCount' }, totalUsers] }
        }
      }
    ]);

    const lowAdoptionSolutions = solutionUsage.filter(s => s.adoptionRate < 0.3);
    if (lowAdoptionSolutions.length > 0) {
      insights.push({
        type: 'solution_adoption',
        message: `${lowAdoptionSolutions.length} solutions have low adoption (<30%) - focus on training`,
        severity: 'yellow',
        category: 'customer_success',
        meta: { 
          lowAdoptionSolutions: lowAdoptionSolutions.map(s => ({
            solutionName: s.solutionName,
            adoptionRate: (s.adoptionRate * 100).toFixed(1) + '%',
            userCount: s.userCount
          }))
        }
      });
    }

    // 4. User Role Engagement Analysis
    const roleEngagement = userMetrics.reduce((acc, user) => {
      const role = user.userRole || 'unknown';
      if (!acc[role]) {
        acc[role] = { count: 0, totalEngagement: 0, users: [] };
      }
      acc[role].count++;
      acc[role].totalEngagement += user.engagementScore;
      acc[role].users.push(user.userId);
      return acc;
    }, {} as Record<string, { count: number; totalEngagement: number; users: string[] }>);

    Object.entries(roleEngagement).forEach(([role, data]) => {
      const roleData = data as { count: number; totalEngagement: number; users: string[] };
      const avgRoleEngagement = roleData.totalEngagement / roleData.count;
      if (avgRoleEngagement < avgEngagementScore * 0.7) {
        insights.push({
          type: 'role_engagement',
          message: `${role} users have below-average engagement - provide role-specific training`,
          severity: 'yellow',
          category: 'customer_success',
          meta: { 
            role, 
            userCount: roleData.count,
            avgEngagement: avgRoleEngagement.toFixed(1),
            userIds: roleData.users
          }
        });
      }
    });

    // 5. Session Activity Insights
    const sessionMetrics = await UserActivityModel.aggregate([
      {
        $match: {
          customerId: customerId,
          organizationId: organizationId,
          timestamp: { $gte: last30Start },
          sessionId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$sessionId',
          activityCount: { $sum: 1 },
          firstActivity: { $min: '$timestamp' },
          lastActivity: { $max: '$timestamp' },
          userId: { $first: '$userId' }
        }
      },
      {
        $addFields: {
          duration: { $subtract: ['$lastActivity', '$firstActivity'] }
        }
      },
      {
        $group: {
          _id: null,
          avgSessionDuration: { $avg: '$duration' },
          avgActivitiesPerSession: { $avg: '$activityCount' },
          totalSessions: { $sum: 1 }
        }
      }
    ]);

    if (sessionMetrics.length > 0) {
      const sessionData = sessionMetrics[0];
      const avgDurationMinutes = sessionData.avgSessionDuration / (1000 * 60);
      
      if (avgDurationMinutes < 5) {
        insights.push({
          type: 'session_engagement',
          message: `Short session durations (${avgDurationMinutes.toFixed(1)} min avg) - users may need better onboarding`,
          severity: 'yellow',
          category: 'customer_success',
          meta: { 
            avgSessionDurationMinutes: avgDurationMinutes.toFixed(1),
            avgActivitiesPerSession: sessionData.avgActivitiesPerSession.toFixed(1),
            totalSessions: sessionData.totalSessions
          }
        });
      }
    }

    // 6. Activity Trend Decline Analysis
    const trendAnalysis = await UserActivityModel.aggregate([
      {
        $match: {
          customerId: customerId,
          organizationId: organizationId,
          timestamp: { $gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) } // Last 60 days
        }
      },
      {
        $addFields: {
          week: { $week: '$timestamp' },
          year: { $year: '$timestamp' }
        }
      },
      {
        $group: {
          _id: { userId: '$userId', week: '$week', year: '$year' },
          weeklyActivities: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.userId',
          weeklyData: {
            $push: {
              week: '$_id.week',
              year: '$_id.year',
              activities: '$weeklyActivities'
            }
          }
        }
      },
      {
        $addFields: {
          recentWeeks: { $slice: ['$weeklyData', -4] }, // Last 4 weeks
          totalRecentActivities: { $sum: '$weeklyData.activities' }
        }
      }
    ]);

    const decliningUsers = trendAnalysis.filter(user => {
      if (user.recentWeeks.length < 3) return false;
      const sortedWeeks = user.recentWeeks.sort((a, b) => a.week - b.week);
      const firstWeek = sortedWeeks[0].activities;
      const lastWeek = sortedWeeks[sortedWeeks.length - 1].activities;
      return lastWeek < firstWeek * 0.5 && firstWeek > 5; // 50% decline with meaningful activity
    });

    if (decliningUsers.length > 0) {
      insights.push({
        type: 'activity_trend_decline',
        message: `${decliningUsers.length} users showing declining activity trends - risk of churn`,
        severity: 'red',
        category: 'customer_success',
        meta: { 
          decliningUserCount: decliningUsers.length,
          decliningUserIds: decliningUsers.map(u => u._id)
        }
      });
    }

    // 7. Feature Discovery Analysis
    // First, get the actual features this customer has access to
    const availableFeatures = await UserActivityModel.aggregate([
      {
        $match: {
          customerId: customerId,
          organizationId: organizationId,
          timestamp: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
        }
      },
      {
        $group: {
          _id: '$solutionName',
          usageCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          featureName: '$_id',
          usageCount: 1,
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      {
        $sort: { usageCount: -1 }
      },
      {
        $limit: 10 // Top 10 most used features
      }
    ]);

    if (availableFeatures.length === 0) {
      // No feature usage data available
      return insights;
    }

    const keyFeatures = availableFeatures.map(f => f.featureName);
    
    // Now analyze feature discovery for these actual features
    const featureDiscovery = await UserActivityModel.aggregate([
      {
        $match: {
          customerId: customerId,
          organizationId: organizationId,
          timestamp: { $gte: last30Start },
          solutionName: { $in: keyFeatures }
        }
      },
      {
        $group: {
          _id: '$userId',
          discoveredFeatures: { $addToSet: '$solutionName' }
        }
      },
      {
        $project: {
          userId: '$_id',
          discoveredFeatures: 1,
          undiscoveredFeatures: {
            $setDifference: [keyFeatures, '$discoveredFeatures']
          }
        }
      }
    ]);

    const usersWithUndiscoveredFeatures = featureDiscovery.filter(user => 
      user.undiscoveredFeatures.length > 0
    );

    if (usersWithUndiscoveredFeatures.length > 0) {
      const avgUndiscovered = usersWithUndiscoveredFeatures.reduce((sum, user) => 
        sum + user.undiscoveredFeatures.length, 0) / usersWithUndiscoveredFeatures.length;
      
      // Get the most commonly undiscovered features
      const undiscoveredFeatureCounts = {};
      usersWithUndiscoveredFeatures.forEach(user => {
        user.undiscoveredFeatures.forEach(feature => {
          undiscoveredFeatureCounts[feature] = (undiscoveredFeatureCounts[feature] || 0) + 1;
        });
      });
      
      const topUndiscoveredFeatures = Object.entries(undiscoveredFeatureCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([feature]) => feature);
      
      const featureList = topUndiscoveredFeatures.length > 0 
        ? topUndiscoveredFeatures.join(', ') + (topUndiscoveredFeatures.length < keyFeatures.length ? ', and others' : '')
        : 'key features';
      
      insights.push({
        type: 'feature_discovery',
        message: `${usersWithUndiscoveredFeatures.length} users haven't discovered ${featureList} (avg ${avgUndiscovered.toFixed(1)} undiscovered per user)`,
        severity: 'yellow',
        category: 'customer_success',
        meta: { 
          usersWithUndiscoveredFeatures: usersWithUndiscoveredFeatures.length,
          avgUndiscoveredFeatures: avgUndiscovered.toFixed(1),
          keyFeatures,
          topUndiscoveredFeatures,
          undiscoveredFeatureCounts,
          totalAvailableFeatures: keyFeatures.length
        },
        guidance: {
          summary: `${usersWithUndiscoveredFeatures.length} users haven't discovered important features like ${topUndiscoveredFeatures.slice(0, 2).join(' and ')}`,
          whyItMatters: `Low feature discovery indicates users aren't getting full value from your solution. This can lead to reduced satisfaction, lower renewal rates, and missed upsell opportunities.`,
          signals: [
            `${usersWithUndiscoveredFeatures.length} users with undiscovered features`,
            `Average of ${avgUndiscovered.toFixed(1)} undiscovered features per user`,
            `Top undiscovered features: ${topUndiscoveredFeatures.join(', ')}`,
            `${keyFeatures.length} total features available to this customer`
          ],
          recommendedActions: [
            `Create targeted training sessions focusing on ${topUndiscoveredFeatures[0]} and ${topUndiscoveredFeatures[1] || topUndiscoveredFeatures[0]}`,
            'Send personalized feature discovery emails to users with multiple undiscovered features',
            'Implement in-app feature highlights and tooltips for key features',
            'Schedule 1:1 sessions with power users to demonstrate advanced features',
            'Create feature adoption campaigns with success metrics and rewards'
          ],
          investigationPath: [
            'Review user onboarding completion rates and time-to-first-value',
            'Analyze which user roles are most affected by feature discovery gaps',
            'Check if there are technical barriers preventing feature access',
            'Survey users about their awareness of available features'
          ],
          considerations: [
            'Feature complexity may require additional training',
            'Some features may not be relevant to certain user roles',
            'Technical setup or permissions may be blocking access',
            'Users may need more guided discovery paths'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'Feature Discovery Campaign', amount: 5, unit: 'days' }
        },
        evidence: {
          supportingData: {
            totalUsersWithUndiscoveredFeatures: usersWithUndiscoveredFeatures.length,
            averageUndiscoveredFeatures: avgUndiscovered.toFixed(1),
            topUndiscoveredFeatures: topUndiscoveredFeatures,
            totalAvailableFeatures: keyFeatures.length,
            featureDiscoveryRate: `${((keyFeatures.length - avgUndiscovered) / keyFeatures.length * 100).toFixed(1)}%`
          },
          relatedLinks: [
            { title: 'Feature Usage Dashboard', url: `/customers/${customerId}/features` },
            { title: 'User Training Materials', url: `/docs/features/${topUndiscoveredFeatures[0]?.toLowerCase().replace(/\s+/g, '-')}` },
            { title: 'Feature Adoption Best Practices', url: '/docs/feature-adoption' }
          ]
        }
      });
    }

    // 8. Usage Pattern Anomalies
    const anomalyAnalysis = await UserActivityModel.aggregate([
      {
        $match: {
          customerId: customerId,
          organizationId: organizationId,
          timestamp: { $gte: last30Start }
        }
      },
      {
        $addFields: {
          hour: { $hour: '$timestamp' },
          dayOfWeek: { $dayOfWeek: '$timestamp' }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalActivities: { $sum: 1 },
          avgHour: { $avg: '$hour' },
          weekendActivities: {
            $sum: { $cond: [{ $in: ['$dayOfWeek', [1, 7]] }, 1, 0] } // Sunday=1, Saturday=7
          },
          lateNightActivities: {
            $sum: { $cond: [{ $or: [{ $lt: ['$hour', 6] }, { $gt: ['$hour', 22] }] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          weekendRatio: { $divide: ['$weekendActivities', '$totalActivities'] },
          lateNightRatio: { $divide: ['$lateNightActivities', '$totalActivities'] }
        }
      }
    ]);

    const anomalousUsers = anomalyAnalysis.filter(user => 
      user.weekendRatio > 0.3 || user.lateNightRatio > 0.2
    );

    if (anomalousUsers.length > 0) {
      insights.push({
        type: 'usage_pattern_anomaly',
        message: `${anomalousUsers.length} users showing unusual usage patterns - may indicate issues or high engagement`,
        severity: 'info',
        category: 'customer_success',
        meta: { 
          anomalousUserCount: anomalousUsers.length,
          anomalousUserIds: anomalousUsers.map(u => u._id),
          patterns: {
            highWeekendUsage: anomalousUsers.filter(u => u.weekendRatio > 0.3).length,
            highLateNightUsage: anomalousUsers.filter(u => u.lateNightRatio > 0.2).length
          }
        }
      });
    }

  } catch (error) {
    console.error('[CS Insights] ❌ failed to generate user engagement insights:', error);
  }

  return insights;
}
