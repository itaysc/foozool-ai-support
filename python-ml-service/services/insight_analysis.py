import re
import numpy as np
from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
import spacy

# Load spaCy model for NLP
try:
    nlp = spacy.load("en_core_web_sm")
except IOError:
    print("spaCy model 'en_core_web_sm' not found. Please install it with: python -m spacy download en_core_web_sm")
    nlp = None

class InsightAnalyzer:
    def __init__(self, industry_type: str = "general"):
        self.industry_type = industry_type
        self.tfidf = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 3),
            min_df=2
        )
        
        # Industry-specific patterns
        self.patterns = self._get_industry_patterns(industry_type)
        
    def _get_industry_patterns(self, industry_type: str) -> Dict[str, List[str]]:
        """Get complaint patterns based on industry type"""
        
        # Base patterns that apply to most industries
        base_patterns = {
            'general_complaints': [
                r'\b(not work|doesn\'t work|broken|error|bug|issue|problem|fail)\b',
                r'\b(slow|slowness|performance|loading|timeout)\b',
                r'\b(confusing|unclear|hard to|difficult|complicated)\b',
                r'\b(missing|can\'t find|where is|how to)\b',
                r'\b(refund|billing|charge|payment|subscription)\b'
            ],
            'quality_indicators': [
                'poor service', 'bad experience', 'disappointed', 'unsatisfied',
                'doesn\'t work', 'not working', 'malfunctioning', 'terrible',
                'defective', 'faulty', 'broken', 'damaged', 'poor quality'
            ],
            'info_gap_indicators': [
                'how to', 'where is', 'can\'t find', 'documentation',
                'instructions', 'help', 'tutorial', 'guide'
            ]
        }
        
        if industry_type == "transportation":
            return {
                'general_complaints': base_patterns['general_complaints'] + [
                    r'\b(late|delayed|early|cancelled|canceled|no show)\b',
                    r'\b(driver|staff|rude|unprofessional|unsafe)\b',
                    r'\b(dirty|unclean|uncomfortable|crowded|noisy)\b',
                    r'\b(route|schedule|timing|frequency)\b',
                    r'\b(booking|reservation|ticket|seat)\b'
                ],
                'quality_indicators': base_patterns['quality_indicators'] + [
                    'always late', 'consistently delayed', 'unreliable service',
                    'poor punctuality', 'cancelled trip', 'missed connection',
                    'rude driver', 'unsafe driving', 'dirty vehicle',
                    'uncomfortable ride', 'overbooked', 'no air conditioning',
                    'overcrowded', 'poor maintenance', 'broken seat'
                ],
                'info_gap_indicators': base_patterns['info_gap_indicators'] + [
                    'schedule', 'timetable', 'route map', 'stops',
                    'booking process', 'cancellation policy', 'refund policy',
                    'departure time', 'arrival time', 'transfer information'
                ]
            }
        
        elif industry_type == "retail":
            return {
                'general_complaints': base_patterns['general_complaints'] + [
                    r'\b(defective|faulty|broken|damaged)\b',
                    r'\b(shipping|delivery|packaging)\b',
                    r'\b(size|fit|color|quality)\b',
                    r'\b(wrong item|missing parts|incomplete)\b'
                ],
                'quality_indicators': base_patterns['quality_indicators'] + [
                    'stopped working', 'fell apart', 'cheap material', 
                    'wrong size', 'not as described', 'poor craftsmanship',
                    'manufacturing defect', 'short lifespan'
                ],
                'info_gap_indicators': base_patterns['info_gap_indicators'] + [
                    'assembly instructions', 'warranty information', 'care instructions',
                    'size guide', 'compatibility', 'return policy'
                ]
            }
        
        elif industry_type == "software":
            return {
                'general_complaints': base_patterns['general_complaints'] + [
                    r'\b(crash|freeze|hang|stuck|glitch)\b',
                    r'\b(login|authentication|access|permission)\b',
                    r'\b(sync|integration|compatibility)\b'
                ],
                'quality_indicators': base_patterns['quality_indicators'] + [
                    'crashes frequently', 'freezes often', 'buggy software',
                    'poor performance', 'unstable', 'unreliable',
                    'data loss', 'security issues'
                ],
                'info_gap_indicators': base_patterns['info_gap_indicators'] + [
                    'API documentation', 'integration guide', 'setup instructions',
                    'troubleshooting', 'configuration', 'system requirements'
                ]
            }
        
        # Default to general patterns with good physical product support
        return base_patterns

    def analyze_ticket_batch(self, tickets: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze a batch of tickets to identify patterns and insights
        """
        if not tickets:
            return {"insights": [], "confidence": 0.0, "recommendations": []}
        
        insights = []
        
        # Combine all ticket text for analysis
        ticket_texts = [f"{ticket.get('subject', '')} {ticket.get('description', '')}" 
                       for ticket in tickets]
        
        # 1. Detect complaint clusters
        complaint_insights = self._detect_complaint_patterns(tickets, ticket_texts)
        insights.extend(complaint_insights)
        
        # 2. Detect information gaps
        info_gap_insights = self._detect_information_gaps(tickets, ticket_texts)
        insights.extend(info_gap_insights)
        
        # 3. Detect product quality issues
        quality_insights = self._detect_quality_issues(tickets, ticket_texts)
        insights.extend(quality_insights)
        
        # 4. Detect feature requests patterns
        feature_insights = self._detect_feature_requests(tickets, ticket_texts)
        insights.extend(feature_insights)
        
        # Calculate overall confidence
        confidence = self._calculate_confidence(insights, len(tickets))
        
        # Generate recommendations
        recommendations = self._generate_recommendations(insights, tickets)
        
        return {
            "insights": insights,
            "confidence": confidence,
            "recommendations": recommendations
        }

    def _detect_complaint_patterns(self, tickets: List[Dict], texts: List[str]) -> List[Dict]:
        """Detect complaint patterns using keyword analysis and clustering"""
        insights = []
        
        # Find tickets with complaint patterns
        complaint_tickets = []
        for i, text in enumerate(texts):
            text_lower = text.lower()
            complaint_score = 0
            
            for pattern in self.patterns['general_complaints']:
                if re.search(pattern, text_lower):
                    complaint_score += 1
            
            if complaint_score > 0:
                complaint_tickets.append({
                    'index': i,
                    'ticket': tickets[i],
                    'score': complaint_score,
                    'text': text
                })
        
        if len(complaint_tickets) >= 3:  # Need at least 3 similar complaints
            # Extract keywords from complaint tickets
            complaint_texts = [ct['text'] for ct in complaint_tickets]
            keywords = self._extract_common_keywords(complaint_texts)
            
            # Group by product if available
            product_groups = {}
            for ct in complaint_tickets:
                product_id = ct['ticket'].get('productId', 'unknown')
                if product_id not in product_groups:
                    product_groups[product_id] = []
                product_groups[product_id].append(ct)
            
            for product_id, group in product_groups.items():
                if len(group) >= 2:  # At least 2 complaints for same product
                    insights.append({
                        'type': 'complaint_cluster',
                        'title': f'Multiple complaints detected for {self._get_entity_name()} {product_id}',
                        'description': f'Detected {len(group)} complaints with similar patterns',
                        'severity': 'high' if len(group) >= 5 else 'medium',
                        'category': self._get_quality_category(),
                        'confidence': min(0.9, 0.5 + (len(group) * 0.1)),
                        'frequency': len(group),
                        'keywords': keywords[:10],
                        'ticketIds': [ct['ticket'].get('ticketId', '') for ct in group],
                        'productId': product_id if product_id != 'unknown' else None
                    })
        
        return insights

    def _detect_information_gaps(self, tickets: List[Dict], texts: List[str]) -> List[Dict]:
        """Detect patterns indicating missing or unclear information"""
        insights = []
        
        info_gap_tickets = []
        for i, text in enumerate(texts):
            text_lower = text.lower()
            gap_score = 0
            
            for indicator in self.patterns['info_gap_indicators']:
                if indicator in text_lower:
                    gap_score += 1
            
            if gap_score > 0:
                info_gap_tickets.append({
                    'index': i,
                    'ticket': tickets[i],
                    'score': gap_score,
                    'text': text
                })
        
        if len(info_gap_tickets) >= 3:
            # Cluster similar information requests
            gap_texts = [igt['text'] for igt in info_gap_tickets]
            clusters = self._cluster_similar_texts(gap_texts)
            
            for cluster_indices in clusters:
                if len(cluster_indices) >= 2:
                    cluster_tickets = [info_gap_tickets[i] for i in cluster_indices]
                    keywords = self._extract_common_keywords([ct['text'] for ct in cluster_tickets])
                    
                    insights.append({
                        'type': 'information_gap',
                        'title': 'Recurring information requests detected',
                        'description': f'Multiple customers asking for similar information: {", ".join(keywords[:3])}',
                        'severity': 'medium' if len(cluster_tickets) >= 4 else 'low',
                        'category': 'documentation',
                        'confidence': 0.7 + (len(cluster_tickets) * 0.05),
                        'frequency': len(cluster_tickets),
                        'keywords': keywords[:10],
                        'ticketIds': [ct['ticket'].get('ticketId', '') for ct in cluster_tickets]
                    })
        
        return insights

    def _detect_quality_issues(self, tickets: List[Dict], texts: List[str]) -> List[Dict]:
        """Detect product quality issues"""
        insights = []
        
        quality_issue_tickets = []
        for i, text in enumerate(texts):
            text_lower = text.lower()
            quality_score = 0
            
            for indicator in self.patterns['quality_indicators']:
                if indicator in text_lower:
                    quality_score += 1
            
            if quality_score > 0:
                quality_issue_tickets.append({
                    'index': i,
                    'ticket': tickets[i],
                    'score': quality_score,
                    'text': text
                })
        
        if len(quality_issue_tickets) >= 2:
            # Group by product
            product_groups = {}
            for qit in quality_issue_tickets:
                product_id = qit['ticket'].get('productId', 'unknown')
                if product_id not in product_groups:
                    product_groups[product_id] = []
                product_groups[product_id].append(qit)
            
            for product_id, group in product_groups.items():
                if len(group) >= 2:
                    keywords = self._extract_common_keywords([qt['text'] for qt in group])
                    
                    severity = 'critical' if len(group) >= 5 else 'high' if len(group) >= 3 else 'medium'
                    
                    insights.append({
                        'type': 'quality_issue',
                        'title': f'Quality/service issues detected for {self._get_entity_name()} {product_id}',
                        'description': f'Multiple reports of {self._get_quality_issue_description()} problems',
                        'severity': severity,
                        'category': self._get_quality_category(),
                        'confidence': 0.8 + (len(group) * 0.03),
                        'frequency': len(group),
                        'keywords': keywords[:10],
                        'ticketIds': [qt['ticket'].get('ticketId', '') for qt in group],
                        'productId': product_id if product_id != 'unknown' else None
                    })
        
        return insights

    def _detect_feature_requests(self, tickets: List[Dict], texts: List[str]) -> List[Dict]:
        """Detect feature request patterns"""
        insights = []
        
        feature_patterns = [
            r'\b(feature|add|include|support|implement|would like|wish|hope)\b',
            r'\b(can you|could you|please add|please include)\b',
            r'\b(enhancement|improvement|suggestion)\b'
        ]
        
        feature_tickets = []
        for i, text in enumerate(texts):
            text_lower = text.lower()
            feature_score = 0
            
            for pattern in feature_patterns:
                if re.search(pattern, text_lower):
                    feature_score += 1
            
            if feature_score > 0:
                feature_tickets.append({
                    'index': i,
                    'ticket': tickets[i],
                    'score': feature_score,
                    'text': text
                })
        
        if len(feature_tickets) >= 2:
            # Cluster similar feature requests
            feature_texts = [ft['text'] for ft in feature_tickets]
            clusters = self._cluster_similar_texts(feature_texts)
            
            for cluster_indices in clusters:
                if len(cluster_indices) >= 2:
                    cluster_tickets = [feature_tickets[i] for i in cluster_indices]
                    keywords = self._extract_common_keywords([ct['text'] for ct in cluster_tickets])
                    
                    insights.append({
                        'type': 'feature_request',
                        'title': 'Common feature request pattern detected',
                        'description': f'Multiple customers requesting similar features: {", ".join(keywords[:3])}',
                        'severity': 'medium' if len(cluster_tickets) >= 4 else 'low',
                        'category': 'feature_requests',
                        'confidence': 0.6 + (len(cluster_tickets) * 0.08),
                        'frequency': len(cluster_tickets),
                        'keywords': keywords[:10],
                        'ticketIds': [ct['ticket'].get('ticketId', '') for ct in cluster_tickets]
                    })
        
        return insights

    def _extract_common_keywords(self, texts: List[str]) -> List[str]:
        """Extract common keywords from a list of texts"""
        if not texts:
            return []
        
        try:
            # Use TF-IDF to find important terms
            tfidf_matrix = self.tfidf.fit_transform(texts)
            feature_names = self.tfidf.get_feature_names_out()
            
            # Get average TF-IDF scores
            mean_scores = np.mean(tfidf_matrix.toarray(), axis=0)
            
            # Get top keywords
            top_indices = mean_scores.argsort()[-20:][::-1]
            keywords = [feature_names[i] for i in top_indices if mean_scores[i] > 0.1]
            
            return keywords[:15]
        except:
            # Fallback to simple word frequency
            all_words = ' '.join(texts).lower().split()
            word_freq = Counter(all_words)
            return [word for word, freq in word_freq.most_common(15) if len(word) > 3]

    def _cluster_similar_texts(self, texts: List[str]) -> List[List[int]]:
        """Cluster similar texts using TF-IDF and cosine similarity"""
        if len(texts) < 2:
            return []
        
        try:
            # Create TF-IDF matrix
            tfidf_matrix = self.tfidf.fit_transform(texts)
            
            # Calculate cosine similarity
            similarity_matrix = cosine_similarity(tfidf_matrix)
            
            # Use DBSCAN for clustering
            dbscan = DBSCAN(metric='precomputed', eps=0.3, min_samples=2)
            distance_matrix = 1 - similarity_matrix
            clusters = dbscan.fit_predict(distance_matrix)
            
            # Group indices by cluster
            cluster_groups = {}
            for i, cluster_id in enumerate(clusters):
                if cluster_id != -1:  # -1 is noise in DBSCAN
                    if cluster_id not in cluster_groups:
                        cluster_groups[cluster_id] = []
                    cluster_groups[cluster_id].append(i)
            
            return list(cluster_groups.values())
        except:
            return []

    def _calculate_confidence(self, insights: List[Dict], total_tickets: int) -> float:
        """Calculate overall confidence score for the analysis"""
        if not insights:
            return 0.0
        
        # Factor in number of insights found and total tickets
        insight_confidence = np.mean([insight.get('confidence', 0.5) for insight in insights])
        volume_factor = min(1.0, total_tickets / 10)  # Higher confidence with more tickets
        
        return min(0.95, insight_confidence * volume_factor)

    def _generate_recommendations(self, insights: List[Dict], tickets: List[Dict]) -> List[str]:
        """Generate actionable recommendations based on insights"""
        recommendations = []
        
        insight_types = [insight['type'] for insight in insights]
        type_counts = Counter(insight_types)
        
        entity_name = self._get_entity_name().split('/')[0]  # Get first part (product, service, application)
        
        if 'complaint_cluster' in type_counts:
            if self.industry_type == "transportation":
                recommendations.append("Review service delivery and operational processes, consider reaching out to affected passengers")
            else:
                recommendations.append(f"Investigate {entity_name} issues and consider reaching out to affected customers")
        
        if 'information_gap' in type_counts:
            if self.industry_type == "transportation":
                recommendations.append("Update travel information, schedules, and create FAQ entries for common passenger questions")
            else:
                recommendations.append("Update documentation and create FAQ entries for common questions")
        
        if 'feature_request' in type_counts:
            if self.industry_type == "transportation":
                recommendations.append("Review service improvement requests and consider adding to operational roadmap")
            else:
                recommendations.append("Review feature requests and consider adding to product roadmap")
        
        if 'quality_issue' in type_counts:
            if self.industry_type == "transportation":
                recommendations.append("Prioritize operational improvements for service issues affecting multiple passengers")
            else:
                recommendations.append(f"Prioritize {entity_name} improvements for issues affecting multiple customers")
        
        # High severity insights need immediate attention
        high_severity_count = len([i for i in insights if i.get('severity') in ['high', 'critical']])
        if high_severity_count > 0:
            recommendations.append(f"Immediate attention required: {high_severity_count} high/critical severity insights detected")
        
        return recommendations

    def _get_entity_name(self) -> str:
        """Get the appropriate entity name based on industry type"""
        if self.industry_type == "transportation":
            return "service/route"
        elif self.industry_type == "software":
            return "application/feature"
        else:
            return "product/service"
    
    def _get_quality_category(self) -> str:
        """Get the appropriate quality category based on industry type"""
        if self.industry_type == "transportation":
            return "service_quality"
        elif self.industry_type == "software":
            return "software_quality"
        else:
            return "product_quality"
    
    def _get_quality_issue_description(self) -> str:
        """Get appropriate quality issue description based on industry type"""
        if self.industry_type == "transportation":
            return "service delivery/operational"
        elif self.industry_type == "software":
            return "functionality/performance"
        else:
            return "quality/functionality"

# Global analyzer instance (default to general)
default_analyzer = InsightAnalyzer()

def analyze_tickets_for_insights(tickets_data: List[Dict[str, Any]], industry_type: str = "general") -> Dict[str, Any]:
    """
    Main function to analyze tickets and return insights
    
    Args:
        tickets_data: List of ticket dictionaries
        industry_type: Industry type ("general", "transportation", "retail", "software")
    """
    if industry_type == "general":
        # Use default analyzer for backward compatibility
        return default_analyzer.analyze_ticket_batch(tickets_data)
    else:
        # Create industry-specific analyzer
        analyzer = InsightAnalyzer(industry_type)
        return analyzer.analyze_ticket_batch(tickets_data) 