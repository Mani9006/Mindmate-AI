# =============================================================================
# ACM Module - SSL Certificates
# =============================================================================

# -----------------------------------------------------------------------------
# Wildcard Certificate
# -----------------------------------------------------------------------------

resource "aws_acm_certificate" "main" {
  domain_name               = "${var.subdomain_api}.${var.domain_name}"
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-certificate"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# Route53 Validation Records
# -----------------------------------------------------------------------------

resource "aws_route53_record" "validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# -----------------------------------------------------------------------------
# Certificate Validation
# -----------------------------------------------------------------------------

resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.validation : record.fqdn]
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}
