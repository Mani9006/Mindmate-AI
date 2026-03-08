# =============================================================================
# MindMate AI - Terraform Variables
# =============================================================================

# -----------------------------------------------------------------------------
# General Configuration
# -----------------------------------------------------------------------------

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "mindmate-ai"
}

# -----------------------------------------------------------------------------
# Domain Configuration
# -----------------------------------------------------------------------------

variable "domain_name" {
  description = "Root domain name for the application"
  type        = string
  default     = "mindmate.ai"
}

variable "subdomain_api" {
  description = "Subdomain for API"
  type        = string
  default     = "api"
}

variable "subdomain_cdn" {
  description = "Subdomain for CDN/assets"
  type        = string
  default     = "cdn"
}

# -----------------------------------------------------------------------------
# VPC Configuration
# -----------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway (cost saving for non-prod)"
  type        = bool
  default     = false
}

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------

variable "database_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "mindmate"
}

variable "database_username" {
  description = "Username for PostgreSQL database"
  type        = string
  default     = "mindmate_admin"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

# -----------------------------------------------------------------------------
# ElastiCache Redis Configuration
# -----------------------------------------------------------------------------

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 1
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

# -----------------------------------------------------------------------------
# ECS Service Configuration
# -----------------------------------------------------------------------------

variable "api_service_desired_count" {
  description = "Desired number of API service tasks"
  type        = number
  default     = 2
}

variable "api_service_cpu" {
  description = "CPU units for API service task"
  type        = number
  default     = 512
}

variable "api_service_memory" {
  description = "Memory for API service task in MiB"
  type        = number
  default     = 1024
}

variable "worker_service_desired_count" {
  description = "Desired number of worker service tasks"
  type        = number
  default     = 2
}

variable "worker_service_cpu" {
  description = "CPU units for worker service task"
  type        = number
  default     = 256
}

variable "worker_service_memory" {
  description = "Memory for worker service task in MiB"
  type        = number
  default     = 512
}

# -----------------------------------------------------------------------------
# Container Images
# -----------------------------------------------------------------------------

variable "api_container_image" {
  description = "Docker image for API service"
  type        = string
  default     = "mindmate-ai/api:latest"
}

variable "worker_container_image" {
  description = "Docker image for worker service"
  type        = string
  default     = "mindmate-ai/worker:latest"
}
