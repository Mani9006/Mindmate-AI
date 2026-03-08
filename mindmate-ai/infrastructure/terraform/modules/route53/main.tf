# =============================================================================
# Route53 Module - DNS Configuration
# =============================================================================

# -----------------------------------------------------------------------------
# Data Source for Hosted Zone
# -----------------------------------------------------------------------------

data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# -----------------------------------------------------------------------------
# API Record (A Record -> ALB)
# -----------------------------------------------------------------------------

resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.subdomain_api
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# -----------------------------------------------------------------------------
# CDN Record (A Record -> CloudFront)
# -----------------------------------------------------------------------------

resource "aws_route53_record" "cdn" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.subdomain_cdn
  type    = "A"

  alias {
    name                   = var.cloudfront_distribution_domain
    zone_id                = var.cloudfront_distribution_zone_id
    evaluate_target_health = false
  }
}

# -----------------------------------------------------------------------------
# Health Check for API
# -----------------------------------------------------------------------------

resource "aws_route53_health_check" "api" {
  fqdn              = "${var.subdomain_api}.${var.domain_name}"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name        = "${var.project_name}-${var.environment}-api-health-check"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# SPF Record (for email)
# -----------------------------------------------------------------------------

resource "aws_route53_record" "spf" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = 300

  records = [
    "v=spf1 include:_spf.google.com include:sendgrid.net include:mailgun.org ~all"
  ]
}

# -----------------------------------------------------------------------------
# DMARC Record
# -----------------------------------------------------------------------------

resource "aws_route53_record" "dmarc" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "_dmarc"
  type    = "TXT"
  ttl     = 300

  records = [
    "v=DMARC1; p=quarantine; rua=mailto:dmarc@${var.domain_name}; ruf=mailto:dmarc@${var.domain_name}; fo=1"
  ]
}

# -----------------------------------------------------------------------------
# DKIM Records (Placeholder - update with actual values)
# -----------------------------------------------------------------------------

# resource "aws_route53_record" "dkim_sendgrid" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = "s1._domainkey"
#   type    = "CNAME"
#   ttl     = 300
#   records = ["s1.domainkey.u123456.wl123.sendgrid.net"]
# }

# -----------------------------------------------------------------------------
# MX Records (for email)
# -----------------------------------------------------------------------------

resource "aws_route53_record" "mx" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = 300

  records = [
    "1 ASPMX.L.GOOGLE.COM.",
    "5 ALT1.ASPMX.L.GOOGLE.COM.",
    "5 ALT2.ASPMX.L.GOOGLE.COM.",
    "10 ALT3.ASPMX.L.GOOGLE.COM.",
    "10 ALT4.ASPMX.L.GOOGLE.COM."
  ]
}

# -----------------------------------------------------------------------------
# Google Site Verification
# -----------------------------------------------------------------------------

resource "aws_route53_record" "google_verification" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = 300

  records = [
    "google-site-verification=PLACEHOLDER_UPDATE_WITH_ACTUAL_VALUE"
  ]
}

# -----------------------------------------------------------------------------
# CAA Records (Certificate Authority Authorization)
# -----------------------------------------------------------------------------

resource "aws_route53_record" "caa" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "CAA"
  ttl     = 300

  records = [
    "0 issue \"amazon.com\"",
    "0 issue \"amazontrust.com\"",
    "0 issue \"awstrust.com\"",
    "0 issue \"amazonaws.com\"",
    "0 issuewild \"amazon.com\"",
    "0 issuewild \"amazontrust.com\"",
    "0 issuewild \"awstrust.com\"",
    "0 issuewild \"amazonaws.com\"",
    "0 iodef \"mailto:security@${var.domain_name}\""
  ]
}

# -----------------------------------------------------------------------------
# App Subdomain (for frontend)
# -----------------------------------------------------------------------------

resource "aws_route53_record" "app" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "app"
  type    = "A"

  alias {
    name                   = var.cloudfront_distribution_domain
    zone_id                = var.cloudfront_distribution_zone_id
    evaluate_target_health = false
  }
}

# -----------------------------------------------------------------------------
# WWW Redirect
# -----------------------------------------------------------------------------

resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www"
  type    = "CNAME"
  ttl     = 300

  records = [var.domain_name]
}

# -----------------------------------------------------------------------------
# Status Page (using external service like Statuspage)
# -----------------------------------------------------------------------------

resource "aws_route53_record" "status" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "status"
  type    = "CNAME"
  ttl     = 300

  records = ["PLACEHOLDER.statuspage.io"]
}
