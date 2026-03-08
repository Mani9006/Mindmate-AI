# =============================================================================
# MindMate AI - Main Terraform Configuration
# Production-ready Infrastructure as Code for AWS Deployment
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "s3" {
    bucket         = "mindmate-ai-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "mindmate-ai-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "MindMate AI"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "Claude Code"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "MindMate AI"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "Claude Code"
    }
  }
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# =============================================================================
# Module: VPC and Networking
# =============================================================================

module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  project_name        = var.project_name
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  enable_nat_gateway  = var.enable_nat_gateway
  single_nat_gateway  = var.single_nat_gateway
}

# =============================================================================
# Module: IAM Roles and Policies
# =============================================================================

module "iam" {
  source = "./modules/iam"

  environment  = var.environment
  project_name = var.project_name
  account_id   = data.aws_caller_identity.current.account_id
  aws_region   = data.aws_region.current.name
}

# =============================================================================
# Module: Secrets Manager
# =============================================================================

module "secretsmanager" {
  source = "./modules/secretsmanager"

  environment  = var.environment
  project_name = var.project_name
}

# =============================================================================
# Module: S3 Buckets
# =============================================================================

module "s3" {
  source = "./modules/s3"

  environment  = var.environment
  project_name = var.project_name
  aws_region   = data.aws_region.current.name
}

# =============================================================================
# Module: RDS PostgreSQL
# =============================================================================

module "rds" {
  source = "./modules/rds"

  environment            = var.environment
  project_name           = var.project_name
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  database_name          = var.database_name
  database_username      = var.database_username
  database_password      = module.secretsmanager.db_password
  db_instance_class      = var.db_instance_class
  db_allocated_storage   = var.db_allocated_storage
  db_engine_version      = var.db_engine_version
  allowed_security_groups = [module.ecs.ecs_security_group_id]
}

# =============================================================================
# Module: ElastiCache Redis
# =============================================================================

module "elasticache" {
  source = "./modules/elasticache"

  environment            = var.environment
  project_name           = var.project_name
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  redis_node_type        = var.redis_node_type
  redis_num_cache_nodes  = var.redis_num_cache_nodes
  redis_engine_version   = var.redis_engine_version
  allowed_security_groups = [module.ecs.ecs_security_group_id]
}

# =============================================================================
# Module: ECS Cluster and Task Definitions
# =============================================================================

module "ecs" {
  source = "./modules/ecs"

  environment              = var.environment
  project_name             = var.project_name
  vpc_id                   = module.vpc.vpc_id
  public_subnet_ids        = module.vpc.public_subnet_ids
  private_subnet_ids       = module.vpc.private_subnet_ids
  ecs_task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  ecs_task_role_arn        = module.iam.ecs_task_role_arn
  ecs_service_role_arn     = module.iam.ecs_service_role_arn
  
  # Service configurations
  api_service_desired_count    = var.api_service_desired_count
  api_service_cpu              = var.api_service_cpu
  api_service_memory           = var.api_service_memory
  worker_service_desired_count = var.worker_service_desired_count
  worker_service_cpu           = var.worker_service_cpu
  worker_service_memory        = var.worker_service_memory
  
  # Database and Redis connections
  database_host     = module.rds.database_endpoint
  database_name     = var.database_name
  database_username = var.database_username
  database_password = module.secretsmanager.db_password
  redis_host        = module.elasticache.redis_endpoint
  
  # Secrets
  secrets_arn       = module.secretsmanager.secrets_arn
  
  # S3 buckets
  recordings_bucket = module.s3.recordings_bucket_name
  assets_bucket     = module.s3.assets_bucket_name
  
  # Container images
  api_container_image    = var.api_container_image
  worker_container_image = var.worker_container_image
  
  # Domain
  domain_name = var.domain_name
}

# =============================================================================
# Module: ACM SSL Certificates
# =============================================================================

module "acm" {
  source = "./modules/acm"
  providers = {
    aws = aws.us_east_1
  }

  environment  = var.environment
  project_name = var.project_name
  domain_name  = var.domain_name
  subdomain_api = var.subdomain_api
}

# =============================================================================
# Module: CloudFront Distribution
# =============================================================================

module "cloudfront" {
  source = "./modules/cloudfront"

  environment        = var.environment
  project_name       = var.project_name
  domain_name        = var.domain_name
  subdomain_api      = var.subdomain_api
  subdomain_cdn      = var.subdomain_cdn
  assets_bucket_name = module.s3.assets_bucket_name
  assets_bucket_regional_domain = module.s3.assets_bucket_regional_domain
  alb_dns_name       = module.ecs.alb_dns_name
  certificate_arn    = module.acm.certificate_arn
}

# =============================================================================
# Module: Route53 DNS
# =============================================================================

module "route53" {
  source = "./modules/route53"

  environment                  = var.environment
  project_name                 = var.project_name
  domain_name                  = var.domain_name
  subdomain_api                = var.subdomain_api
  subdomain_cdn                = var.subdomain_cdn
  cloudfront_distribution_domain = module.cloudfront.cloudfront_domain_name
  cloudfront_distribution_zone_id = module.cloudfront.cloudfront_hosted_zone_id
  alb_dns_name                 = module.ecs.alb_dns_name
  alb_zone_id                  = module.ecs.alb_zone_id
}
