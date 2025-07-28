import { createClient, RedisClientType } from 'redis';
import config from '../../config';

const client: RedisClientType = createClient({ url: config.REDIS_CONNECTION_STRING || 'redis://localhost:6380' });

client.on('error', (err: Error) => {
  console.error('❌ Redis Client Error:', err);
});

let isConnected = false;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
    console.log('✅ Redis connected');
  }
  return client;
}
