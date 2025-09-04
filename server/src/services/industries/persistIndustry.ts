import { IndustryModel } from '@/schemas/industry.schema';

/**
 * Ensures an industry with the provided name exists either globally or for the given organization.
 * If not found, creates an org-scoped industry.
 */
export async function persistIndustry(organizationId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;

  const existing = await IndustryModel.findOne({
    $or: [{ name: trimmed, organizationId: null }, { name: trimmed, organizationId }],
  }).lean();

  if (!existing) {
    await IndustryModel.create({ name: trimmed, organizationId });
  }
}


