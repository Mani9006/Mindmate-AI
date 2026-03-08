# =============================================================================
# ACM Module - Variables
# =============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "domain_name" {
  description = "Root domain name"
  type        = string
}

variable "subdomain_api" {
  description = "API subdomain"
  type        = string
  default     = "api"
}
