# =============================================================================
# Route53 Module - Variables
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

variable "cloudfront_distribution_domain" {
  description = "Domain name of the CloudFront distribution"
  type        = string
}

variable "cloudfront_distribution_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  type        = string
}

variable "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  type        = string
}
