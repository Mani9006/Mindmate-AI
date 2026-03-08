# MindMate AI - Analytics & ML Pipeline Architecture

## Document Information
- **Version**: 1.0.0
- **Last Updated**: 2024
- **Status**: Production-Ready Documentation
- **Classification**: Technical Architecture

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [User Behavior Tracking System](#1-user-behavior-tracking-system)
3. [Progress Metrics Calculation Engine](#2-progress-metrics-calculation-engine)
4. [Weekly Report Generation Pipeline](#3-weekly-report-generation-pipeline)
5. [A/B Testing Framework](#4-ab-testing-framework)
6. [ML Pipeline for Personalization](#5-ml-pipeline-for-personalization)
7. [Anomaly Detection System](#6-anomaly-detection-system)
8. [Data Governance & Privacy](#data-governance--privacy)
9. [Infrastructure & Deployment](#infrastructure--deployment)
10. [Monitoring & Alerting](#monitoring--alerting)

---

## Executive Summary

This document outlines the complete analytics and machine learning infrastructure for MindMate AI, a privacy-first mental health application. The architecture is designed with the following core principles:

- **Privacy by Design**: All data collection is opt-in, anonymized, and never sold
- **Clinical Relevance**: Metrics align with evidence-based mental health assessment frameworks
- **Real-time Responsiveness**: Critical risk detection operates with sub-minute latency
- **Scalability**: Architecture supports 10M+ users with horizontal scaling
- **Explainability**: All ML decisions can be explained to clinical reviewers

---

## 1. User Behavior Tracking System

### 1.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        USER BEHAVIOR TRACKING SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │   Client SDK │───▶│  Event Queue │───▶│   Stream     │───▶│  Raw Data │  │
│  │  (Privacy-   │    │  (Kafka)     │    │   Processor  │    │   Lake    │  │
│  │   Preserving)│    │              │    │  (Flink)     │    │  (S3)     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘  │
│         │                                              │                      │
│         │                                              ▼                      │
│         │                                       ┌───────────┐                 │
│         │                                       │ Aggregated│                 │
│         │                                       │  Metrics  │                 │
│         │                                       │  Store    │                 │
│         │                                       │(ClickHouse)│                │
│         │                                       └───────────┘                 │
│         │                                              │                      │
│         ▼                                              ▼                      │
│  ┌──────────────┐                              ┌───────────┐                 │
│  │ Local Device │                              │ Analytics │                 │
│  │   Storage    │                              │  Engine   │                 │
│  │ (Encrypted)  │                              │           │                 │
│  └──────────────┘                              └───────────┘                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Event Taxonomy

#### 1.2.1 Core Event Categories

| Category | Events | Sensitivity | Retention |
|----------|--------|-------------|-----------|
| `engagement` | app_open, session_start, session_end, feature_use | Low | 90 days |
| `mood_tracking` | mood_log, mood_score, trigger_log | High | 2 years |
| `challenge_interaction` | challenge_start, challenge_complete, challenge_skip | Medium | 1 year |
| `journal_activity` | journal_entry, journal_edit, journal_delete | Critical | User-controlled |
| `crisis_signals` | crisis_button_pressed, safety_plan_accessed, emergency_contact | Critical | 7 years |
| `therapeutic_progress` | assessment_completed, goal_set, goal_achieved | High | 5 years |

#### 1.2.2 Event Schema (JSON)

```json
{
  "event_id": "uuid-v4",
  "event_type": "mood_log",
  "event_version": "2.1.0",
  "timestamp": "2024-01-15T09:30:00Z",
  "user_context": {
    "user_id": "anon_hash_abc123",
    "session_id": "session_def456",
    "device_id": "device_hash_ghi789",
    "app_version": "3.2.1"
  },
  "event_data": {
    "mood_score": 6,
    "mood_label": "neutral",
    "triggers": ["work_stress"],
    "context": "morning_routine"
  },
  "privacy_metadata": {
    "consent_version": "v2024.01",
    "data_classification": "phi",
    "encryption_level": "aes-256-gcm",
    "retention_policy": "2_years"
  },
  "technical_metadata": {
    "client_timestamp": "2024-01-15T09:29:58Z",
    "timezone": "America/New_York",
    "network_type": "wifi"
  }
}
```

### 1.3 Privacy-Preserving Collection

#### 1.3.1 Client-Side Anonymization

```python
# pseudocode/client_sdk/analytics_collector.py

class PrivacyPreservingAnalyticsCollector:
    """
    Client-side analytics collection with privacy preservation.
    All PII is hashed/encrypted before transmission.
    """
    
    def __init__(self, config: AnalyticsConfig):
        self.config = config
        self.encryption_key = self._derive_key()
        self.consent_manager = ConsentManager()
        
    def track_event(self, event: RawEvent) -> Optional[EncryptedEvent]:
        """Track event with privacy-preserving transformations."""
        
        # Check consent
        if not self.consent_manager.has_consent(event.category):
            return None
            
        # Apply privacy transformations
        anonymized_event = self._anonymize_event(event)
        
        # Add differential privacy noise for sensitive metrics
        if event.category in ['mood_tracking', 'journal_activity']:
            anonymized_event = self._add_differential_privacy(anonymized_event)
            
        # Encrypt sensitive fields
        encrypted_event = self._encrypt_sensitive_fields(anonymized_event)
        
        # Queue for batch transmission
        self._queue_event(encrypted_event)
        
        return encrypted_event
    
    def _anonymize_event(self, event: RawEvent) -> AnonymizedEvent:
        """Remove/Hash all identifying information."""
        return AnonymizedEvent(
            user_id=self._hash_identifier(event.user_id),
            device_id=self._hash_identifier(event.device_id),
            # Location anonymized to city-level
            location=self._anonymize_location(event.location),
            # Remove precise timestamps, keep hour-level
            timestamp=self._bucket_timestamp(event.timestamp, bucket='hour'),
            data=event.data
        )
    
    def _add_differential_privacy(self, event: AnonymizedEvent, epsilon: float = 1.0) -> AnonymizedEvent:
        """Add Laplace noise for differential privacy guarantees."""
        if 'mood_score' in event.data:
            noise = np.random.laplace(0, 1/epsilon)
            event.data['mood_score'] = round(event.data['mood_score'] + noise)
        return event
```

### 1.4 Data Retention Policies

| Data Type | Retention Period | Anonymization | Deletion Trigger |
|-----------|------------------|---------------|------------------|
| Raw event logs | 90 days | After 30 days | Account deletion |
| Aggregated metrics | 2 years | Immediate | Never (anonymized) |
| PHI content | User-controlled | N/A | User request / 7 years |
| Crisis intervention data | 7 years | After 7 years | Legal requirement |
| ML training data | 1 year | Differential privacy | Model retraining |

---

## 2. Progress Metrics Calculation Engine

### 2.1 Metrics Framework

#### 2.1.1 Clinical Metrics (Evidence-Based)

| Metric | Source | Calculation | Clinical Reference |
|--------|--------|-------------|-------------------|
| **PHQ-9 Score** | User assessments | Sum of 9 items (0-27) | Kroenke et al. 2001 |
| **GAD-7 Score** | User assessments | Sum of 7 items (0-21) | Spitzer et al. 2006 |
| **PSS Score** | Perceived Stress Scale | Sum of 10 items (0-40) | Cohen et al. 1983 |
| **WHO-5 Wellbeing** | Wellbeing index | Sum x 4 (0-100) | WHO 1998 |
| **Mood Volatility** | Daily mood logs | Coefficient of variation | Internal metric |
| **Engagement Score** | App usage patterns | Composite metric | Internal metric |

#### 2.1.2 Composite Progress Score

```python
# pseudocode/metrics/progress_calculator.py

class ProgressMetricsCalculator:
    """
    Calculates comprehensive progress metrics for users.
    Combines clinical assessments with behavioral indicators.
    """
    
    def __init__(self, config: MetricsConfig):
        self.weights = config.metric_weights
        self.clinical_thresholds = config.clinical_thresholds
        
    def calculate_progress_score(self, user_id: str, time_window: timedelta = timedelta(days=30)) -> ProgressScore:
        """Calculate comprehensive progress score."""
        
        # Fetch relevant data
        assessments = self._get_assessments(user_id, time_window)
        mood_logs = self._get_mood_logs(user_id, time_window)
        engagement = self._get_engagement_metrics(user_id, time_window)
        
        # Calculate component scores
        clinical_score = self._calculate_clinical_improvement(assessments)
        mood_trend = self._calculate_mood_trend(mood_logs)
        stability_score = self._calculate_stability(mood_logs)
        engagement_score = self._calculate_engagement_quality(engagement)
        
        # Weighted composite
        progress_score = ProgressScore(
            overall_score=self._weighted_average([
                (clinical_score, self.weights['clinical']),
                (mood_trend, self.weights['mood_trend']),
                (stability_score, self.weights['stability']),
                (engagement_score, self.weights['engagement'])
            ]),
            clinical_improvement=clinical_score,
            mood_stability=stability_score,
            engagement_quality=engagement_score,
            trend_direction=self._determine_trend(mood_logs),
            confidence=self._calculate_confidence(mood_logs, assessments),
            calculated_at=datetime.utcnow()
        )
        
        return progress_score
```

### 2.2 Metrics Storage Schema

```sql
-- ClickHouse schema for metrics storage
CREATE TABLE user_progress_metrics (
    user_id FixedString(64),  -- Anonymized hash
    metric_date Date,
    metric_hour UInt8,
    
    -- Clinical metrics
    phq9_score Nullable(UInt8),
    gad7_score Nullable(UInt8),
    pss_score Nullable(UInt8),
    who5_score Nullable(UInt8),
    
    -- Behavioral metrics
    mood_avg Float32,
    mood_std Float32,
    mood_volatility Float32,
    sessions_count UInt16,
    session_duration_avg UInt32,
    challenges_completed UInt16,
    challenges_started UInt16,
    journal_entries UInt16,
    
    -- Composite scores
    overall_progress_score Float32,
    engagement_score Float32,
    stability_score Float32,
    
    -- Metadata
    data_quality_score Float32,
    calculation_version String,
    
    INDEX idx_user_date (user_id, metric_date) TYPE minmax
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(metric_date)
ORDER BY (user_id, metric_date, metric_hour);
```

---

## 3. Weekly Report Generation Pipeline

### 3.1 Report Generation Service

```python
# pseudocode/reports/weekly_report_generator.py

class WeeklyReportGenerator:
    """Generates personalized weekly progress reports for users."""
    
    def __init__(self):
        self.metrics_calculator = ProgressMetricsCalculator()
        self.template_engine = ReportTemplateEngine()
        self.content_adapter = ContentPersonalizationAdapter()
        
    async def generate_report(self, user_id: str, week_start: date) -> WeeklyReport:
        """Generate comprehensive weekly report."""
        
        # Fetch user's week data
        week_data = await self._fetch_week_data(user_id, week_start)
        
        # Calculate metrics
        metrics = self.metrics_calculator.calculate_weekly_metrics(week_data)
        
        # Get historical context
        historical = await self._get_historical_comparison(user_id, week_start)
        
        # Generate insights
        insights = self._generate_insights(metrics, historical)
        
        # Select appropriate template
        template = self.template_engine.select_template(
            user_profile=week_data.user_profile,
            progress_level=metrics.overall_progress,
            engagement_pattern=week_data.engagement
        )
        
        # Personalize content
        personalized_content = self.content_adapter.adapt_content(
            template=template,
            user_profile=week_data.user_profile,
            insights=insights,
            metrics=metrics
        )
        
        # Build report
        report = WeeklyReport(
            user_id=user_id,
            week_start=week_start,
            week_end=week_start + timedelta(days=6),
            summary=personalized_content.summary,
            key_metrics=metrics,
            insights=insights,
            achievements=self._identify_achievements(metrics, historical),
            recommendations=self._generate_recommendations(metrics, week_data),
            next_week_preview=self._generate_preview(week_data),
            generated_at=datetime.utcnow()
        )
        
        return report
```

### 3.2 Report Templates

```python
# pseudocode/reports/templates.py

class ReportTemplateEngine:
    """Manages and selects report templates based on user context."""
    
    TEMPLATES = {
        'new_user': {
            'tone': 'encouraging',
            'focus': 'onboarding',
            'sections': ['welcome', 'getting_started', 'first_steps'],
            'complexity': 'simple'
        },
        'steady_progress': {
            'tone': 'celebratory',
            'focus': 'momentum',
            'sections': ['progress_highlight', 'momentum_builder', 'next_goals'],
            'complexity': 'moderate'
        },
        'needs_support': {
            'tone': 'empathetic',
            'focus': 'support',
            'sections': ['gentle_check_in', 'support_resources', 'small_wins'],
            'complexity': 'simple'
        },
        'high_achiever': {
            'tone': 'motivational',
            'focus': 'growth',
            'sections': ['achievements', 'advanced_challenges', 'community'],
            'complexity': 'advanced'
        },
        'concerning_pattern': {
            'tone': 'caring',
            'focus': 'outreach',
            'sections': ['gentle_outreach', 'resources', 'professional_support'],
            'complexity': 'simple',
            'flags_for_review': True
        }
    }
```

---

## 4. A/B Testing Framework

### 4.1 Experiment Configuration

```python
# pseudocode/ab_testing/experiment_manager.py

@dataclass
class ExperimentConfig:
    """Configuration for an A/B test experiment."""
    
    experiment_id: str
    name: str
    hypothesis: str
    
    # Variants
    variants: List[Variant]
    control_variant_id: str
    
    # Traffic allocation
    traffic_allocation: Dict[str, float]  # variant_id -> percentage
    
    # Targeting
    targeting_criteria: TargetingCriteria
    
    # Metrics
    primary_metric: MetricDefinition
    secondary_metrics: List[MetricDefinition]
    guardrail_metrics: List[MetricDefinition]  # Must not degrade
    
    # Statistical parameters
    min_sample_size: int
    max_sample_size: int
    significance_level: float = 0.05
    power: float = 0.8
    min_detectable_effect: float = 0.05


class ExperimentManager:
    """Manages the lifecycle of A/B test experiments."""
    
    def __init__(self, storage: ExperimentStorage, stats_engine: StatsEngine):
        self.storage = storage
        self.stats_engine = stats_engine
        self.assignment_cache = {}
        
    def get_variant_for_user(self, experiment_id: str, user_id: str,
                            user_context: UserContext) -> Variant:
        """Deterministically assign user to variant."""
        
        # Check cache
        cache_key = f"{experiment_id}:{user_id}"
        if cache_key in self.assignment_cache:
            return self.assignment_cache[cache_key]
        
        # Get experiment
        experiment = self.storage.get_experiment(experiment_id)
        
        # Check eligibility
        if not self._is_user_eligible(experiment, user_context):
            return None
        
        # Deterministic assignment using hash
        assignment_hash = hashlib.sha256(
            f"{user_id}:{experiment_id}:{experiment.config.salt}".encode()
        ).hexdigest()
        
        # Convert to numeric and assign based on traffic allocation
        hash_int = int(assignment_hash[:16], 16)
        assignment_value = (hash_int % 10000) / 100  # 0-100
        
        cumulative = 0
        for variant_id, allocation in experiment.config.traffic_allocation.items():
            cumulative += allocation
            if assignment_value <= cumulative:
                variant = next(v for v in experiment.config.variants if v.id == variant_id)
                self.assignment_cache[cache_key] = variant
                return variant
        
        # Default to control
        return next(v for v in experiment.config.variants 
                   if v.id == experiment.config.control_variant_id)
```

### 4.2 Statistical Analysis Engine

```python
# pseudocode/ab_testing/statistical_engine.py

class StatisticalEngine:
    """Performs statistical analysis for A/B tests."""
    
    def __init__(self, method: str = 'bayesian'):
        self.method = method
        
    def analyze_metric(self, metric: MetricDefinition, data: pd.DataFrame,
                      variants: List[Variant]) -> MetricResult:
        """Analyze a single metric across variants."""
        
        if self.method == 'bayesian':
            return self._bayesian_analysis(metric, data, variants)
        else:
            return self._frequentist_analysis(metric, data, variants)
    
    def _bayesian_analysis(self, metric: MetricDefinition, data: pd.DataFrame,
                          variants: List[Variant]) -> MetricResult:
        """Bayesian analysis using posterior distributions."""
        
        control_data = data[data['variant_id'] == variants[0].id][metric.name]
        treatment_data = data[data['variant_id'] == variants[1].id][metric.name]
        
        if metric.metric_type == 'conversion':
            # Beta prior for conversion rates
            prior_alpha = 1
            prior_beta = 1
            
            # Update with data
            control_posterior = beta(
                prior_alpha + control_data.sum(),
                prior_beta + len(control_data) - control_data.sum()
            )
            treatment_posterior = beta(
                prior_alpha + treatment_data.sum(),
                prior_beta + len(treatment_data) - treatment_data.sum()
            )
            
            # Calculate probability that treatment is better
            samples = 100000
            control_samples = control_posterior.rvs(samples)
            treatment_samples = treatment_posterior.rvs(samples)
            prob_treatment_better = (treatment_samples > control_samples).mean()
            
            # Calculate relative lift
            relative_lift = (treatment_samples.mean() - control_samples.mean()) / control_samples.mean()
            
            return MetricResult(
                metric_name=metric.name,
                control_mean=control_samples.mean(),
                treatment_mean=treatment_samples.mean(),
                relative_lift_mean=relative_lift.mean(),
                relative_lift_ci=(relative_lift.quantile(0.025), relative_lift.quantile(0.975)),
                prob_treatment_better=prob_treatment_better,
                method='bayesian'
            )
```

---

## 5. ML Pipeline for Personalization

### 5.1 Feature Engineering

```python
# pseudocode/ml/features.py

class FeatureEngineeringPipeline:
    """Feature engineering for personalization models."""
    
    def __init__(self, feature_store: FeatureStore):
        self.feature_store = feature_store
        
    def build_user_features(self, user_id: str, as_of_date: datetime) -> UserFeatures:
        """Build comprehensive feature vector for a user."""
        
        features = {}
        
        # Temporal features
        features.update(self._extract_temporal_features(user_id, as_of_date))
        
        # Behavioral features
        features.update(self._extract_behavioral_features(user_id, as_of_date))
        
        # Engagement features
        features.update(self._extract_engagement_features(user_id, as_of_date))
        
        # Mood pattern features
        features.update(self._extract_mood_features(user_id, as_of_date))
        
        # Challenge interaction features
        features.update(self._extract_challenge_features(user_id, as_of_date))
        
        return UserFeatures(user_id=user_id, features=features, as_of_date=as_of_date)
    
    def _extract_mood_features(self, user_id: str, as_of_date: datetime) -> Dict:
        """Extract mood pattern features."""
        
        mood_logs = self._get_mood_logs(user_id, days=30, as_of=as_of_date)
        
        if len(mood_logs) < 3:
            return {
                'mood_avg': 5.0,
                'mood_std': 0.0,
                'mood_trend': 0.0,
                'mood_volatility': 0.0,
                'mood_logs_count': len(mood_logs),
                'mood_logging_consistency': len(mood_logs) / 30
            }
        
        scores = [log.score for log in mood_logs]
        
        return {
            'mood_avg': np.mean(scores),
            'mood_std': np.std(scores),
            'mood_trend': self._calculate_trend(scores),
            'mood_volatility': np.std(scores) / np.mean(scores) if np.mean(scores) > 0 else 0,
            'mood_logs_count': len(mood_logs),
            'mood_logging_consistency': len(mood_logs) / 30,
            'mood_morning_avg': self._get_avg_mood_by_time(mood_logs, 'morning'),
            'mood_evening_avg': self._get_avg_mood_by_time(mood_logs, 'evening'),
            'mood_weekend_vs_weekday': self._compare_weekend_weekday(mood_logs),
        }
```

### 5.2 Recommendation Models

```python
# pseudocode/ml/models.py

class ChallengeRecommendationModel:
    """
    Multi-objective recommendation model for challenges.
    Optimizes for: completion probability, mood improvement, engagement
    """
    
    def __init__(self, model_path: str = None):
        self.completion_model = self._load_model('completion_predictor', model_path)
        self.mood_impact_model = self._load_model('mood_impact_predictor', model_path)
        self.engagement_model = self._load_model('engagement_predictor', model_path)
        self.diversity_model = self._load_model('diversity_scorer', model_path)
        
    def recommend(self, user_id: str, user_features: UserFeatures,
                  available_challenges: List[Challenge],
                  context: RecommendationContext,
                  n_recommendations: int = 5) -> List[ChallengeRecommendation]:
        """Generate personalized challenge recommendations."""
        
        # Score each challenge
        scored_challenges = []
        for challenge in available_challenges:
            scores = self._score_challenge(challenge, user_features, context)
            scored_challenges.append((challenge, scores))
        
        # Apply multi-objective optimization
        optimized = self._multi_objective_optimize(
            scored_challenges,
            objectives={
                'completion': 0.4,
                'mood_improvement': 0.3,
                'engagement': 0.2,
                'diversity': 0.1
            }
        )
        
        # Apply diversity constraints
        diverse_recommendations = self._apply_diversity(
            optimized,
            max_same_category=2,
            max_same_difficulty=3
        )
        
        # Generate explanations
        recommendations = []
        for challenge, scores in diverse_recommendations[:n_recommendations]:
            explanation = self._generate_explanation(challenge, scores, user_features)
            recommendations.append(ChallengeRecommendation(
                challenge=challenge,
                confidence=scores['overall'],
                explanation=explanation,
                expected_outcomes={
                    'completion_probability': scores['completion'],
                    'mood_improvement': scores['mood_improvement'],
                    'engagement_lift': scores['engagement']
                }
            ))
        
        return recommendations
```

### 5.3 Model Training Pipeline

```python
# pseudocode/ml/training_pipeline.py

class ModelTrainingPipeline:
    """End-to-end model training pipeline."""
    
    def __init__(self, mlflow_tracking_uri: str, feature_store: FeatureStore):
        self.mlflow = mlflow.set_tracking_uri(mlflow_tracking_uri)
        self.feature_store = feature_store
        
    def train_challenge_recommendation_model(self, training_config: TrainingConfig) -> ModelArtifacts:
        """Train challenge recommendation model."""
        
        with mlflow.start_run(run_name='challenge_recommendation_training'):
            
            # Log parameters
            mlflow.log_params({
                'model_type': 'xgboost',
                'objective': 'multi_objective',
                'training_window_days': training_config.window_days,
                'features_count': len(training_config.features)
            })
            
            # Load training data
            train_data, val_data, test_data = self._load_training_data(training_config)
            
            # Train completion prediction model
            completion_model = self._train_completion_model(train_data, val_data)
            mlflow.log_metric('completion_val_auc', completion_model.val_auc)
            
            # Train mood impact model
            mood_model = self._train_mood_impact_model(train_data, val_data)
            mlflow.log_metric('mood_val_mae', mood_model.val_mae)
            
            # Train engagement model
            engagement_model = self._train_engagement_model(train_data, val_data)
            mlflow.log_metric('engagement_val_auc', engagement_model.val_auc)
            
            # Save models
            model_artifacts = self._save_models({
                'completion': completion_model,
                'mood_impact': mood_model,
                'engagement': engagement_model
            })
            
            # Register model
            mlflow.register_model(
                model_uri=model_artifacts.model_uri,
                name='challenge_recommendation_model'
            )
            
            return model_artifacts
```

---

## 6. Anomaly Detection System

### 6.1 Anomaly Detection Models

```python
# pseudocode/anomaly_detection/models.py

class BehavioralAnomalyDetector:
    """Detects unusual patterns in user behavior that may indicate distress."""
    
    def __init__(self):
        self.isolation_forest = IsolationForest(contamination=0.05, random_state=42)
        self.user_baselines = {}
        
    def detect(self, user_id: str, current_behavior: BehaviorSnapshot) -> AnomalyResult:
        """Detect behavioral anomalies for a user."""
        
        # Get or build user baseline
        if user_id not in self.user_baselines:
            self.user_baselines[user_id] = self._build_baseline(user_id)
        
        baseline = self.user_baselines[user_id]
        
        # Calculate deviation scores
        deviations = {}
        
        # Session frequency deviation
        expected_sessions = baseline['sessions_per_week']
        actual_sessions = current_behavior.sessions_last_7_days
        deviations['session_frequency'] = self._calculate_deviation(
            actual_sessions, expected_sessions, baseline['sessions_std']
        )
        
        # Session duration deviation
        deviations['session_duration'] = self._calculate_deviation(
            current_behavior.avg_session_duration,
            baseline['avg_session_duration'],
            baseline['session_duration_std']
        )
        
        # Aggregate anomaly score
        anomaly_score = np.mean(list(deviations.values()))
        
        # Determine severity
        severity = self._determine_severity(anomaly_score, deviations)
        
        return AnomalyResult(
            user_id=user_id,
            anomaly_type='behavioral',
            score=anomaly_score,
            severity=severity,
            deviations=deviations,
            detected_at=datetime.utcnow()
        )


class MoodPatternAnomalyDetector:
    """Detects concerning patterns in mood tracking data."""
    
    def __init__(self):
        self.decline_threshold = -0.3  # 30% decline
        self.volatility_threshold = 0.5
        
    def detect(self, user_id: str, mood_history: List[MoodLog]) -> AnomalyResult:
        """Detect mood pattern anomalies."""
        
        if len(mood_history) < 7:
            return AnomalyResult(
                user_id=user_id,
                anomaly_type='mood_pattern',
                score=0.0,
                severity='none',
                reason='insufficient_data'
            )
        
        anomalies = []
        
        # Check for rapid decline
        recent_scores = [m.score for m in mood_history[-7:]]
        previous_scores = [m.score for m in mood_history[-14:-7]]
        
        if previous_scores:
            recent_avg = np.mean(recent_scores)
            previous_avg = np.mean(previous_scores)
            
            decline = (recent_avg - previous_avg) / previous_avg
            
            if decline < self.decline_threshold:
                anomalies.append({
                    'type': 'rapid_decline',
                    'severity': 'high' if decline < -0.5 else 'medium',
                    'details': f'Mood declined by {abs(decline)*100:.0f}%'
                })
        
        # Check for high volatility
        recent_volatility = np.std(recent_scores) / np.mean(recent_scores)
        if recent_volatility > self.volatility_threshold:
            anomalies.append({
                'type': 'high_volatility',
                'severity': 'medium',
                'details': f'Mood volatility: {recent_volatility:.2f}'
            })
        
        # Check for consistently low mood
        if all(s <= 3 for s in recent_scores):
            anomalies.append({
                'type': 'persistently_low',
                'severity': 'high',
                'details': 'Mood consistently low for 7+ days'
            })
        
        # Calculate overall anomaly score
        severity_scores = {'low': 0.3, 'medium': 0.6, 'high': 1.0}
        if anomalies:
            anomaly_score = np.mean([severity_scores[a['severity']] for a in anomalies])
            max_severity = max([a['severity'] for a in anomalies])
        else:
            anomaly_score = 0.0
            max_severity = 'none'
        
        return AnomalyResult(
            user_id=user_id,
            anomaly_type='mood_pattern',
            score=anomaly_score,
            severity=max_severity,
            anomalies_detected=anomalies,
            detected_at=datetime.utcnow()
        )


class CrisisSignalDetector:
    """Detects explicit crisis signals from user content and behavior."""
    
    def __init__(self):
        self.crisis_keywords = self._load_crisis_keywords()
        self.nlp_model = self._load_nlp_model()
        
    def detect(self, user_id: str, content: UserContent, behavior: BehaviorSnapshot) -> CrisisResult:
        """Detect crisis signals from user content and behavior."""
        
        signals = []
        
        # Check journal entries for crisis language
        if content.journal_entries:
            for entry in content.journal_entries:
                crisis_score = self._analyze_text_for_crisis(entry.text)
                if crisis_score > 0.7:
                    signals.append({
                        'type': 'crisis_language',
                        'source': 'journal',
                        'severity': 'critical' if crisis_score > 0.9 else 'high',
                        'score': crisis_score,
                        'timestamp': entry.timestamp
                    })
        
        # Check for crisis button usage
        if behavior.crisis_button_pressed:
            signals.append({
                'type': 'crisis_button',
                'source': 'behavior',
                'severity': 'critical',
                'timestamp': behavior.crisis_button_timestamp
            })
        
        # Check for safety plan access
        if behavior.safety_plan_access_count > 3:
            signals.append({
                'type': 'safety_plan_access',
                'source': 'behavior',
                'severity': 'high',
                'details': f'Accessed {behavior.safety_plan_access_count} times'
            })
        
        # Determine overall crisis level
        if any(s['severity'] == 'critical' for s in signals):
            crisis_level = 'critical'
        elif any(s['severity'] == 'high' for s in signals):
            crisis_level = 'high'
        elif signals:
            crisis_level = 'elevated'
        else:
            crisis_level = 'none'
        
        return CrisisResult(
            user_id=user_id,
            crisis_level=crisis_level,
            signals=signals,
            detected_at=datetime.utcnow(),
            requires_immediate_action=crisis_level == 'critical'
        )
```

### 6.2 Risk Scoring Engine

```python
# pseudocode/anomaly_detection/risk_scoring.py

class RiskScoringEngine:
    """Aggregates multiple anomaly signals into an overall risk score."""
    
    def __init__(self):
        self.weights = {
            'behavioral': 0.25,
            'mood_pattern': 0.35,
            'crisis_signals': 0.40
        }
        
    def calculate_risk_score(self, user_id: str,
                            behavioral_result: AnomalyResult,
                            mood_result: AnomalyResult,
                            crisis_result: CrisisResult) -> RiskScore:
        """Calculate comprehensive risk score."""
        
        # Normalize individual scores
        behavioral_score = behavioral_result.score if behavioral_result else 0
        mood_score = mood_result.score if mood_result else 0
        
        # Crisis signals override other scores
        crisis_multiplier = {
            'none': 0,
            'elevated': 0.5,
            'high': 0.8,
            'critical': 1.0
        }
        crisis_score = crisis_multiplier.get(crisis_result.crisis_level, 0)
        
        # Weighted combination
        if crisis_score > 0:
            overall_score = max(
                crisis_score,
                0.5 * behavioral_score + 0.5 * mood_score
            )
        else:
            overall_score = (
                self.weights['behavioral'] * behavioral_score +
                self.weights['mood_pattern'] * mood_score
            )
        
        # Determine risk level
        risk_level = self._score_to_level(overall_score)
        
        # Generate risk factors
        risk_factors = self._identify_risk_factors(
            behavioral_result, mood_result, crisis_result
        )
        
        return RiskScore(
            user_id=user_id,
            overall_score=overall_score,
            risk_level=risk_level,
            component_scores={
                'behavioral': behavioral_score,
                'mood_pattern': mood_score,
                'crisis_signals': crisis_score
            },
            risk_factors=risk_factors,
            calculated_at=datetime.utcnow(),
            next_review=self._calculate_next_review(risk_level)
        )
    
    def _score_to_level(self, score: float) -> str:
        """Convert numerical score to risk level."""
        if score >= 0.8:
            return 'critical'
        elif score >= 0.6:
            return 'high'
        elif score >= 0.4:
            return 'elevated'
        elif score >= 0.2:
            return 'low'
        else:
            return 'minimal'
    
    def _calculate_next_review(self, risk_level: str) -> datetime:
        """Calculate when next risk review should occur."""
        review_intervals = {
            'critical': timedelta(hours=1),
            'high': timedelta(hours=4),
            'elevated': timedelta(hours=24),
            'low': timedelta(days=7),
            'minimal': timedelta(days=30)
        }
        return datetime.utcnow() + review_intervals.get(risk_level, timedelta(days=7))
```

### 6.3 Intervention System

```python
# pseudocode/anomaly_detection/interventions.py

class InterventionSystem:
    """Manages interventions based on risk scores."""
    
    def __init__(self):
        self.outreach_service = AutomatedOutreachService()
        self.human_review_queue = HumanReviewQueue()
        self.emergency_protocol = EmergencyProtocol()
        
    async def process_risk_score(self, risk_score: RiskScore):
        """Process risk score and trigger appropriate interventions."""
        
        if risk_score.risk_level == 'critical':
            await self._handle_critical_risk(risk_score)
        elif risk_score.risk_level == 'high':
            await self._handle_high_risk(risk_score)
        elif risk_score.risk_level == 'elevated':
            await self._handle_elevated_risk(risk_score)
        elif risk_score.risk_level == 'low':
            await self._handle_low_risk(risk_score)
        
        # Always log for audit
        await self._log_intervention(risk_score)
    
    async def _handle_critical_risk(self, risk_score: RiskScore):
        """Handle critical risk level."""
        
        # Immediate automated outreach
        await self.outreach_service.send_critical_outreach(
            user_id=risk_score.user_id,
            message_type='immediate_support',
            include_resources=True
        )
        
        # Add to human review queue with priority
        await self.human_review_queue.add(
            user_id=risk_score.user_id,
            priority='urgent',
            risk_score=risk_score,
            sla_minutes=15
        )
        
        # Trigger emergency protocol if crisis signals present
        if risk_score.component_scores['crisis_signals'] > 0.8:
            await self.emergency_protocol.initiate(
                user_id=risk_score.user_id,
                risk_score=risk_score
            )
    
    async def _handle_high_risk(self, risk_score: RiskScore):
        """Handle high risk level."""
        
        # Send supportive outreach
        await self.outreach_service.send_supportive_outreach(
            user_id=risk_score.user_id,
            message_type='check_in',
            personalized=True
        )
        
        # Suggest relevant resources
        await self.outreach_service.suggest_resources(
            user_id=risk_score.user_id,
            resource_type='coping_strategies'
        )
        
        # Add to human review queue
        await self.human_review_queue.add(
            user_id=risk_score.user_id,
            priority='high',
            risk_score=risk_score,
            sla_minutes=60
        )
```

---

## 7. Data Governance & Privacy

### 7.1 Data Retention Policies

| Data Type | Retention Period | Anonymization | Deletion Trigger |
|-----------|------------------|---------------|------------------|
| Raw event logs | 90 days | After 30 days | Account deletion |
| Aggregated metrics | 2 years | Immediate | Never (anonymized) |
| PHI content | User-controlled | N/A | User request / 7 years |
| Crisis intervention data | 7 years | After 7 years | Legal requirement |
| ML training data | 1 year | Differential privacy | Model retraining |
| Audit logs | 7 years | Never | Legal requirement |

### 7.2 Privacy Implementation

```python
# pseudocode/privacy/data_retention.py

class DataRetentionManager:
    """Manages data retention policies and automated deletion."""
    
    RETENTION_POLICIES = {
        'raw_events': timedelta(days=90),
        'aggregated_metrics': timedelta(days=730),  # 2 years
        'mood_logs': timedelta(days=730),
        'journal_entries': 'user_controlled',
        'crisis_events': timedelta(days=2555),  # 7 years
        'ml_training_data': timedelta(days=365),
        'audit_logs': timedelta(days=2555),  # 7 years
    }
    
    def __init__(self, storage: DataStorage, audit_logger: AuditLogger):
        self.storage = storage
        self.audit_logger = audit_logger
        
    async def apply_retention_policy(self, data_type: str):
        """Apply retention policy for a data type."""
        
        policy = self.RETENTION_POLICIES.get(data_type)
        if policy == 'user_controlled':
            return
        
        cutoff_date = datetime.utcnow() - policy
        
        # Find data to delete
        data_to_delete = await self.storage.find_data_older_than(
            data_type=data_type,
            cutoff_date=cutoff_date
        )
        
        # Anonymize before deletion if needed
        if data_type in ['raw_events', 'mood_logs']:
            await self._anonymize_before_deletion(data_to_delete)
        
        # Delete data
        deleted_count = await self.storage.delete_data(data_to_delete)
        
        # Log deletion
        self.audit_logger.log_deletion(
            data_type=data_type,
            cutoff_date=cutoff_date,
            records_deleted=deleted_count
        )
        
        return deleted_count
```

---

## 8. Infrastructure & Deployment

### 8.1 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Event Streaming | Apache Kafka | Real-time event ingestion |
| Stream Processing | Apache Flink | Real-time metrics computation |
| Metrics Store | ClickHouse | Time-series analytics |
| Feature Store | Feast | ML feature management |
| Model Serving | NVIDIA Triton | Low-latency inference |
| Model Registry | MLflow | Model versioning |
| Orchestration | Kubeflow | ML pipeline orchestration |
| Cache | Redis | Feature and recommendation caching |

### 8.2 Kubernetes Deployment

```yaml
# kubernetes/analytics-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: analytics-service
  namespace: mindmate-analytics
spec:
  replicas: 3
  selector:
    matchLabels:
      app: analytics-service
  template:
    metadata:
      labels:
        app: analytics-service
    spec:
      containers:
      - name: analytics-api
        image: mindmate/analytics-service:v1.2.0
        ports:
        - containerPort: 8000
        env:
        - name: KAFKA_BROKERS
          value: "kafka:9092"
        - name: CLICKHOUSE_HOST
          value: "clickhouse:8123"
        - name: REDIS_HOST
          value: "redis:6379"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: analytics-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: analytics-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 9. Monitoring & Alerting

### 9.1 Key Metrics Dashboard

| Category | Metric | Target | Alert Threshold |
|----------|--------|--------|-----------------|
| **Data Pipeline** | Event processing latency | < 5s | > 30s |
| | Event processing rate | > 10K/s | < 5K/s |
| | Data quality score | > 99% | < 95% |
| **ML Models** | Recommendation CTR | > 15% | < 10% |
| | Model prediction latency | < 100ms | > 500ms |
| | Model drift score | < 0.1 | > 0.2 |
| **Anomaly Detection** | Detection latency | < 60s | > 5min |
| | False positive rate | < 5% | > 10% |
| | Risk score accuracy | > 85% | < 75% |
| **A/B Tests** | Experiment balance | +/-5% | +/-10% |
| | Statistical power | > 80% | < 70% |

### 9.2 Alerting Rules

```yaml
# prometheus/alerting-rules.yaml
groups:
- name: analytics-alerts
  rules:
  - alert: HighEventProcessingLatency
    expr: analytics_event_processing_latency_seconds > 30
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High event processing latency"
      
  - alert: CriticalRiskUserDetected
    expr: increase(critical_risk_users_detected_total[1h]) > 0
    for: 0m
    labels:
      severity: critical
    annotations:
      summary: "Critical risk user detected"
```

---

## Appendix A: API Specifications

### A.1 Analytics API Endpoints

```
GET /api/v1/analytics/user/{user_id}/progress
  - Returns user's progress metrics
  
GET /api/v1/analytics/user/{user_id}/weekly-report
  - Returns weekly progress report
  
POST /api/v1/analytics/events
  - Submit analytics event
  
GET /api/v1/analytics/experiments/{experiment_id}/variant
  - Get variant assignment for user
  
POST /api/v1/analytics/recommendations/challenges
  - Get challenge recommendations
  
GET /api/v1/analytics/risk/{user_id}/score
  - Get current risk score (authorized only)
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **PHI** | Protected Health Information |
| **PHQ-9** | Patient Health Questionnaire-9 (depression screening) |
| **GAD-7** | Generalized Anxiety Disorder-7 (anxiety screening) |
| **PSS** | Perceived Stress Scale |
| **WHO-5** | WHO-5 Wellbeing Index |
| **MLflow** | Open source ML lifecycle management platform |
| **Feast** | Open source feature store |
| **Triton** | NVIDIA Triton Inference Server |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Agent 44 | Initial release |

---

*This document is confidential and proprietary to MindMate AI. Unauthorized distribution is prohibited.*
