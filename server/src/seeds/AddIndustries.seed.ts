import { IndustryModel } from '../schemas';
import { SeedTrackModel } from '../schemas';

export default async function AddIndustriesSeed() {
  const alreadySeeded = await SeedTrackModel.findOne({ name: 'industries', status: 'success' });
  if (alreadySeeded) {
    return;
  }
  const industries = [
    'Technology','Healthcare','Finance','Education','Manufacturing','Retail','Real Estate','Transportation','Energy',
    'Media & Entertainment','Consulting','Legal','Insurance','Telecommunications','Aerospace & Defense','Automotive',
    'Food & Beverage','Pharmaceuticals','Construction','Hospitality & Tourism','Non-profit','Government','Agriculture',
    'Mining','Banking','Investment Management','Accounting','Marketing & Advertising','Human Resources','Logistics & Supply Chain',
    'Biotechnology','Chemical','Electronics','Textiles & Apparel','Utilities','Oil & Gas','Renewable Energy','Environmental Services',
    'Security','Software Development','E-commerce','Fitness & Wellness','Publishing','Broadcasting','Gaming','Architecture & Design',
    'Engineering','Research & Development','Veterinary Services'
  ];

  for (const name of industries) {
    await IndustryModel.updateOne({ name, organizationId: null }, { $setOnInsert: { name, organizationId: null } }, { upsert: true });
  }
  await SeedTrackModel.create({ name: 'industries', date: new Date(), status: 'success' });
}


