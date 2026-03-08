# =============================================================================
# RDS Module - Outputs
# =============================================================================

output "database_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database_address" {
  description = "Address of the RDS instance"
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "database_port" {
  description = "Port of the RDS instance"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "Name of the database"
  value       = aws_db_instance.main.db_name
}

output "database_username" {
  description = "Username for the database"
  value       = aws_db_instance.main.username
}

output "database_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "database_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

output "db_subnet_group_arn" {
  description = "ARN of the DB subnet group"
  value       = aws_db_subnet_group.main.arn
}

output "security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.key_id
}
