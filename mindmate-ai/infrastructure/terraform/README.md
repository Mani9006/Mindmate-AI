# MindMate AI - Terraform Infrastructure

Production-ready Infrastructure as Code (IaC) for deploying MindMate AI on AWS.

## Overview

This Terraform configuration provisions a complete, scalable, and secure AWS infrastructure for the MindMate AI platform.

## Architecture Diagram

```
                                    ┌─────────────────────────────────────┐
                                    │           Internet                  │
                                    └──────────────┬──────────────────────┘
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              Route 53 (DNS)                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  api.*      │  │  cdn.*      │  │  app.*      │  │  www.*      │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         CloudFront CDN (HTTPS/WAF)                                │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  • Static Assets (S3)                                                       │ │
│  │  • API Requests (ALB)                                                       │ │
│  │  • Security Headers (Lambda@Edge)                                           │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
          │
          ├──────────────────────────────────────┐
          │                                      │
          ▼                                      ▼
┌─────────────────────────────┐    ┌─────────────────────────────────────────────┐
│      S3 Assets Bucket       │    │         Application Load Balancer           │
│  ┌───────────────────────┐  │    │  ┌─────────────────────────────────────┐   │
│  │  • Static Assets      │  │    │  │  • HTTPS Listener                   │   │
│  │  • User Uploads       │  │    │  │  • Health Checks                    │   │
│  │  • Documents          │  │    │  │  • Target Groups                    │   │
│  └───────────────────────┘  │    │  └─────────────────────────────────────┘   │
└─────────────────────────────┘    └─────────────────────┬───────────────────────┘
                                                         │
                                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              ECS Fargate Cluster                                  │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐             │
│  │      API Service            │    │      Worker Service         │             │
│  │  ┌───────────────────────┐  │    │  ┌───────────────────────┐  │             │
│  │  │  • REST API           │  │    │  │  • Background Jobs    │  │             │
│  │  │  • WebSocket          │  │    │  │  • Queue Processing   │  │             │
│  │  │  • Authentication     │  │    │  │  • Scheduled Tasks    │  │             │
│  │  │  • Auto Scaling       │  │    │  │  • Auto Scaling       │  │             │
│  │  └───────────────────────┘  │    │  └───────────────────────┘  │             │
│  └─────────────────────────────┘    └─────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────────────────┘
          │
          ├───────────────────────────────────────────────────────────────────────┐
          │                                                                       │
          ▼                                                                       ▼
┌─────────────────────────────────────────┐    ┌─────────────────────────────────┐
│      RDS PostgreSQL (Multi-AZ)          │    │   ElastiCache Redis Cluster     │
│  ┌─────────────────────────────────┐    │    │  ┌───────────────────────────┐  │
│  │  • Primary Instance             │    │    │  │  • Session Store          │  │
│  │  • Standby (Multi-AZ)           │    │    │  │  • Cache Layer            │  │
│  │  • Automated Backups            │    │    │  │  • Rate Limiting          │  │
│  │  • Encryption at Rest           │    │    │  │  • Pub/Sub                │  │
│  │  • Performance Insights         │    │    │  │  • Encryption             │  │
│  └─────────────────────────────────┘    │    │  └───────────────────────────┘  │
└─────────────────────────────────────────┘    └─────────────────────────────────┘
```

## Infrastructure Components

### 1. VPC and Networking (`modules/vpc/`)

- **VPC**: Custom VPC with configurable CIDR block
- **Subnets**: 
  - Public subnets (3 AZs) for ALB and NAT Gateways
  - Private subnets (3 AZs) for ECS tasks, RDS, and ElastiCache
- **NAT Gateways**: For outbound internet from private subnets
- **VPC Endpoints**: Private connectivity to AWS services (S3, ECR, CloudWatch, Secrets Manager)
- **VPC Flow Logs**: Network traffic logging for security analysis

### 2. ECS Cluster (`modules/ecs/`)

- **ECS Cluster**: Fargate-based container orchestration
- **Services**:
  - **API Service**: REST API with auto-scaling (CPU/Memory based)
  - **Worker Service**: Background job processing with auto-scaling
- **Application Load Balancer**: HTTPS with SSL termination
- **Target Groups**: Health-checked routing
- **Auto Scaling**: Target tracking based on CPU and memory utilization

### 3. RDS PostgreSQL (`modules/rds/`)

- **Instance**: PostgreSQL 15.4 on db.t3.medium (configurable)
- **Multi-AZ**: Enabled for production
- **Encryption**: KMS-encrypted at rest
- **Backups**: Automated with 35-day retention (production)
- **Monitoring**: Enhanced monitoring and Performance Insights
- **CloudWatch Alarms**: CPU, storage, and connection monitoring

### 4. ElastiCache Redis (`modules/elasticache/`)

- **Engine**: Redis 7.0
- **Encryption**: At-rest and in-transit encryption
- **Auth Token**: Secure password authentication
- **Multi-AZ**: Enabled for production
- **CloudWatch Alarms**: CPU, memory, connections, and evictions

### 5. S3 Buckets (`modules/s3/`)

- **Recordings Bucket**: Audio/video recordings with lifecycle policies
- **Assets Bucket**: Static assets with CloudFront integration
- **Logs Bucket**: Application and access logs
- **Backups Bucket**: Database and configuration backups
- **Terraform State Bucket**: Remote state management
- **Encryption**: KMS-encrypted buckets

### 6. CloudFront Distribution (`modules/cloudfront/`)

- **Origins**:
  - S3 bucket for static assets
  - ALB for API requests
- **Cache Behaviors**: Optimized caching for different content types
- **Security Headers**: Lambda@Edge for security headers
- **WAF**: Web Application Firewall (production)
- **SSL/TLS**: TLS 1.2+ with ACM certificates

### 7. Route53 DNS (`modules/route53/`)

- **A Records**: api.*, cdn.*, app.* pointing to appropriate resources
- **Health Checks**: API endpoint monitoring
- **Email Records**: SPF, DMARC, MX for email delivery
- **CAA Records**: Certificate Authority Authorization

### 8. ACM SSL Certificates (`modules/acm/`)

- **Wildcard Certificate**: *.mindmate.ai
- **Validation**: DNS validation via Route53
- **Deployment**: US-East-1 for CloudFront compatibility

### 9. IAM Roles and Policies (`modules/iam/`)

- **ECS Task Execution Role**: For pulling images and writing logs
- **ECS Task Role**: For application AWS API access
- **ECS Service Role**: For service management
- **CodeBuild/CodePipeline Roles**: For CI/CD
- **Lambda Execution Role**: For background functions
- **EventBridge Role**: For scheduled tasks

### 10. Secrets Manager (`modules/secretsmanager/`)

- **Application Secrets**: Database passwords, JWT secrets, API keys
- **Database Credentials**: RDS credentials
- **Third-Party Services**: External API keys
- **Rotation**: Automatic password rotation (production)

## File Structure

```
terraform/
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── README.md                  # This file
├── modules/
│   ├── vpc/                   # VPC and networking
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── ecs/                   # ECS cluster and services
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── rds/                   # RDS PostgreSQL
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── elasticache/           # ElastiCache Redis
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── s3/                    # S3 buckets
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── cloudfront/            # CloudFront CDN
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── route53/               # Route53 DNS
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── acm/                   # ACM SSL certificates
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── iam/                   # IAM roles and policies
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── secretsmanager/        # Secrets Manager
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    ├── production.tfvars      # Production variables
    ├── staging.tfvars         # Staging variables
    └── dev.tfvars             # Development variables
```

## Usage

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.5.0 installed
3. Domain registered in Route53

### Initial Setup

1. **Create S3 bucket for Terraform state**:
```bash
aws s3 mb s3://mindmate-ai-terraform-state --region us-east-1
aws s3api put-bucket-versioning --bucket mindmate-ai-terraform-state --versioning-configuration Status=Enabled
```

2. **Create DynamoDB table for state locking**:
```bash
aws dynamodb create-table \
  --table-name mindmate-ai-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### Deployment

1. **Initialize Terraform**:
```bash
terraform init
```

2. **Plan changes**:
```bash
terraform plan -var-file="environments/production.tfvars"
```

3. **Apply changes**:
```bash
terraform apply -var-file="environments/production.tfvars"
```

4. **Destroy infrastructure** (use with caution):
```bash
terraform destroy -var-file="environments/production.tfvars"
```

## Environment Variables

Create environment-specific variable files in `environments/`:

### production.tfvars
```hcl
environment = "production"
aws_region  = "us-east-1"
domain_name = "mindmate.ai"

# VPC
vpc_cidr            = "10.0.0.0/16"
availability_zones  = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]

# Database
db_instance_class    = "db.t3.medium"
db_allocated_storage = 100

# ECS
api_service_desired_count    = 3
api_service_cpu              = 1024
api_service_memory           = 2048
worker_service_desired_count = 2
worker_service_cpu           = 512
worker_service_memory        = 1024

# Container Images
api_container_image    = "123456789012.dkr.ecr.us-east-1.amazonaws.com/mindmate-ai/api:v1.0.0"
worker_container_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/mindmate-ai/worker:v1.0.0"
```

## Security Features

- **Encryption at Rest**: KMS encryption for RDS, ElastiCache, and S3
- **Encryption in Transit**: TLS 1.2+ for all connections
- **Private Subnets**: Database and cache in private subnets
- **Security Groups**: Least-privilege access between services
- **WAF**: AWS WAF with managed rule sets (production)
- **Security Headers**: Lambda@Edge for HTTP security headers
- **Secrets Management**: AWS Secrets Manager for all credentials
- **IAM Roles**: Service-specific roles with minimal permissions
- **VPC Flow Logs**: Network traffic monitoring

## Monitoring and Logging

- **CloudWatch Logs**: Container logs with configurable retention
- **CloudWatch Alarms**: Resource utilization alerts
- **CloudWatch Metrics**: Performance monitoring
- **VPC Flow Logs**: Network traffic analysis
- **RDS Performance Insights**: Database query analysis

## Cost Optimization

- **Fargate Spot**: Consider using Fargate Spot for non-critical workloads
- **Reserved Instances**: Purchase RDS reserved instances for production
- **S3 Lifecycle**: Automatic transition to cheaper storage classes
- **NAT Gateway**: Single NAT Gateway for non-production environments

## Troubleshooting

### Common Issues

1. **Certificate validation fails**: Ensure Route53 hosted zone exists
2. **ECS tasks fail to start**: Check IAM roles and security groups
3. **Database connection fails**: Verify security group rules
4. **CloudFront 502 error**: Check ALB health checks

### Useful Commands

```bash
# View ECS service events
aws ecs describe-services --cluster mindmate-ai-production-cluster --services mindmate-ai-production-api

# View CloudWatch logs
aws logs tail /ecs/mindmate-ai-production/api --follow

# Check RDS instance status
aws rds describe-db-instances --db-instance-identifier mindmate-ai-production-db

# Test ALB health
curl -k https://<alb-dns-name>/health
```

## Contributing

1. Create a feature branch
2. Make changes to Terraform files
3. Run `terraform fmt` and `terraform validate`
4. Test in development environment
5. Submit pull request

## License

Copyright (c) 2024 MindMate AI. All rights reserved.
