import axios from '@/services/axios';
import config from '@/config';

const base = `${config.apiUrl}/solutions`;

export interface SolutionDto { _id: string; name: string; organizationId: string }

export async function getSolutions(): Promise<SolutionDto[]> {
  const { data } = await axios.get(`${base}`);
  return data.solutions || [];
}

export async function upsertSolution(name: string): Promise<SolutionDto> {
  const { data } = await axios.post(`${base}`, { name });
  return data.solution;
}

export default { getSolutions, upsertSolution };


