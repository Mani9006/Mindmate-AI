# =============================================================================
# Secrets Manager Module - Secure Environment Variables
# =============================================================================

# -----------------------------------------------------------------------------
# Generate Random Passwords
# -----------------------------------------------------------------------------

resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "random_password" "api_key" {
  length  = 48
  special = false
}

resource "random_password" "encryption_key" {
  length  = 32
  special = false
}

# -----------------------------------------------------------------------------
# Main Application Secrets
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.project_name}/${var.environment}/app-secrets"
  description             = "Application secrets for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-secrets"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    # Database
    DB_PASSWORD = random_password.db_password.result

    # JWT
    JWT_SECRET           = random_password.jwt_secret.result
    JWT_REFRESH_SECRET   = random_password.jwt_secret.result
    JWT_ACCESS_EXPIRY    = "15m"
    JWT_REFRESH_EXPIRY   = "7d"

    # API Keys
    API_KEY = random_password.api_key.result

    # Encryption
    ENCRYPTION_KEY = random_password.encryption_key.result

    # External Services (placeholder - update manually)
    OPENAI_API_KEY        = ""
    ANTHROPIC_API_KEY     = ""
    STRIPE_SECRET_KEY     = ""
    STRIPE_WEBHOOK_SECRET = ""
    SENDGRID_API_KEY      = ""
    TWILIO_ACCOUNT_SID    = ""
    TWILIO_AUTH_TOKEN     = ""
    TWILIO_PHONE_NUMBER   = ""

    # OAuth (placeholder - update manually)
    GOOGLE_CLIENT_ID     = ""
    GOOGLE_CLIENT_SECRET = ""
    APPLE_CLIENT_ID      = ""
    APPLE_CLIENT_SECRET  = ""

    # Monitoring (placeholder - update manually)
    DATADOG_API_KEY = ""
    SENTRY_DSN      = ""
  })
}

# -----------------------------------------------------------------------------
# Database Credentials
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}/${var.environment}/db-credentials"
  description             = "Database credentials for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-credentials"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "mindmate_admin"
    password = random_password.db_password.result
  })
}

# -----------------------------------------------------------------------------
# Redis Credentials
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "redis_credentials" {
  name                    = "${var.project_name}/${var.environment}/redis-credentials"
  description             = "Redis credentials for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis-credentials"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "redis_credentials" {
  secret_id = aws_secretsmanager_secret.redis_credentials.id
  secret_string = jsonencode({
    # Redis auth token (if auth enabled)
    auth_token = ""
  })
}

# -----------------------------------------------------------------------------
# Third-Party Service Secrets
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "third_party_services" {
  name                    = "${var.project_name}/${var.environment}/third-party-services"
  description             = "Third-party service API keys for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "${var.project_name}-${var.environment}-third-party-services"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "third_party_services" {
  secret_id = aws_secretsmanager_secret.third_party_services.id
  secret_string = jsonencode({
    # AI Services
    OPENAI_API_KEY     = ""
    ANTHROPIC_API_KEY  = ""
    COHERE_API_KEY     = ""
    HUGGINGFACE_TOKEN  = ""

    # Payment
    STRIPE_SECRET_KEY      = ""
    STRIPE_WEBHOOK_SECRET  = ""
    STRIPE_PUBLISHABLE_KEY = ""

    # Communication
    SENDGRID_API_KEY    = ""
    TWILIO_ACCOUNT_SID  = ""
    TWILIO_AUTH_TOKEN   = ""
    TWILIO_PHONE_NUMBER = ""
    FIREBASE_SERVER_KEY = ""

    # Storage
    AWS_ACCESS_KEY_ID     = ""
    AWS_SECRET_ACCESS_KEY = ""

    # Monitoring & Analytics
    DATADOG_API_KEY     = ""
    DATADOG_APP_KEY     = ""
    SENTRY_DSN          = ""
    SEGMENT_WRITE_KEY   = ""
    MIXPANEL_TOKEN      = ""
    AMPLITUDE_API_KEY   = ""

    # Social Auth
    GOOGLE_CLIENT_ID       = ""
    GOOGLE_CLIENT_SECRET   = ""
    APPLE_CLIENT_ID        = ""
    APPLE_CLIENT_SECRET    = ""
    FACEBOOK_APP_ID        = ""
    FACEBOOK_APP_SECRET    = ""
    LINKEDIN_CLIENT_ID     = ""
    LINKEDIN_CLIENT_SECRET = ""

    # Search
    ALGOLIA_APP_ID      = ""
    ALGOLIA_API_KEY     = ""
    ALGOLIA_SEARCH_KEY  = ""

    # Email
    MAILGUN_API_KEY     = ""
    MAILGUN_DOMAIN      = ""
  })
}

# -----------------------------------------------------------------------------
# Secret Rotation (for database credentials)
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret_rotation" "db_credentials" {
  count = var.environment == "production" ? 1 : 0

  secret_id           = aws_secretsmanager_secret.db_credentials.id
  rotation_lambda_arn = aws_lambda_function.secrets_rotation[0].arn

  rotation_rules {
    automatically_after_days = 30
  }
}

resource "aws_lambda_function" "secrets_rotation" {
  count = var.environment == "production" ? 1 : 0

  function_name = "${var.project_name}-${var.environment}-secrets-rotation"
  role          = aws_iam_role.secrets_rotation[0].arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 60
  memory_size   = 256

  filename         = data.archive_file.rotation_lambda[0].output_path
  source_code_hash = data.archive_file.rotation_lambda[0].output_base64sha256

  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.${data.aws_region.current.name}.amazonaws.com"
    }
  }

  vpc_config {
    subnet_ids         = []
    security_group_ids = []
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-secrets-rotation"
    Environment = var.environment
  }
}

resource "aws_iam_role" "secrets_rotation" {
  count = var.environment == "production" ? 1 : 0

  name = "${var.project_name}-${var.environment}-secrets-rotation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-secrets-rotation-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "secrets_rotation" {
  count = var.environment == "production" ? 1 : 0

  name = "${var.project_name}-${var.environment}-secrets-rotation-policy"
  role = aws_iam_role.secrets_rotation[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetRandomPassword"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:ModifyDBInstance"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_permission" "secrets_rotation" {
  count = var.environment == "production" ? 1 : 0

  statement_id  = "AllowSecretsManagerRotation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secrets_rotation[0].function_name
  principal     = "secretsmanager.amazonaws.com"
  source_arn    = aws_secretsmanager_secret.db_credentials.arn
}

data "archive_file" "rotation_lambda" {
  count = var.environment == "production" ? 1 : 0

  type        = "zip"
  output_path = "${path.module}/rotation_lambda.zip"

  source {
    content  = <<-EOF
      exports.handler = async (event) => {
        const { SecretsManagerClient, GetRandomPasswordCommand, PutSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
        const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
        
        const secretId = event.SecretId;
        const token = event.ClientRequestToken;
        
        // Generate new password
        const passwordResponse = await client.send(new GetRandomPasswordCommand({
          PasswordLength: 32,
          ExcludeCharacters: '"@/\\'
        }));
        
        // Update secret with new password
        await client.send(new PutSecretValueCommand({
          SecretId: secretId,
          ClientRequestToken: token,
          SecretString: JSON.stringify({
            username: 'mindmate_admin',
            password: passwordResponse.RandomPassword
          })
        }));
        
        return { statusCode: 200 };
      };
    EOF
    filename = "index.js"
  }
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_region" "current" {}
