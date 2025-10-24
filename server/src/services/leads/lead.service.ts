import { Lead, ILead } from '../../schemas/lead.schema';
import { CreateLeadRequest } from '../../routes/leads/v1/validation';

export class LeadService {
  /**
   * Create a new lead
   */
  async createLead(leadData: CreateLeadRequest): Promise<ILead> {
    try {
      // Check if lead with this email already exists
      const existingLead = await Lead.findOne({ email: leadData.email });
      
      if (existingLead) {
        throw new Error('Lead with this email already exists');
      }

      // Create new lead
      const lead = new Lead({
        ...leadData,
        source: 'landing-page',
        status: 'new'
      });

      await lead.save();
      
      console.log(`New lead created: ${lead.email}`);
      
      return lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  /**
   * Get all leads with pagination
   */
  async getLeads(page: number = 1, limit: number = 10, status?: string) {
    try {
      const skip = (page - 1) * limit;
      const filter = status ? { status } : {};

      const [leads, total] = await Promise.all([
        Lead.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        Lead.countDocuments(filter)
      ]);

      return {
        leads,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  /**
   * Get lead by ID
   */
  async getLeadById(id: string): Promise<ILead | null> {
    try {
      return await Lead.findById(id);
    } catch (error) {
      console.error('Error fetching lead by ID:', error);
      throw error;
    }
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(id: string, status: string): Promise<ILead | null> {
    try {
      const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'closed'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      return await Lead.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating lead status:', error);
      throw error;
    }
  }

  /**
   * Delete lead
   */
  async deleteLead(id: string): Promise<boolean> {
    try {
      const result = await Lead.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }

  /**
   * Get lead statistics
   */
  async getLeadStats() {
    try {
      const stats = await Lead.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalLeads = await Lead.countDocuments();
      const newLeads = await Lead.countDocuments({ status: 'new' });

      return {
        total: totalLeads,
        new: newLeads,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Error fetching lead stats:', error);
      throw error;
    }
  }
}
