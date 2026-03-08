# =============================================================================
# Route53 Module - Outputs
# =============================================================================

output "zone_id" {
  description = "ID of the Route53 hosted zone"
  value       = data.aws_route53_zone.main.zone_id
}

output "zone_name" {
  description = "Name of the Route53 hosted zone"
  value       = data.aws_route53_zone.main.name
}

output "api_record_fqdn" {
  description = "FQDN of the API DNS record"
  value       = aws_route53_record.api.fqdn
}

output "cdn_record_fqdn" {
  description = "FQDN of the CDN DNS record"
  value       = aws_route53_record.cdn.fqdn
}

output "app_record_fqdn" {
  description = "FQDN of the app DNS record"
  value       = aws_route53_record.app.fqdn
}

output "health_check_id" {
  description = "ID of the Route53 health check"
  value       = aws_route53_health_check.api.id
}

output "health_check_arn" {
  description = "ARN of the Route53 health check"
  value       = aws_route53_health_check.api.arn
}
