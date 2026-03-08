# =============================================================================
# MindMate AI - Terraform Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# VPC Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnet_ids
}

# -----------------------------------------------------------------------------
# Database Outputs
# -----------------------------------------------------------------------------

output "database_endpoint" {
  description = "Endpoint of the RDS PostgreSQL instance"
  value       = module.rds.database_endpoint
  sensitive   = true
}

output "database_port" {
  description = "Port of the RDS PostgreSQL instance"
  value       = module.rds.database_port
}

output "database_name" {
  description = "Name of the database"
  value       = var.database_name
}

output "database_username" {
  description = "Username for the database"
  value       = var.database_username
}

# -----------------------------------------------------------------------------
# ElastiCache Outputs
# -----------------------------------------------------------------------------

output "redis_endpoint" {
  description = "Endpoint of the ElastiCache Redis cluster"
  value       = module.elasticache.redis_endpoint
  sensitive   = true
}

output "redis_port" {
  description = "Port of the ElastiCache Redis cluster"
  value       = module.elasticache.redis_port
}

# -----------------------------------------------------------------------------
# ECS Outputs
# -----------------------------------------------------------------------------

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = module.ecs.cluster_arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.ecs.alb_dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.ecs.alb_arn
}

# -----------------------------------------------------------------------------
# S3 Outputs
# -----------------------------------------------------------------------------

output "recordings_bucket_name" {
  description = "Name of the S3 bucket for recordings"
  value       = module.s3.recordings_bucket_name
}

output "recordings_bucket_arn" {
  description = "ARN of the S3 bucket for recordings"
  value       = module.s3.recordings_bucket_arn
}

output "assets_bucket_name" {
  description = "Name of the S3 bucket for assets"
  value       = module.s3.assets_bucket_name
}

output "assets_bucket_arn" {
  description = "ARN of the S3 bucket for assets"
  value       = module.s3.assets_bucket_arn
}

# -----------------------------------------------------------------------------
# CloudFront Outputs
# -----------------------------------------------------------------------------

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = module.cloudfront.cloudfront_domain_name
}

# -----------------------------------------------------------------------------
# Route53 Outputs
# -----------------------------------------------------------------------------

output "api_domain" {
  description = "Full API domain name"
  value       = "${var.subdomain_api}.${var.domain_name}"
}

output "cdn_domain" {
  description = "Full CDN domain name"
  value       = "${var.subdomain_cdn}.${var.domain_name}"
}

# -----------------------------------------------------------------------------
# Secrets Manager Outputs
# -----------------------------------------------------------------------------

output "secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = module.secretsmanager.secrets_arn
}

# -----------------------------------------------------------------------------
# IAM Outputs
# -----------------------------------------------------------------------------

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = module.iam.ecs_task_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = module.iam.ecs_task_role_arn
}
