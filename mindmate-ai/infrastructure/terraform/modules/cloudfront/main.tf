# =============================================================================
# CloudFront Module - CDN Distribution
# =============================================================================

# -----------------------------------------------------------------------------
# CloudFront Distribution
# -----------------------------------------------------------------------------

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} ${var.environment} CDN"
  default_root_object = "index.html"
  price_class         = var.environment == "production" ? "PriceClass_All" : "PriceClass_100"
  aliases             = ["${var.subdomain_cdn}.${var.domain_name}"]

  # Origin for S3 Assets Bucket
  origin {
    domain_name = var.assets_bucket_regional_domain
    origin_id   = "S3-${var.assets_bucket_name}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  # Origin for API (ALB)
  origin {
    domain_name = var.alb_dns_name
    origin_id   = "ALB-${var.project_name}-${var.environment}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "X-Origin-Verify"
      value = random_password.origin_verify.result
    }
  }

  # Default cache behavior for S3 assets
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.assets_bucket_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400    # 1 day
    max_ttl                = 31536000 # 1 year
    compress               = true

    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.security_headers.qualified_arn
      include_body = false
    }
  }

  # Cache behavior for API
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-${var.project_name}-${var.environment}"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }

  # Cache behavior for static assets with long cache
  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.assets_bucket_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 604800    # 7 days
    max_ttl                = 31536000  # 1 year
    compress               = true
  }

  # Cache behavior for uploads
  ordered_cache_behavior {
    path_pattern     = "/uploads/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.assets_bucket_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400    # 1 day
    max_ttl                = 604800   # 7 days
    compress               = true
  }

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL Certificate
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Logging
  logging_config {
    include_cookies = false
    bucket          = "${var.project_name}-${var.environment}-logs-${data.aws_caller_identity.current.account_id}.s3.amazonaws.com"
    prefix          = "cloudfront-logs/"
  }

  # Web Application Firewall
  web_acl_id = var.environment == "production" ? aws_wafv2_web_acl.cloudfront[0].arn : null

  tags = {
    Name        = "${var.project_name}-${var.environment}-cdn"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# Origin Access Identity
# -----------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "OAI for ${var.project_name} ${var.environment}"
}

# -----------------------------------------------------------------------------
# Security Headers Lambda@Edge
# -----------------------------------------------------------------------------

resource "aws_lambda_function" "security_headers" {
  provider = aws.us_east_1

  function_name = "${var.project_name}-${var.environment}-security-headers"
  role          = aws_iam_role.lambda_edge.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  publish       = true
  timeout       = 5
  memory_size   = 128

  filename         = data.archive_file.security_headers_lambda.output_path
  source_code_hash = data.archive_file.security_headers_lambda.output_base64sha256

  tags = {
    Name        = "${var.project_name}-${var.environment}-security-headers"
    Environment = var.environment
  }
}

resource "aws_iam_role" "lambda_edge" {
  name = "${var.project_name}-${var.environment}-lambda-edge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-edge-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "lambda_edge_basic" {
  role       = aws_iam_role.lambda_edge.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "archive_file" "security_headers_lambda" {
  type        = "zip"
  output_path = "${path.module}/security_headers_lambda.zip"

  source {
    content  = <<-EOF
      exports.handler = async (event) => {
        const response = event.Records[0].cf.response;
        const headers = response.headers;
        
        // Security Headers
        headers['strict-transport-security'] = [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubdomains; preload' }];
        headers['content-security-policy'] = [{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; media-src 'self' https:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" }];
        headers['x-content-type-options'] = [{ key: 'X-Content-Type-Options', value: 'nosniff' }];
        headers['x-frame-options'] = [{ key: 'X-Frame-Options', value: 'DENY' }];
        headers['x-xss-protection'] = [{ key: 'X-XSS-Protection', value: '1; mode=block' }];
        headers['referrer-policy'] = [{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }];
        headers['permissions-policy'] = [{ key: 'Permissions-Policy', value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()' }];
        
        return response;
      };
    EOF
    filename = "index.js"
  }
}

# -----------------------------------------------------------------------------
# WAF Web ACL (Production Only)
# -----------------------------------------------------------------------------

resource "aws_wafv2_web_acl" "cloudfront" {
  count = var.environment == "production" ? 1 : 0

  provider = aws.us_east_1

  name        = "${var.project_name}-${var.environment}-waf"
  description = "WAF rules for ${var.project_name} ${var.environment}"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # AWS Managed Rules - Common Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - SQL Injection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rate Limiting
  rule {
    name     = "RateLimitRule"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-${var.environment}-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-waf"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# Random Password for Origin Verification
# -----------------------------------------------------------------------------

resource "random_password" "origin_verify" {
  length  = 32
  special = false
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}
