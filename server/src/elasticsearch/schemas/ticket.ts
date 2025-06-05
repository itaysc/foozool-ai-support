const mapping = {
  properties: {
    ticket_id: { type: 'keyword' },
    subject: {
      type: 'text',
      analyzer: 'standard',
      fields: {
        keyword: { 
          type: 'keyword', 
          ignore_above: 256,
        },
        autocomplete: {
          type: 'search_as_you_type',
        },
      },
    },
    organization: { type: 'keyword' },
    sentiment_score: { type: 'float' },
    sentiment: { type: 'keyword' },
    embedding: { type: 'dense_vector', dims: 768, similarity: 'cosine', index: true },  // For Sentence-SBERT embeddings
    // embedding: { type: 'dense_vector', dims: 384, similarity: 'cosine', index: true },  // For Sentence-SBERT embeddings
    description: {
      type: 'text',
      analyzer: 'standard',
      fields: {
        keyword: { 
          type: 'keyword', 
          ignore_above: 256,
        },
      },
    },
    customer_id: { type: 'text' },
    created_at: { type: 'date' },
  },
};

const settings = {
  analysis: {
    filter: {
      autocomplete_filter: {
        type: 'edge_ngram',
        min_gram: 3,
        max_gram: 20,
        token_chars: ['letter', 'digit', 'punctuation', 'whitespace'],
      },
      shingle_filter: {
        type: 'shingle',
        min_shingle_size: 2,
        max_shingle_size: 3,
        output_unigrams: true,
      },
    },
    analyzer: {
      custom_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'shingle_filter', 'asciifolding'],
      },
      autocomplete_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'autocomplete_filter'],
      },
    },
  },
};

export {
  mapping,
  settings,
};
