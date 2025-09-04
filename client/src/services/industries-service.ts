import axios from '@/services/axios';
import config from '@/config';

export interface IndustryDto {
  name: string;
  organizationId?: string | null;
}

export async function fetchIndustries(): Promise<string[]> {
  const url = `${config.apiUrl}/industries`;
  const { data } = await axios.get(url);
  const list: IndustryDto[] = data?.industries || [];
  const names = list.map(i => i.name);
  return names;
}


