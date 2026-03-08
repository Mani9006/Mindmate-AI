# MindMate AI - AWS Cloud Infrastructure Design

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Network Topology](#2-network-topology)
3. [ECS Container Service](#3-ecs-container-service)
4. [RDS PostgreSQL Database](#4-rds-postgresql-database)
5. [ElastiCache Redis](#5-elasticache-redis)
6. [S3 Storage & CloudFront CDN](#6-s3-storage--cloudfront-cdn)
7. [API Gateway & Lambda](#7-api-gateway--lambda)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Environment Configuration](#9-environment-configuration)
10. [Auto-Scaling Configuration](#10-auto-scaling-configuration)
11. [Cost Estimates](#11-cost-estimates)
12. [Monitoring & Observability](#12-monitoring--observability)
13. [Security Configuration](#13-security-configuration)
14. [Disaster Recovery](#14-disaster-recovery)
15. [Infrastructure as Code](#15-infrastructure-as-code)

---

## 1. Architecture Overview

### High-Level Architecture Diagram

```
                                    ┌─────────────────────────────────────────┐
                                    │           Internet Users                │
                                    └─────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                                    ┌─────────────────────────────────────────┐
                                    │         Route 53 (DNS)                  │
                                    │    mindmate.ai / api.mindmate.ai        │
                                    └─────────────────┬───────────────────────┘
                                                      │
                          ┌───────────────────────────┼───────────────────────────┐
                          │                           │                           │
                          ▼                           ▼                           ▼
            ┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
            │   CloudFront CDN    │     │    API Gateway      │     │   WAF (Web ACL)     │
            │  (Static Assets)    │     │   (REST/WebSocket)  │     │   (DDoS/Security)   │
            └──────────┬──────────┘     └──────────┬──────────┘     └─────────────────────┘
                       │                           │
                       ▼                           ▼
            ┌─────────────────────┐     ┌─────────────────────┐
            │       S3 Bucket     │     │      ECS Fargate    │
            │  (Audio/Static)     │     │    (App Containers) │
            └─────────────────────┘     └──────────┬──────────┘
                                                   │
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                              ▼                    ▼                    ▼
                    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
                    │   RDS Primary   │  │ ElastiCache     │  │   Lambda        │
                    │  PostgreSQL     │  │   Redis Cluster │  │  (Async Jobs)   │
                    └─────────────────┘  └─────────────────┘  └─────────────────┘
                              │                    │                    │
                              ▼                    ▼                    ▼
                    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
                    │  RDS Replica    │  │   SQS Queues    │  │   EventBridge   │
                    │  (Multi-AZ)     │  │  (Job Queues)   │  │  (Scheduling)   │
                    └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Service Responsibilities

| Service | Purpose | Technology |
|---------|---------|------------|
| **ECS Fargate** | Container orchestration for API & WebSocket servers | Docker, Fargate |
| **RDS PostgreSQL** | Primary database for user data, sessions, analytics | PostgreSQL 15 |
| **ElastiCache Redis** | Session cache, rate limiting, real-time features | Redis 7.0 |
| **S3** | Audio recordings, user uploads, static assets | S3 Standard, IA |
| **CloudFront** | Global CDN for low-latency content delivery | CloudFront |
| **API Gateway** | API management, throttling, authentication | REST + WebSocket |
| **Lambda** | Async job processing, scheduled tasks, webhooks | Python/Node.js |
| **SQS** | Message queuing for reliable job processing | SQS Standard |

---

## 2. Network Topology

### VPC Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              VPC: mindmate-vpc (10.0.0.0/16)                        │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           Availability Zone: us-east-1a                      │   │
│  │  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │   │
│  │  │  Public Subnet      │    │  Private Subnet     │    │  Database Subnet│  │   │
│  │  │  10.0.1.0/24        │    │  10.0.3.0/24        │    │  10.0.5.0/24    │  │   │
│  │  │                     │    │                     │    │                 │  │   │
│  │  │  • ALB (Public)     │    │  • ECS Tasks        │    │  • RDS Primary  │  │   │
│  │  │  • NAT Gateway      │    │  • Lambda ENIs      │    │  • ElastiCache  │  │   │
│  │  │  • Bastion Host     │    │                     │    │                 │  │   │
│  │  └─────────────────────┘    └─────────────────────┘    └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           Availability Zone: us-east-1b                      │   │
│  │  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │   │
│  │  │  Public Subnet      │    │  Private Subnet     │    │  Database Subnet│  │   │
│  │  │  10.0.2.0/24        │    │  10.0.4.0/24        │    │  10.0.6.0/24    │  │   │
│  │  │                     │    │                     │    │                 │  │   │
│  │  │  • ALB (Public)     │    │  • ECS Tasks        │    │  • RDS Replica  │  │   │
│  │  │  • NAT Gateway      │    │  • Lambda ENIs      │    │  • ElastiCache  │  │   │
│  │  │                     │    │                     │    │                 │  │   │
│  │  └─────────────────────┘    └─────────────────────┘    └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           VPC Endpoints (PrivateLink)                        │   │
│  │  • S3 Gateway Endpoint                                                       │   │
│  │  • ECR Interface Endpoints                                                   │   │
│  │  • CloudWatch Logs Interface Endpoint                                        │   │
│  │  • Secrets Manager Interface Endpoint                                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Network Configuration

| Component | CIDR Block | Purpose |
|-----------|------------|---------|
| VPC | 10.0.0.0/16 | Main network |
| Public Subnet 1a | 10.0.1.0/24 | ALB, NAT Gateway |
| Public Subnet 1b | 10.0.2.0/24 | ALB, NAT Gateway |
| Private Subnet 1a | 10.0.3.0/24 | ECS Tasks |
| Private Subnet 1b | 10.0.4.0/24 | ECS Tasks |
| Database Subnet 1a | 10.0.5.0/24 | RDS, ElastiCache |
| Database Subnet 1b | 10.0.6.0/24 | RDS, ElastiCache |

### Security Groups

```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "mindmate-alb-"
  description = "Security group for Application Load Balancer"
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "mindmate-ecs-tasks-"
  description = "Security group for ECS tasks"
  
  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "mindmate-rds-"
  description = "Security group for RDS PostgreSQL"
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }
}

# ElastiCache Security Group
resource "aws_security_group" "elasticache" {
  name_prefix = "mindmate-elasticache-"
  description = "Security group for ElastiCache Redis"
  
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }
}
```

---

## 3. ECS Container Service

### Cluster Configuration

| Setting | Production | Staging | Development |
|---------|------------|---------|-------------|
| **Cluster Type** | Fargate | Fargate | Fargate |
| **Platform Version** | LATEST | LATEST | LATEST |
| **Container Insights** | Enabled | Enabled | Disabled |

### Task Definitions

#### API Server Task

```json
{
  "family": "mindmate-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/mindmate-api-task-role",
  "containerDefinitions": [
    {
      "name": "api-server",
      "image": "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/mindmate-api:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "APP_ENV", "value": "production"},
        {"name": "PORT", "value": "8000"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:mindmate/database-url"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:mindmate/redis-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mindmate-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "ulimits": [
        {
          "name": "nofile",
          "softLimit": 65536,
          "hardLimit": 65536
        }
      ]
    }
  ]
}
```

#### WebSocket Server Task

```json
{
  "family": "mindmate-websocket",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/mindmate-websocket-task-role",
  "containerDefinitions": [
    {
      "name": "websocket-server",
      "image": "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/mindmate-websocket:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "APP_ENV", "value": "production"},
        {"name": "PORT", "value": "8080"}
      ],
      "secrets": [
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:mindmate/redis-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mindmate-websocket",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Service Configuration

| Parameter | API Service | WebSocket Service |
|-----------|-------------|-------------------|
| **Launch Type** | Fargate | Fargate |
| **Desired Count** | 2 | 2 |
| **Min Count** | 2 | 2 |
| **Max Count** | 20 | 10 |
| **Deployment Type** | Rolling Update | Rolling Update |
| **Health Check Grace Period** | 60s | 30s |
| **Circuit Breaker** | Enabled | Enabled |

### Application Load Balancer

```hcl
resource "aws_lb" "main" {
  name               = "mindmate-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = true
  enable_http2              = true
  idle_timeout              = 60
  
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb-logs"
    enabled = true
  }
}

# Target Group for API
resource "aws_lb_target_group" "api" {
  name        = "mindmate-api-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }
  
  deregistration_delay = 30
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# HTTP to HTTPS Redirect
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}
```

---

## 4. RDS PostgreSQL Database

### Instance Configuration

| Parameter | Production | Staging | Development |
|-----------|------------|---------|-------------|
| **Engine** | PostgreSQL 15.4 | PostgreSQL 15.4 | PostgreSQL 15.4 |
| **Instance Class** | db.r6g.xlarge | db.t4g.medium | db.t4g.micro |
| **Storage** | 100 GB (GP3) | 50 GB (GP2) | 20 GB (GP2) |
| **IOPS** | 3000 (baseline) | 3000 (baseline) | - |
| **Multi-AZ** | Yes | Yes | No |
| **Read Replicas** | 1 | 0 | 0 |
| **Backup Retention** | 35 days | 7 days | 1 day |
| **Encryption** | Yes (KMS) | Yes (KMS) | Yes |

### Database Configuration

```hcl
resource "aws_db_instance" "primary" {
  identifier = "mindmate-postgres-primary"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.xlarge"
  
  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.rds.arn
  
  db_name  = "mindmate"
  username = "mindmate_admin"
  password = data.aws_secretsmanager_secret_version.db_password.secret_string
  
  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  backup_retention_period = 35
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  performance_insights_retention_period = 7
  
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "mindmate-final-snapshot"
  
  tags = {
    Environment = "production"
    Application = "mindmate"
  }
}

# Read Replica
resource "aws_db_instance" "replica" {
  identifier = "mindmate-postgres-replica"
  
  replicate_source_db = aws_db_instance.primary.arn
  instance_class      = "db.r6g.large"
  
  storage_encrypted = true
  kms_key_id       = aws_kms_key.rds.arn
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  performance_insights_retention_period = 7
  
  tags = {
    Environment = "production"
    Application = "mindmate"
  }
}
```

### Parameter Group Settings

```hcl
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "mindmate-postgres-params"
  
  parameter {
    name  = "max_connections"
    value = "500"
  }
  
  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/32768}"
  }
  
  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory/8192}"
  }
  
  parameter {
    name  = "work_mem"
    value = "65536"
  }
  
  parameter {
    name  = "maintenance_work_mem"
    value = "524288"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }
  
  parameter {
    name  = "log_connections"
    value = "1"
  }
  
  parameter {
    name  = "log_disconnections"
    value = "1"
  }
  
  parameter {
    name  = "ssl"
    value = "1"
  }
}
```

---

## 5. ElastiCache Redis

### Cluster Configuration

| Parameter | Production | Staging | Development |
|-----------|------------|---------|-------------|
| **Engine** | Redis 7.0 | Redis 7.0 | Redis 7.0 |
| **Node Type** | cache.r6g.large | cache.t4g.medium | cache.t4g.micro |
| **Cluster Mode** | Enabled | Disabled | Disabled |
| **Shards** | 2 | 1 | 1 |
| **Replicas per Shard** | 1 | 0 | 0 |
| **Multi-AZ** | Yes | No | No |
| **Encryption** | Yes (TLS) | Yes (TLS) | Yes |

### Redis Configuration

```hcl
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "mindmate-redis"
  description         = "MindMate Redis cluster for sessions and caching"
  
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.r6g.large"
  port                 = 6379
  
  num_cache_clusters = 0
  num_node_groups    = 2
  replicas_per_node_group = 1
  
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = data.aws_secretsmanager_secret_version.redis_auth.secret_string
  kms_key_id               = aws_kms_key.elasticache.arn
  
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.elasticache.id]
  
  snapshot_retention_limit = 7
  snapshot_window         = "05:00-06:00"
  maintenance_window      = "sun:06:00-sun:07:00"
  
  parameter_group_name = aws_elasticache_parameter_group.main.name
  
  apply_immediately = false
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_engine.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
  }
}

resource "aws_elasticache_parameter_group" "main" {
  family = "redis7"
  name   = "mindmate-redis-params"
  
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
  
  parameter {
    name  = "activedefrag"
    value = "yes"
  }
  
  parameter {
    name  = "timeout"
    value = "300"
  }
  
  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }
}
```

### Redis Use Cases

| Use Case | Key Pattern | TTL |
|----------|-------------|-----|
| **User Sessions** | `session:{user_id}` | 24 hours |
| **Rate Limiting** | `ratelimit:{ip}:{endpoint}` | 1 minute |
| **API Response Cache** | `cache:{endpoint}:{hash}` | 5 minutes |
| **WebSocket Connections** | `ws:{connection_id}` | Session duration |
| **Feature Flags** | `feature:{flag_name}` | No expiration |

---

## 6. S3 Storage & CloudFront CDN

### S3 Buckets

#### Audio Recordings Bucket

```hcl
resource "aws_s3_bucket" "recordings" {
  bucket = "mindmate-recordings-${var.environment}"
}

resource "aws_s3_bucket_versioning" "recordings" {
  bucket = aws_s3_bucket.recordings.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "recordings" {
  bucket = aws_s3_bucket.recordings.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "recordings" {
  bucket = aws_s3_bucket.recordings.id
  
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }
    
    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

resource "aws_s3_bucket_public_access_block" "recordings" {
  bucket = aws_s3_bucket.recordings.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "recordings" {
  bucket = aws_s3_bucket.recordings.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.recordings.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      },
      {
        Sid    = "AllowECSUpload"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ecs_task_role.arn
        }
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.recordings.arn}/*"
      }
    ]
  })
}
```

#### Static Assets Bucket

```hcl
resource "aws_s3_bucket" "static" {
  bucket = "mindmate-static-${var.environment}"
}

resource "aws_s3_bucket_cors_rule" "static" {
  bucket = aws_s3_bucket.static.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["https://mindmate.ai", "https://*.mindmate.ai"]
    max_age_seconds = 3600
  }
}
```

### CloudFront Distribution

```hcl
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "MindMate CDN"
  default_root_object = "index.html"
  price_class         = "PriceClass_All"
  
  aliases = ["cdn.mindmate.ai", "static.mindmate.ai"]
  
  origin {
    domain_name = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id   = "S3-static"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }
  
  origin {
    domain_name = aws_s3_bucket.recordings.bucket_regional_domain_name
    origin_id   = "S3-recordings"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }
  
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-api"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
    
    custom_header {
      name  = "X-Origin-Verify"
      value = var.origin_verify_header
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-static"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 31536000
    compress               = true
  }
  
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-api"
    
    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }
  
  ordered_cache_behavior {
    path_pattern     = "/recordings/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-recordings"
    
    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "https-only"
    min_ttl                = 3600
    default_ttl            = 86400
    max_ttl                = 604800
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cloudfront.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cdn-logs/"
  }
  
  web_acl_id = aws_wafv2_web_acl.cloudfront.arn
}
```

---

## 7. API Gateway & Lambda

### API Gateway Configuration

```hcl
resource "aws_api_gateway_rest_api" "main" {
  name        = "mindmate-api"
  description = "MindMate REST API"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  binary_media_types = ["multipart/form-data", "audio/*"]
}

# Throttling Settings
resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"
  
  settings {
    throttling_burst_limit = 1000
    throttling_rate_limit  = 500
    logging_level          = "INFO"
    data_trace_enabled     = true
    metrics_enabled        = true
  }
}

# Custom Domain
resource "aws_api_gateway_domain_name" "main" {
  domain_name = "api.mindmate.ai"
  
  regional_certificate_arn = aws_acm_certificate.api.arn
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  security_policy = "TLS_1_2"
}
```

### WebSocket API

```hcl
resource "aws_apigatewayv2_api" "websocket" {
  name                       = "mindmate-websocket"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

# WebSocket Routes
resource "aws_apigatewayv2_route" "connect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.connect.id}"
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}

resource "aws_apigatewayv2_route" "message" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "sendmessage"
  target    = "integrations/${aws_apigatewayv2_integration.message.id}"
}

# WebSocket Lambda Integration
resource "aws_apigatewayv2_integration" "connect" {
  api_id           = aws_apigatewayv2_api.websocket.id
  integration_type = "AWS_PROXY"
  
  integration_uri    = aws_lambda_function.websocket_connect.invoke_arn
  integration_method = "POST"
}
```

### Lambda Functions

#### Async Job Processor

```hcl
resource "aws_lambda_function" "job_processor" {
  function_name = "mindmate-job-processor"
  role          = aws_iam_role.lambda_job.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 900
  memory_size   = 2048
  
  filename         = data.archive_file.lambda_job.output_path
  source_code_hash = data.archive_file.lambda_job.output_base64sha256
  
  environment {
    variables = {
      DATABASE_URL = data.aws_secretsmanager_secret_version.database_url.secret_string
      REDIS_URL    = data.aws_secretsmanager_secret_version.redis_url.secret_string
      S3_BUCKET    = aws_s3_bucket.recordings.id
    }
  }
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  tracing_config {
    mode = "Active"
  }
  
  reserved_concurrent_executions = 100
}

# SQS Trigger
resource "aws_lambda_event_source_mapping" "job_queue" {
  event_source_arn = aws_sqs_queue.jobs.arn
  function_name    = aws_lambda_function.job_processor.arn
  
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5
  
  scaling_config {
    maximum_concurrency = 50
  }
}
```

#### Scheduled Tasks

```hcl
resource "aws_lambda_function" "daily_report" {
  function_name = "mindmate-daily-report"
  role          = aws_iam_role.lambda_scheduled.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 300
  memory_size   = 512
  
  filename         = data.archive_file.lambda_report.output_path
  source_code_hash = data.archive_file.lambda_report.output_base64sha256
  
  environment {
    variables = {
      DATABASE_URL = data.aws_secretsmanager_secret_version.database_url.secret_string
      SES_FROM     = "reports@mindmate.ai"
    }
  }
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
}

# EventBridge Schedule
resource "aws_cloudwatch_event_rule" "daily_report" {
  name                = "mindmate-daily-report"
  description         = "Trigger daily report generation"
  schedule_expression = "cron(0 6 * * ? *)"  # 6 AM UTC daily
}

resource "aws_cloudwatch_event_target" "daily_report" {
  rule      = aws_cloudwatch_event_rule.daily_report.name
  target_id = "mindmate-daily-report"
  arn       = aws_lambda_function.daily_report.arn
}
```

### SQS Queues

```hcl
resource "aws_sqs_queue" "jobs" {
  name                       = "mindmate-jobs"
  visibility_timeout_seconds = 960  # 2x Lambda timeout
  message_retention_seconds  = 86400
  receive_wait_time_seconds  = 20
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.jobs_dlq.arn
    maxReceiveCount     = 3
  })
  
  kms_master_key_id = aws_kms_key.sqs.arn
}

resource "aws_sqs_queue" "jobs_dlq" {
  name                      = "mindmate-jobs-dlq"
  message_retention_seconds = 1209600  # 14 days
  kms_master_key_id         = aws_kms_key.sqs.arn
}

resource "aws_sqs_queue" "notifications" {
  name                       = "mindmate-notifications"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400
  kms_master_key_id          = aws_kms_key.sqs.arn
}
```

---

## 8. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: mindmate-api
  ECS_CLUSTER: mindmate
  ECS_SERVICE_API: mindmate-api
  ECS_SERVICE_WEBSOCKET: mindmate-websocket

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      
      - name: Run linting
        run: |
          flake8 app tests
          black --check app tests
          isort --check-only app tests
      
      - name: Run type checking
        run: mypy app
      
      - name: Run tests
        run: pytest --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    permissions:
      contents: read
      id-token: write
    outputs:
      image_tag: ${{ steps.build.outputs.image_tag }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build and push API image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/Dockerfile.api
          push: true
          tags: |
            ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}
            ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}
      
      - name: Build and push WebSocket image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/Dockerfile.websocket
          push: true
          tags: |
            ${{ steps.login-ecr.outputs.registry }}/mindmate-websocket:${{ github.sha }}
            ${{ steps.login-ecr.outputs.registry }}/mindmate-websocket:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    environment:
      name: staging
      url: https://staging.mindmate.ai
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN_STAGING }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update ECS task definition (API)
        id: task-def-api
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: .aws/task-definition-api-staging.json
          container-name: api-server
          image: ${{ needs.build.outputs.image_tag }}
      
      - name: Deploy to ECS (API)
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def-api.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE_API }}-staging
          cluster: ${{ env.ECS_CLUSTER }}-staging
          wait-for-service-stability: true
          codedeploy-appspec: .aws/appspec-staging.json
      
      - name: Run smoke tests
        run: |
          curl -f https://staging.mindmate.ai/health || exit 1

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://mindmate.ai
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN_PRODUCTION }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update ECS task definition (API)
        id: task-def-api
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: .aws/task-definition-api.json
          container-name: api-server
          image: ${{ needs.build.outputs.image_tag }}
      
      - name: Deploy to ECS (API) - Blue/Green
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def-api.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE_API }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
          codedeploy-appspec: .aws/appspec.json
          codedeploy-application: mindmate-api
          codedeploy-deployment-group: mindmate-api-dg
      
      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deployment to production ${{ job.status }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Dockerfile (API)

```dockerfile
# docker/Dockerfile.api
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies from builder
COPY --from=builder /root/.local /home/appuser/.local

# Copy application code
COPY --chown=appuser:appuser app/ ./app/

# Set environment
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

---

## 9. Environment Configuration

### Environment Separation

| Resource | Production | Staging | Development |
|----------|------------|---------|-------------|
| **VPC** | mindmate-vpc-prod | mindmate-vpc-staging | mindmate-vpc-dev |
| **ECS Cluster** | mindmate-prod | mindmate-staging | mindmate-dev |
| **RDS** | db.r6g.xlarge | db.t4g.medium | db.t4g.micro |
| **ElastiCache** | cache.r6g.large | cache.t4g.medium | cache.t4g.micro |
| **Domain** | mindmate.ai | staging.mindmate.ai | dev.mindmate.ai |
| **SSL Cert** | *.mindmate.ai | *.staging.mindmate.ai | *.dev.mindmate.ai |

### Environment Variables

```bash
# .env.production
APP_ENV=production
DEBUG=false
LOG_LEVEL=INFO

# Database
DATABASE_URL=postgresql://user:pass@host:5432/mindmate
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=rediss://user:pass@host:6379/0
REDIS_SSL_CERT_REQS=required

# AWS
AWS_REGION=us-east-1
S3_BUCKET=mindmate-recordings-production
S3_ENDPOINT_URL=

# API
API_RATE_LIMIT=100/minute
API_BURST_LIMIT=200
JWT_SECRET_KEY=xxx
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# WebSocket
WS_HEARTBEAT_INTERVAL=30
WS_CONNECTION_TIMEOUT=300

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
```

---

## 10. Auto-Scaling Configuration

### ECS Auto-Scaling

```hcl
resource "aws_appautoscaling_target" "api" {
  max_capacity       = 20
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Scale up on CPU
resource "aws_appautoscaling_policy" "api_cpu_up" {
  name               = "mindmate-api-cpu-up"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace
  
  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 60
    metric_aggregation_type = "Average"
    
    step_adjustment {
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 20
      scaling_adjustment          = 1
    }
    
    step_adjustment {
      metric_interval_lower_bound = 20
      metric_interval_upper_bound = 50
      scaling_adjustment          = 2
    }
    
    step_adjustment {
      metric_interval_lower_bound = 50
      scaling_adjustment          = 4
    }
  }
}

# Scale down on CPU
resource "aws_appautoscaling_policy" "api_cpu_down" {
  name               = "mindmate-api-cpu-down"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace
  
  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 300
    metric_aggregation_type = "Average"
    
    step_adjustment {
      metric_interval_upper_bound = 0
      metric_interval_lower_bound = -20
      scaling_adjustment          = -1
    }
    
    step_adjustment {
      metric_interval_upper_bound = -20
      scaling_adjustment          = -2
    }
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "api_cpu_high" {
  alarm_name          = "mindmate-api-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "Scale up API when CPU > 70%"
  
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }
  
  alarm_actions = [aws_appautoscaling_policy.api_cpu_up.arn]
}

resource "aws_cloudwatch_metric_alarm" "api_cpu_low" {
  alarm_name          = "mindmate-api-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 30
  alarm_description   = "Scale down API when CPU < 30%"
  
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }
  
  alarm_actions = [aws_appautoscaling_policy.api_cpu_down.arn]
}

# Request Count Scaling
resource "aws_cloudwatch_metric_alarm" "api_requests_high" {
  alarm_name          = "mindmate-api-requests-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RequestCountPerTarget"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 1000
  
  dimensions = {
    TargetGroup = aws_lb_target_group.api.arn_suffix
  }
  
  alarm_actions = [aws_appautoscaling_policy.api_cpu_up.arn]
}
```

### RDS Auto-Scaling

```hcl
resource "aws_db_instance" "primary" {
  # ... other config
  
  max_allocated_storage = 500  # Enable storage autoscaling
}
```

### Lambda Concurrency

```hcl
resource "aws_lambda_provisioned_concurrency_config" "job_processor" {
  function_name                     = aws_lambda_function.job_processor.function_name
  qualifier                         = aws_lambda_function.job_processor.version
  provisioned_concurrent_executions = 10
}
```

---

## 11. Cost Estimates

### 1,000 Monthly Active Users

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **ECS Fargate** | 1 vCPU, 2 GB RAM (2 tasks) | $75 |
| **RDS PostgreSQL** | db.t4g.micro, Single-AZ | $15 |
| **ElastiCache** | cache.t4g.micro | $15 |
| **S3** | 50 GB storage + requests | $5 |
| **CloudFront** | 100 GB transfer | $10 |
| **API Gateway** | 1M requests | $4 |
| **Lambda** | 100K invocations | $2 |
| **Data Transfer** | Outbound | $10 |
| **CloudWatch** | Logs + metrics | $15 |
| **WAF** | Web ACL + rules | $15 |
| **Route 53** | Hosted zone + queries | $5 |
| **Secrets Manager** | 10 secrets | $4 |
| **Total** | | **~$175/month** |

### 10,000 Monthly Active Users

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **ECS Fargate** | 2 vCPU, 4 GB RAM (4 tasks) | $300 |
| **RDS PostgreSQL** | db.t4g.medium, Multi-AZ | $80 |
| **ElastiCache** | cache.t4g.medium | $50 |
| **S3** | 500 GB storage + requests | $25 |
| **CloudFront** | 1 TB transfer | $85 |
| **API Gateway** | 10M requests | $35 |
| **Lambda** | 1M invocations | $20 |
| **Data Transfer** | Outbound | $90 |
| **CloudWatch** | Logs + metrics | $50 |
| **WAF** | Web ACL + rules | $25 |
| **Route 53** | Hosted zone + queries | $10 |
| **Secrets Manager** | 20 secrets | $8 |
| **Total** | | **~$778/month** |

### 100,000 Monthly Active Users

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **ECS Fargate** | 4 vCPU, 8 GB RAM (10 tasks) | $1,500 |
| **RDS PostgreSQL** | db.r6g.xlarge, Multi-AZ + replica | $600 |
| **ElastiCache** | cache.r6g.large (cluster mode) | $300 |
| **S3** | 5 TB storage + requests | $150 |
| **CloudFront** | 10 TB transfer | $400 |
| **API Gateway** | 100M requests | $350 |
| **Lambda** | 10M invocations | $200 |
| **Data Transfer** | Outbound | $900 |
| **CloudWatch** | Logs + metrics | $200 |
| **WAF** | Web ACL + rules + Bot Control | $150 |
| **Route 53** | Hosted zone + queries | $30 |
| **Secrets Manager** | 30 secrets | $12 |
| **KMS** | Key operations | $50 |
| **SQS** | Message operations | $30 |
| **Total** | | **~$4,872/month** |

### Cost Optimization Strategies

1. **Reserved Instances**: Save up to 40% on RDS with 1-year reserved instances
2. **Savings Plans**: Save up to 30% on Fargate with Compute Savings Plans
3. **S3 Intelligent-Tiering**: Automatically move infrequently accessed data
4. **CloudFront Caching**: Maximize cache hit ratio to reduce origin requests
5. **Lambda Provisioned Concurrency**: For predictable workloads

---

## 12. Monitoring & Observability

### CloudWatch Configuration

```hcl
# Log Groups
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/mindmate-api"
  retention_in_days = 30
  kms_key_id       = aws_kms_key.cloudwatch.arn
}

resource "aws_cloudwatch_log_group" "rds" {
  name              = "/aws/rds/instance/mindmate-postgres/postgresql"
  retention_in_days = 14
}

# Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "mindmate-production"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "ECS CPU Utilization"
          region = "us-east-1"
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "mindmate-api", "ClusterName", "mindmate"]
          ]
          period = 60
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "ECS Memory Utilization"
          region = "us-east-1"
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ServiceName", "mindmate-api", "ClusterName", "mindmate"]
          ]
          period = 60
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "ALB Request Count"
          region = "us-east-1"
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix]
          ]
          period = 60
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "ALB 5xx Errors"
          region = "us-east-1"
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", aws_lb.main.arn_suffix]
          ]
          period = 60
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          title  = "RDS CPU Utilization"
          region = "us-east-1"
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "mindmate-postgres-primary"]
          ]
          period = 60
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          title  = "RDS Database Connections"
          region = "us-east-1"
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "mindmate-postgres-primary"]
          ]
          period = 60
          stat   = "Average"
        }
      }
    ]
  })
}
```

### CloudWatch Alarms

```hcl
# High CPU Alarm
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "mindmate-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU utilization is high"
  
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

# High Error Rate
resource "aws_cloudwatch_metric_alarm" "high_errors" {
  alarm_name          = "mindmate-high-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 10
  alarm_description   = "Error rate is high"
  
  metric_query {
    id          = "error_rate"
    expression  = "errors / total * 100"
    label       = "Error Rate"
    return_data = true
  }
  
  metric_query {
    id = "errors"
    metric {
      metric_name = "HTTPCode_Target_5XX_Count"
      namespace   = "AWS/ApplicationELB"
      period      = 60
      stat        = "Sum"
      dimensions = {
        LoadBalancer = aws_lb.main.arn_suffix
      }
    }
  }
  
  metric_query {
    id = "total"
    metric {
      metric_name = "RequestCount"
      namespace   = "AWS/ApplicationELB"
      period      = 60
      stat        = "Sum"
      dimensions = {
        LoadBalancer = aws_lb.main.arn_suffix
      }
    }
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}

# RDS Storage Alarm
resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "mindmate-rds-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10737418240  # 10 GB
  alarm_description   = "RDS free storage is low"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

### Datadog Integration

```hcl
resource "aws_iam_role" "datadog_integration" {
  name = "datadog-integration-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::464622532012:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = var.datadog_external_id
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "datadog_integration" {
  name = "datadog-integration-policy"
  role = aws_iam_role.datadog_integration.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:Get*",
          "cloudwatch:List*",
          "ec2:Describe*",
          "ecs:Describe*",
          "ecs:List*",
          "logs:Get*",
          "logs:List*",
          "logs:FilterLogEvents",
          "rds:Describe*",
          "rds:List*",
          "elasticache:Describe*"
        ]
        Resource = "*"
      }
    ]
  })
}
```

### Sentry Configuration

```python
# app/core/sentry.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration

def init_sentry(dsn: str, environment: str):
    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        release=os.getenv("GIT_SHA", "unknown"),
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
            RedisIntegration(),
        ],
        before_send=filter_sensitive_data,
    )

def filter_sensitive_data(event, hint):
    # Filter out sensitive data
    if "request" in event:
        headers = event["request"].get("headers", {})
        sensitive_headers = ["authorization", "cookie", "x-api-key"]
        for header in sensitive_headers:
            if header in headers:
                headers[header] = "[Filtered]"
    return event
```

### Custom Application Metrics

```python
# app/core/metrics.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from functools import wraps
import time

# Define metrics
REQUEST_COUNT = Counter(
    'mindmate_requests_total',
    'Total requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'mindmate_request_duration_seconds',
    'Request duration',
    ['method', 'endpoint']
)

ACTIVE_SESSIONS = Gauge(
    'mindmate_active_sessions',
    'Number of active user sessions'
)

DB_CONNECTIONS = Gauge(
    'mindmate_db_connections',
    'Database connection pool usage'
)

AUDIO_PROCESSING_DURATION = Histogram(
    'mindmate_audio_processing_seconds',
    'Audio processing duration',
    ['operation']
)

def track_request(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            response = await func(*args, **kwargs)
            status = response.status_code
        except Exception as e:
            status = 500
            raise
        finally:
            duration = time.time() - start_time
            REQUEST_DURATION.labels(
                method=request.method,
                endpoint=request.url.path
            ).observe(duration)
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.url.path,
                status=status
            ).inc()
        return response
    return wrapper
```

---

## 13. Security Configuration

### WAF (Web Application Firewall)

```hcl
resource "aws_wafv2_web_acl" "main" {
  name        = "mindmate-waf"
  description = "WAF rules for MindMate"
  scope       = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  # AWS Managed Rules - Common Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
        
        rule_action_override {
          action_to_use {
            count {}
          }
          name = "SizeRestrictions_BODY"
        }
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }
  
  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }
  
  # Rate Limiting
  rule {
    name     = "RateLimit"
    priority = 3
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitMetric"
      sampled_requests_enabled   = true
    }
  }
  
  # Geo-blocking (optional)
  rule {
    name     = "GeoBlock"
    priority = 4
    
    action {
      block {}
    }
    
    statement {
      geo_match_statement {
        country_codes = ["KP", "IR", "SY"]  # Blocked countries
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlockMetric"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "mindmate-waf"
    sampled_requests_enabled   = true
  }
}
```

### Secrets Management

```hcl
resource "aws_secretsmanager_secret" "database_url" {
  name                    = "mindmate/database-url"
  description             = "Database connection string"
  kms_key_id             = aws_kms_key.secrets.arn
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id
  secret_string = jsonencode({
    username = "mindmate_admin"
    password = random_password.db_password.result
    host     = aws_db_instance.primary.address
    port     = 5432
    dbname   = "mindmate"
    url      = "postgresql://mindmate_admin:${random_password.db_password.result}@${aws_db_instance.primary.address}:5432/mindmate"
  })
}

# Automatic rotation
resource "aws_secretsmanager_secret_rotation" "database_url" {
  secret_id           = aws_secretsmanager_secret.database_url.id
  rotation_lambda_arn = aws_lambda_function.secrets_rotation.arn
  
  rotation_rules {
    automatically_after_days = 30
  }
}
```

### IAM Roles

```hcl
# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "mindmate-ecs-task-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "mindmate-ecs-task-execution-secrets"
  role = aws_iam_role.ecs_task_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.database_url.arn,
          aws_secretsmanager_secret.redis_url.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [aws_kms_key.secrets.arn]
      }
    ]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "mindmate-ecs-task-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecs_task" {
  name = "mindmate-ecs-task-policy"
  role = aws_iam_role.ecs_task.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.recordings.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage"
        ]
        Resource = aws_sqs_queue.jobs.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}
```

---

## 14. Disaster Recovery

### Backup Strategy

| Resource | Backup Method | Retention | Frequency |
|----------|--------------|-----------|-----------|
| **RDS** | Automated + Manual snapshots | 35 days | Daily |
| **S3** | Versioning + Cross-region replication | 90 days | Continuous |
| **ElastiCache** | Daily snapshots | 7 days | Daily |
| **ECS Task Definitions** | ECR image retention | 30 images | Per deployment |

### Cross-Region Replication

```hcl
# S3 Cross-Region Replication
resource "aws_s3_bucket_replication_configuration" "recordings" {
  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.recordings.id
  
  rule {
    id     = "replicate-to-dr"
    status = "Enabled"
    
    destination {
      bucket        = aws_s3_bucket.recordings_dr.arn
      storage_class = "STANDARD"
      
      replication_time {
        status  = "Enabled"
        minutes = 15
      }
      
      metrics {
        status  = "Enabled"
        minutes = 15
      }
    }
    
    delete_marker_replication {
      status = "Enabled"
    }
  }
}

# RDS Cross-Region Read Replica
resource "aws_db_instance_automated_backups_replication" "main" {
  source_db_instance_arn = aws_db_instance.primary.arn
  retention_period       = 14
  kms_key_id            = aws_kms_key.rds_replica.arn
}
```

### Disaster Recovery Runbook

```markdown
## Disaster Recovery Procedures

### Scenario 1: Primary Region Failure

1. **Detection**: CloudWatch alarms trigger
2. **Decision**: Declare disaster (within 15 minutes)
3. **Failover**:
   - Promote RDS read replica in DR region
   - Update Route 53 to point to DR ALB
   - Scale ECS services in DR region
4. **Recovery Time Objective (RTO)**: 30 minutes
5. **Recovery Point Objective (RPO)**: 5 minutes

### Scenario 2: Database Corruption

1. **Detection**: Data integrity checks fail
2. **Action**:
   - Restore from latest snapshot
   - Apply point-in-time recovery if needed
   - Verify data consistency
3. **RTO**: 1 hour
4. **RPO**: 5 minutes (with PITR)

### Scenario 3: Data Loss (S3)

1. **Detection**: Object versioning alerts
2. **Action**:
   - Restore from S3 versioning
   - If deleted, restore from cross-region replica
3. **RTO**: 15 minutes
4. **RPO**: 0 (versioning enabled)
```

---

## 15. Infrastructure as Code

### Terraform Project Structure

```
terraform/
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── ecs/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── rds/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── elasticache/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── s3/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── cloudfront/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── production/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── development/
│       ├── main.tf
│       ├── variables.tf
│       ├── terraform.tfvars
│       └── backend.tf
└── global/
    ├── iam/
    │   ├── main.tf
    │   └── variables.tf
    └── route53/
        ├── main.tf
        └── variables.tf
```

### Terraform Backend Configuration

```hcl
# environments/production/backend.tf
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "mindmate-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    kms_key_id     = "arn:aws:kms:us-east-1:ACCOUNT:key/KEY_ID"
    dynamodb_table = "mindmate-terraform-locks"
  }
}

provider "aws" {
  region = "us-east-1"
  
  default_tags {
    tags = {
      Environment = "production"
      Project     = "mindmate"
      ManagedBy   = "terraform"
    }
  }
}

provider "aws" {
  alias  = "us-west-2"
  region = "us-west-2"
}
```

### Environment Configuration

```hcl
# environments/production/main.tf
module "vpc" {
  source = "../../modules/vpc"
  
  environment = "production"
  vpc_cidr    = "10.0.0.0/16"
  
  availability_zones = ["us-east-1a", "us-east-1b"]
  
  public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs  = ["10.0.3.0/24", "10.0.4.0/24"]
  database_subnet_cidrs = ["10.0.5.0/24", "10.0.6.0/24"]
}

module "ecs" {
  source = "../../modules/ecs"
  
  environment = "production"
  cluster_name = "mindmate"
  
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
  
  api_task_cpu    = 1024
  api_task_memory = 2048
  api_desired_count = 2
  api_min_count     = 2
  api_max_count     = 20
  
  websocket_task_cpu    = 512
  websocket_task_memory = 1024
  websocket_desired_count = 2
  
  certificate_arn = module.acm.certificate_arn
}

module "rds" {
  source = "../../modules/rds"
  
  environment = "production"
  
  instance_class       = "db.r6g.xlarge"
  allocated_storage    = 100
  max_allocated_storage = 500
  
  multi_az               = true
  create_read_replica    = true
  read_replica_instance_class = "db.r6g.large"
  
  backup_retention_period = 35
  
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.database_subnet_ids
  ecs_security_group_id = module.ecs.security_group_id
}

module "elasticache" {
  source = "../../modules/elasticache"
  
  environment = "production"
  
  node_type            = "cache.r6g.large"
  num_node_groups      = 2
  replicas_per_node_group = 1
  
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.database_subnet_ids
  ecs_security_group_id = module.ecs.security_group_id
}

module "s3" {
  source = "../../modules/s3"
  
  environment = "production"
  
  enable_versioning = true
  enable_cross_region_replication = true
  destination_region = "us-west-2"
  
  lifecycle_transition_ia_days = 30
  lifecycle_transition_glacier_days = 90
}

module "cloudfront" {
  source = "../../modules/cloudfront"
  
  environment = "production"
  
  s3_bucket_domain_name = module.s3.static_bucket_domain_name
  s3_bucket_id         = module.s3.static_bucket_id
  
  alb_domain_name = module.ecs.alb_dns_name
  
  certificate_arn = module.acm.cloudfront_certificate_arn
  
  waf_acl_arn = module.waf.cloudfront_acl_arn
}
```

---

## Appendix A: Quick Reference

### AWS CLI Commands

```bash
# Deploy ECS service
aws ecs update-service --cluster mindmate --service mindmate-api --force-new-deployment

# View ECS logs
aws logs tail /ecs/mindmate-api --follow

# Connect to RDS
aws rds generate-db-auth-token --hostname HOST --port 5432 --region us-east-1 --username mindmate_admin

# Check Lambda metrics
aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Duration \
  --dimensions Name=FunctionName,Value=mindmate-job-processor \
  --start-time 2024-01-01T00:00:00Z --end-time 2024-01-02T00:00:00Z \
  --period 3600 --statistics Average
```

### Common Troubleshooting

| Issue | Command | Solution |
|-------|---------|----------|
| ECS task stuck | `aws ecs describe-tasks` | Check task definition, IAM roles |
| High RDS CPU | CloudWatch metrics | Add read replica, optimize queries |
| Lambda timeout | CloudWatch logs | Increase timeout or memory |
| 5xx errors | ALB access logs | Check application logs, scale ECS |
| Slow API | X-Ray traces | Check Redis cache hit rate |

---

## Document Information

| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Last Updated** | 2024 |
| **Author** | Agent 42 - DevOps & Infrastructure Architect |
| **Review Cycle** | Quarterly |
| **Next Review** | Q2 2024 |

---

*This document is confidential and proprietary to MindMate AI. Unauthorized distribution is prohibited.*
