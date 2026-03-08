# =============================================================================
# Secrets Manager Module - Outputs
# =============================================================================

output "secrets_arn" {
  description = "ARN of the main application secrets"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "secrets_name" {
  description = "Name of the main application secrets"
  value       = aws_secretsmanager_secret.app_secrets.name
}

output "db_password" {
  description = "Database password (sensitive)"
  value       = random_password.db_password.result
  sensitive   = true
}

output "db_credentials_arn" {
  description = "ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "db_credentials_name" {
  description = "Name of the database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "redis_credentials_arn" {
  description = "ARN of the Redis credentials secret"
  value       = aws_secretsmanager_secret.redis_credentials.arn
}

output "redis_credentials_name" {
  description = "Name of the Redis credentials secret"
  value       = aws_secretsmanager_secret.redis_credentials.name
}

output "third_party_services_arn" {
  description = "ARN of the third-party services secret"
  value       = aws_secretsmanager_secret.third_party_services.arn
}

output "third_party_services_name" {
  description = "Name of the third-party services secret"
  value       = aws_secretsmanager_secret.third_party_services.name
}

output "jwt_secret" {
  description = "JWT secret (sensitive)"
  value       = random_password.jwt_secret.result
  sensitive   = true
}

output "api_key" {
  description = "API key (sensitive)"
  value       = random_password.api_key.result
  sensitive   = true
}

output "encryption_key" {
  description = "Encryption key (sensitive)"
  value       = random_password.encryption_key.result
  sensitive   = true
}
