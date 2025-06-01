import vader from 'vader-sentiment';

type Sentiment = 'positive' | 'negative' | 'neutral';

interface SentimentResult {
  sentiment: Sentiment;
  score: number;
}

export const analyzeSentiment = (text: string): SentimentResult => {
  const analysis = vader.SentimentIntensityAnalyzer.polarity_scores(text);

  return {
    sentiment:
      analysis.compound > 0.05 ? 'positive' :
      analysis.compound < -0.05 ? 'negative' :
      'neutral',
    score: analysis.compound
  };
};
