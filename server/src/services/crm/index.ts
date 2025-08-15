import { ICRM } from '../../types/crm';
import { CRMModel } from '../../schemas/crm.schema';
import { OrganizationModel } from '../../schemas/organization.schema';

export class CRMService {
  /**
   * Get all supported CRMs
   */
  static async getAllCRMs(): Promise<ICRM[]> {
    try {
      return await CRMModel.find({ isActive: true }).lean();
    } catch (error) {
      console.error('Error fetching CRMs:', error);
      throw error;
    }
  }

  /**
   * Get CRM by type
   */
  static async getCRMByType(type: string): Promise<ICRM | null> {
    try {
      return await CRMModel.findOne({ type, isActive: true }).lean();
    } catch (error) {
      console.error(`Error fetching CRM by type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get CRM by ID
   */
  static async getCRMById(id: string): Promise<ICRM | null> {
    try {
      return await CRMModel.findById(id).lean();
    } catch (error) {
      console.error(`Error fetching CRM by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new CRM
   */
  static async createCRM(crmData: Omit<ICRM, '_id' | 'createdAt' | 'updatedAt'>): Promise<ICRM> {
    try {
      const crm = new CRMModel(crmData);
      return await crm.save();
    } catch (error) {
      console.error('Error creating CRM:', error);
      throw error;
    }
  }

  /**
   * Update CRM
   */
  static async updateCRM(id: string, updateData: Partial<ICRM>): Promise<ICRM | null> {
    try {
      return await CRMModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
    } catch (error) {
      console.error(`Error updating CRM ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete CRM
   */
  static async deleteCRM(id: string): Promise<boolean> {
    try {
      const result = await CRMModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error(`Error deleting CRM ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get organization's CRM configuration directly from organization schema
   */
  static async getOrganizationCRM(organizationId: string): Promise<{ crm: ICRM; config: Record<string, any> } | null> {
    try {
      const organization = await OrganizationModel.findById(organizationId).lean();
      if (!organization || !organization.crmType) {
        return null;
      }

      const crm = await this.getCRMByType(organization.crmType);
      if (!crm) {
        return null;
      }

      return { 
        crm, 
        config: organization.crmConfig || {} 
      };
    } catch (error) {
      console.error(`Error getting organization CRM for ${organizationId}:`, error);
      return null;
    }
  }

  /**
   * Set organization's CRM configuration directly in organization schema
   */
  static async setOrganizationCRM(
    organizationId: string,
    crmType: string,
    config: Record<string, any>
  ): Promise<boolean> {
    try {
      // Validate that the CRM type is supported
      const crm = await this.getCRMByType(crmType);
      if (!crm) {
        throw new Error(`CRM type '${crmType}' is not supported`);
      }

      // Update organization with CRM type and configuration
      await OrganizationModel.findByIdAndUpdate(organizationId, {
        crmType,
        crmConfig: config
      });

      return true;
    } catch (error) {
      console.error(`Error setting CRM for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Validate if CRM is supported
   */
  static async isCRMSupported(crmType: string): Promise<boolean> {
    try {
      const crm = await this.getCRMByType(crmType);
      return !!crm;
    } catch (error) {
      console.error(`Error validating CRM support for ${crmType}:`, error);
      return false;
    }
  }

  /**
   * Get all organizations using a specific CRM type
   */
  static async getOrganizationsByCRMType(crmType: string): Promise<string[]> {
    try {
      const organizations = await OrganizationModel.find({ crmType }).select('_id').lean();
      return organizations.map(org => org._id!.toString());
    } catch (error) {
      console.error(`Error getting organizations for CRM type ${crmType}:`, error);
      return [];
    }
  }
}
