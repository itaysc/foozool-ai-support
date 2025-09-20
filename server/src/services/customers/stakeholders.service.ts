import { CustomerModel } from '../../schemas/customer.schema';
import { StakeholderData } from '../../types/customer';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

export interface Stakeholder {
  _id?: string;
  name: string;
  title: string;
  department: string;
  role: string;
  stakeholderType: 'primary' | 'secondary' | 'technical' | 'business';
  contact: {
    email: string;
    phone?: string;
    linkedin?: string;
  };
  engagement: {
    level: 'high' | 'medium' | 'low' | 'inactive';
    lastContact?: Date;
    lastLogin?: Date;
    usageRate: number;
  };
  influence: {
    teamSize: number;
    decisionPower: number;
    adoptionInfluence: number;
  };
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StakeholderService {
  /**
   * Get all stakeholders for a customer
   */
  static async getStakeholdersByCustomerId(customerId: string, organizationId: string): Promise<Stakeholder[]> {
    const customer = await CustomerModel.findOne({
      _id: customerId,
      organizationId
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer.stakeholders || [];
  }

  /**
   * Add a new stakeholder to a customer
   */
  static async createStakeholder(customerId: string, organizationId: string, stakeholderData: StakeholderData): Promise<Stakeholder> {
    // Validate required fields
    if (!stakeholderData.name || !stakeholderData.title || !stakeholderData.department || 
        !stakeholderData.role || !stakeholderData.contact?.email) {
      throw new Error('Missing required fields: name, title, department, role, and email are required');
    }

    const customer = await CustomerModel.findOne({
      _id: customerId,
      organizationId
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Add the new stakeholder with proper defaults
    const newStakeholder = {
      ...stakeholderData,
      stakeholderType: stakeholderData.stakeholderType || 'secondary',
      engagement: {
        level: stakeholderData.engagement?.level || 'medium',
        lastContact: stakeholderData.engagement?.lastContact ? new Date(stakeholderData.engagement.lastContact) : undefined,
        lastLogin: stakeholderData.engagement?.lastLogin ? new Date(stakeholderData.engagement.lastLogin) : undefined,
        usageRate: stakeholderData.engagement?.usageRate || 0
      },
      influence: {
        teamSize: stakeholderData.influence?.teamSize || 0,
        decisionPower: stakeholderData.influence?.decisionPower || 5,
        adoptionInfluence: stakeholderData.influence?.adoptionInfluence || 5
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    customer.stakeholders = customer.stakeholders || [];
    customer.stakeholders.push(newStakeholder);
    await customer.save();

    // Return the newly created stakeholder (with _id)
    const createdStakeholder = customer.stakeholders[customer.stakeholders.length - 1];
    return createdStakeholder;
  }

  /**
   * Update a stakeholder
   */
  static async updateStakeholder(
    customerId: string, 
    organizationId: string, 
    stakeholderId: string, 
    updateData: Partial<StakeholderData>
  ): Promise<Stakeholder> {
    const customer = await CustomerModel.findOne({
      _id: customerId,
      organizationId
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const stakeholderIndex = customer.stakeholders?.findIndex(
      s => s._id?.toString() === stakeholderId
    );

    if (stakeholderIndex === -1 || stakeholderIndex === undefined) {
      throw new Error('Stakeholder not found');
    }

    // Update the stakeholder
    const stakeholder = customer.stakeholders![stakeholderIndex];
    Object.assign(stakeholder, updateData, {
      updatedAt: new Date()
    });

    await customer.save();

    return stakeholder;
  }

  /**
   * Delete a stakeholder
   */
  static async deleteStakeholder(customerId: string, organizationId: string, stakeholderId: string): Promise<void> {
    const customer = await CustomerModel.findOne({
      _id: customerId,
      organizationId
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const stakeholderIndex = customer.stakeholders?.findIndex(
      s => s._id?.toString() === stakeholderId
    );

    if (stakeholderIndex === -1 || stakeholderIndex === undefined) {
      throw new Error('Stakeholder not found');
    }

    // Remove the stakeholder
    customer.stakeholders!.splice(stakeholderIndex, 1);
    await customer.save();
  }

  /**
   * Bulk import stakeholders from CSV
   */
  static async bulkImportStakeholders(
    customerId: string, 
    organizationId: string, 
    file: Express.Multer.File
  ): Promise<{ success: number; errors: string[] }> {
    const customer = await CustomerModel.findOne({
      _id: customerId,
      organizationId
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const stakeholders: StakeholderData[] = [];
    const errors: string[] = [];

    // Parse CSV file
    const stream = Readable.from(file.buffer.toString());
    
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row: any) => {
          try {
            // Map CSV columns to stakeholder data
            const stakeholder: StakeholderData = {
              name: row.name?.trim(),
              title: row.title?.trim(),
              department: row.department?.trim(),
              role: row.role?.trim(),
              stakeholderType: row.stakeholderType?.trim() as any || 'secondary',
              contact: {
                email: row.email?.trim(),
                phone: row.phone?.trim(),
                linkedin: row.linkedin?.trim(),
              },
              engagement: {
                level: row.engagementLevel?.trim() as any || 'medium',
                usageRate: row.usageRate ? Number(row.usageRate) : undefined,
              },
              influence: {
                teamSize: row.teamSize ? Number(row.teamSize) : undefined,
                decisionPower: row.decisionPower ? Number(row.decisionPower) : undefined,
                adoptionInfluence: row.adoptionInfluence ? Number(row.adoptionInfluence) : undefined,
              },
              notes: row.notes?.trim(),
            };

            // Validate required fields
            if (!stakeholder.name || !stakeholder.title || !stakeholder.department || 
                !stakeholder.role || !stakeholder.contact.email) {
              errors.push(`Row ${stakeholders.length + 1}: Missing required fields`);
              return;
            }

            stakeholders.push(stakeholder);
          } catch (error) {
            errors.push(`Row ${stakeholders.length + 1}: Invalid data format`);
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    // Add stakeholders to customer
    if (stakeholders.length > 0) {
      customer.stakeholders = customer.stakeholders || [];
      
      const newStakeholders = stakeholders.map(stakeholder => ({
        ...stakeholder,
        stakeholderType: stakeholder.stakeholderType || 'secondary',
        engagement: {
          level: stakeholder.engagement?.level || 'medium',
          lastContact: stakeholder.engagement?.lastContact ? new Date(stakeholder.engagement.lastContact) : undefined,
          lastLogin: stakeholder.engagement?.lastLogin ? new Date(stakeholder.engagement.lastLogin) : undefined,
          usageRate: stakeholder.engagement?.usageRate || 0
        },
        influence: {
          teamSize: stakeholder.influence?.teamSize || 0,
          decisionPower: stakeholder.influence?.decisionPower || 5,
          adoptionInfluence: stakeholder.influence?.adoptionInfluence || 5
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      customer.stakeholders.push(...newStakeholders);
      await customer.save();
    }

    return {
      success: stakeholders.length,
      errors: errors
    };
  }
}
