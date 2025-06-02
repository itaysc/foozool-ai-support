import {QdrantClient} from '@qdrant/js-client-rest';
import config from '../config';
// TO connect to Qdrant running locally
// const client = new QdrantClient({url: 'http://127.0.0.1:6333'});

// or connect to Qdrant Cloud
const client = new QdrantClient({
    url: config.QDRANT_API_URL,
    apiKey: config.QDRANT_API_KEY,
});

export default client;