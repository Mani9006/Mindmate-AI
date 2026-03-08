# =============================================================================
# S3 Module - Outputs
# =============================================================================

output "recordings_bucket_name" {
  description = "Name of the recordings S3 bucket"
  value       = aws_s3_bucket.recordings.id
}

output "recordings_bucket_arn" {
  description = "ARN of the recordings S3 bucket"
  value       = aws_s3_bucket.recordings.arn
}

output "recordings_bucket_regional_domain" {
  description = "Regional domain name of the recordings bucket"
  value       = aws_s3_bucket.recordings.bucket_regional_domain_name
}

output "assets_bucket_name" {
  description = "Name of the assets S3 bucket"
  value       = aws_s3_bucket.assets.id
}

output "assets_bucket_arn" {
  description = "ARN of the assets S3 bucket"
  value       = aws_s3_bucket.assets.arn
}

output "assets_bucket_regional_domain" {
  description = "Regional domain name of the assets bucket"
  value       = aws_s3_bucket.assets.bucket_regional_domain_name
}

output "logs_bucket_name" {
  description = "Name of the logs S3 bucket"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "ARN of the logs S3 bucket"
  value       = aws_s3_bucket.logs.arn
}

output "backups_bucket_name" {
  description = "Name of the backups S3 bucket"
  value       = aws_s3_bucket.backups.id
}

output "backups_bucket_arn" {
  description = "ARN of the backups S3 bucket"
  value       = aws_s3_bucket.backups.arn
}

output "terraform_state_bucket_name" {
  description = "Name of the Terraform state S3 bucket"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_state_bucket_arn" {
  description = "ARN of the Terraform state S3 bucket"
  value       = aws_s3_bucket.terraform_state.arn
}

output "cloudfront_oai_arn" {
  description = "ARN of the CloudFront Origin Access Identity"
  value       = aws_cloudfront_origin_access_identity.assets.iam_arn
}

output "cloudfront_oai_id" {
  description = "ID of the CloudFront Origin Access Identity"
  value       = aws_cloudfront_origin_access_identity.assets.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for S3 encryption"
  value       = aws_kms_key.s3.key_id
}
