# =============================================================================
# CloudFront Module - Variables
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

variable "subdomain_cdn" {
  description = "CDN subdomain"
  type        = string
  default     = "cdn"
}

variable "assets_bucket_name" {
  description = "Name of the assets S3 bucket"
  type        = string
}

variable "assets_bucket_regional_domain" {
  description = "Regional domain name of the assets bucket"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate"
  type        = string
}
