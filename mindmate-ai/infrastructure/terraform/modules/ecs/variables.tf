# =============================================================================
# ECS Module - Variables
# =============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs of public subnets"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "IDs of private subnets"
  type        = list(string)
}

variable "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  type        = string
}

variable "ecs_service_role_arn" {
  description = "ARN of the ECS service role"
  type        = string
}

# Service configurations
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

# Database and Redis connections
variable "database_host" {
  description = "Database host"
  type        = string
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "database_username" {
  description = "Database username"
  type        = string
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "redis_host" {
  description = "Redis host"
  type        = string
}

# Secrets
variable "secrets_arn" {
  description = "ARN of the Secrets Manager secret"
  type        = string
}

# S3 buckets
variable "recordings_bucket" {
  description = "Name of the recordings S3 bucket"
  type        = string
}

variable "assets_bucket" {
  description = "Name of the assets S3 bucket"
  type        = string
}

# Container images
variable "api_container_image" {
  description = "Docker image for API service"
  type        = string
}

variable "worker_container_image" {
  description = "Docker image for worker service"
  type        = string
}

# Domain
variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "subdomain_api" {
  description = "API subdomain"
  type        = string
  default     = "api"
}
