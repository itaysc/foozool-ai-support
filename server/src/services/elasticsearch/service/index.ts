/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client as ESClient, ClientOptions } from '@elastic/elasticsearch';
import Config from '../../../config'
import { WriteResponseBase } from '@elastic/elasticsearch/lib/api/types';
import { ITicket, IESTicket } from '@common/types';

type CreateIndexStatus = 'created' | 'alreadyExist' | 'error';
const isProd = Config.ELASTIC_SEARCH_ENV === 'prod';
const connectionObj: ClientOptions = {
    node: isProd
    ? `https://${Config.BONSAI_ES_ACCESS_KEY}:${Config.BONSAI_ES_ACCESS_SECRET}@${Config.BONSAI_ES_URL}`
    : Config.ELASTIC_SEARCH_URL_LOCAL_DOCKER,
};


if (isProd) {
    connectionObj.tls = {
        rejectUnauthorized: false, // Ensure SSL certificates are accepted (depending on Bonsai setup)
    };
}


export const esClient = new ESClient(connectionObj);
class ElasticsearchService {
  client: ESClient;
  constructor() {
   this.client = esClient;
  }
  async search(conf: any) {
      return this.client.search(conf);
  }
  async createIndex({ indexName, mapping, settings }: { indexName: string; mapping: any; settings: object }): Promise<CreateIndexStatus> {
    try {
      const response = await this.client.indices.create({
        index: indexName,
        body: {
          settings,
          mappings: { properties: mapping.properties },
        },
      });
      console.log(`Index "${indexName}" created.`, response);
      return 'created';
    } catch (error: any) {
      if (error.meta.statusCode === 400 && error.message.includes('resource_already_exists_exception')) {
        console.log(`Index "${indexName}" already exists.`);
        return 'alreadyExist';
      }
      console.error(`An error occurred while creating index "${indexName}":`, error);
      return 'error';
    }
  }

  async bulkInsert({ index, data }: { index: string; data: any[] }): Promise<void> {
    try {
      const body = data.flatMap((d) => [{ index: { _index: index } }, d]);
      const bulkResponse = await this.client!.bulk({ refresh: true, body });
      if (bulkResponse.errors) {
        console.log(`Error in bulkInsert to index: ${index}`);
      } else {
        console.log(`bulkInsert added: ${bulkResponse.items.length} documents to index: ${index}`);
      }
    } catch (error) {
      console.error('Error in bulkInsert to Elasticsearch:', error);
    }
  }

  async moreLikeThis({ index, text, fields, minTermFreq = 2, maxTermFreq = 100, minDocFreq = 1 }: { index: string; text: string; fields: string[]; minTermFreq?: number; maxTermFreq?: number; minDocFreq?: number }): Promise<any> {
    try {
      const response = await this.client!.search({
        index,
        body: {
          query: {
            more_like_this: {
              fields,
              like: [text],
              min_term_freq: minTermFreq,
              max_query_terms: maxTermFreq,
              min_doc_freq: minDocFreq,
              analyzer: 'autocomplete_analyzer',
            },
          },
        },
      });
      return response;
    } catch (error) {
      console.error('Error searching for suggestions:', error);
    }
  }

  async fuzzySearch({ index, term, size = 5, minScore = 1, fuzziness = 'AUTO', fields, organizationId }: { index: string; term: string; fields: string[]; organizationId: string; size?: number; minScore?: number; fuzziness?: number | string }): Promise<any> {
    try {
      const response = await this.client.search({
        index,
        body: {
          size,
          query: {
            bool: {
              must: [
                { multi_match: { query: term, fields, fuzziness } },
                { term: { organizationId } },
              ],
            },
          },
          min_score: minScore,
        },
      });
      return response.hits.hits.map((hit: any) => ({ ...hit._source, score: hit._score }));
    } catch (error) {
      console.error('fuzzySearch - Error searching for suggestions:', error);
    }
  }

  async addToIndex({ index, data }: { index: string; data: any }): Promise<WriteResponseBase | null> {
    try {
      const response = await this.client.index({ index, body: data });
      console.log('addToIndex - added new document to ES index:', index);
      return response;
    } catch (error) {
      console.error(`addToIndex - Error adding document to Elasticsearch index: ${index}`, error);
      return null;
    }
  }

  async updateDocument({ index, id, data }: { index: string; id: string; data: any }): Promise<WriteResponseBase | null> {
    try {
      const response = await this.client.update({ index, id, body: { doc: data } });
      console.log('updateDocument - updated document in ES index:', index);
      return response;
    } catch (error) {
      console.error(`updateDocument - Error updating document in Elasticsearch index: ${index}`, error);
      return null;
    }
  }

  async updateDocumentByField({ index, fieldName, fieldValue, data }: { index: string; fieldName: string; fieldValue: any; data: any }): Promise<WriteResponseBase | null> {
    try {
      const searchResponse = await this.client.search({
        index,
        body: { query: { match: { [fieldName]: fieldValue } } },
      });
      const hits = searchResponse.hits?.hits;
      const totalHits = searchResponse.hits?.total;
      const totalValue = typeof totalHits === 'object' ? totalHits.value : totalHits;
      if (totalValue && totalValue > 0 && hits && hits.length > 0) {
        const docId = hits[0]._id;
        const updateResponse = await this.client.update({ index, id: docId || '', body: { doc: data } });
        console.log(`updateDocumentByField - updated document in index: ${index} where ${fieldName} = ${fieldValue}`);
        return updateResponse;
      } else {
        console.log(`updateDocumentByField - No document found in index: ${index} where ${fieldName} = ${fieldValue}`);
        return null;
      }
    } catch (error) {
      console.error(`updateDocumentByField - Error updating document in Elasticsearch index: ${index}`, error);
      return null;
    }
  }

  async knnSearch({ ticket, k = 5, useBM25 = false } : { ticket: ITicket & { embedding: number[] }, k: number, useBM25: boolean }) :Promise<IESTicket[]> {
    const esClient = new ElasticsearchService();
    if (!esClient) return [];
  
    const knnQuery = {
      field: 'embedding',
      query_vector: ticket.embedding,
      k,
      num_candidates: 200,
    };
    
    const query: any = {
      index: 'tickets',
      knn: knnQuery,
      size: k,
    }
    if (useBM25) {
      query.query = {
        bool: {
          should: [
            { match: { description: { query: ticket.description, boost: 0.5 } } }
          ],
          minimum_should_match: 1,
        },
      };
    }
    try {
      const response = await esClient.search(query);
      return response.hits.hits.map(hit => hit._source as IESTicket);
    } catch (error) {
      console.error('Elasticsearch search error:', error);
      return [];
    }
  }
}

export default ElasticsearchService;

