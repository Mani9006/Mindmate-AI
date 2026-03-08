# =============================================================================
# IAM Module - Outputs
# =============================================================================

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_execution_role_name" {
  description = "Name of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.name
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "ecs_task_role_name" {
  description = "Name of the ECS task role"
  value       = aws_iam_role.ecs_task.name
}

output "ecs_service_role_arn" {
  description = "ARN of the ECS service role"
  value       = aws_iam_role.ecs_service.arn
}

output "ecs_service_role_name" {
  description = "Name of the ECS service role"
  value       = aws_iam_role.ecs_service.name
}

output "codebuild_role_arn" {
  description = "ARN of the CodeBuild role"
  value       = aws_iam_role.codebuild.arn
}

output "codebuild_role_name" {
  description = "Name of the CodeBuild role"
  value       = aws_iam_role.codebuild.name
}

output "codepipeline_role_arn" {
  description = "ARN of the CodePipeline role"
  value       = aws_iam_role.codepipeline.arn
}

output "codepipeline_role_name" {
  description = "Name of the CodePipeline role"
  value       = aws_iam_role.codepipeline.name
}

output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.arn
}

output "lambda_execution_role_name" {
  description = "Name of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.name
}

output "eventbridge_role_arn" {
  description = "ARN of the EventBridge role"
  value       = aws_iam_role.eventbridge.arn
}

output "eventbridge_role_name" {
  description = "Name of the EventBridge role"
  value       = aws_iam_role.eventbridge.name
}
