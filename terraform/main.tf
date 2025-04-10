provider "aws" {
  region = var.aws_region
}

# S3 bucket for storing advertisements
resource "aws_s3_bucket" "ad_content" {
  bucket = "${var.project_name}-ad-content"

  tags = {
    Name        = "${var.project_name}-ad-content"
    Environment = var.environment
  }
}

# Enable CORS on the S3 bucket
resource "aws_s3_bucket_cors_configuration" "ad_content_cors" {
  bucket = aws_s3_bucket.ad_content.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"] # Lock this down to your domains in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# DynamoDB Tables
# Users table
resource "aws_dynamodb_table" "users" {
  name           = "${var.project_name}-users"
  billing_mode   = "PAY_PER_REQUEST" # Starts with on-demand pricing for MVP
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name               = "EmailIndex"
    hash_key           = "email"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }

  tags = {
    Name        = "${var.project_name}-users"
    Environment = var.environment
  }
}

# Advertisements table
resource "aws_dynamodb_table" "advertisements" {
  name           = "${var.project_name}-advertisements"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "adId"

  attribute {
    name = "adId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name               = "UserAdsIndex"
    hash_key           = "userId"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }

  tags = {
    Name        = "${var.project_name}-advertisements"
    Environment = var.environment
  }
}

# Screens table
resource "aws_dynamodb_table" "screens" {
  name           = "${var.project_name}-screens"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "screenId"

  attribute {
    name = "screenId"
    type = "S"
  }

  attribute {
    name = "location"
    type = "S"
  }

  global_secondary_index {
    name               = "LocationIndex"
    hash_key           = "location"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }

  tags = {
    Name        = "${var.project_name}-screens"
    Environment = var.environment
  }
}

# ScheduledAds table - links ads to screens with scheduling info
resource "aws_dynamodb_table" "scheduled_ads" {
  name           = "${var.project_name}-scheduled-ads"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "scheduleId"

  attribute {
    name = "scheduleId"
    type = "S"
  }

  attribute {
    name = "screenId"
    type = "S"
  }

  attribute {
    name = "startDate"
    type = "S"
  }

  global_secondary_index {
    name               = "ScreenScheduleIndex"
    hash_key           = "screenId"
    range_key          = "startDate"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }

  tags = {
    Name        = "${var.project_name}-scheduled-ads"
    Environment = var.environment
  }
}

# IoT Core setup for screen devices
resource "aws_iot_thing_type" "ad_screen" {
  name = "AdScreen"
  
  properties {
    description = "Digital advertisement screen"
  }
}

# Create IoT policy
resource "aws_iot_policy" "ad_screen_policy" {
  name = "${var.project_name}-ad-screen-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "iot:Connect",
          "iot:Publish",
          "iot:Subscribe",
          "iot:Receive"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda function for handling ad submissions
resource "aws_lambda_function" "ad_submission_handler" {
  function_name    = "${var.project_name}-ad-submission-handler"
  filename         = "lambda_functions/ad_submission_handler.zip"
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  role             = aws_iam_role.lambda_role.arn
  timeout          = 30 # Increased timeout for file processing
  memory_size      = 256

  environment {
    variables = {
      AD_CONTENT_BUCKET = aws_s3_bucket.ad_content.bucket
      ADVERTISEMENTS_TABLE = aws_dynamodb_table.advertisements.name
      SCHEDULED_ADS_TABLE = aws_dynamodb_table.scheduled_ads.name
      IOT_ENDPOINT = aws_iot_endpoint.endpoint.endpoint_address
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy
  ]
}

# Lambda function for handling screen registration
resource "aws_lambda_function" "screen_registration_handler" {
  function_name    = "${var.project_name}-screen-registration-handler"
  filename         = "lambda_functions/screen_registration_handler.zip"
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  role             = aws_iam_role.lambda_role.arn
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      SCREENS_TABLE = aws_dynamodb_table.screens.name
      IOT_POLICY_NAME = aws_iot_policy.ad_screen_policy.name
      IOT_ENDPOINT = aws_iot_endpoint.endpoint.endpoint_address
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy
  ]
}

# Lambda function for getting available screens
resource "aws_lambda_function" "get_screens_handler" {
  function_name    = "${var.project_name}-get-screens-handler"
  filename         = "lambda_functions/get_screens_handler.zip"
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  role             = aws_iam_role.lambda_role.arn
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      SCREENS_TABLE = aws_dynamodb_table.screens.name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy
  ]
}

# Lambda function for getting user advertisements
resource "aws_lambda_function" "get_user_ads_handler" {
  function_name    = "${var.project_name}-get-user-ads-handler"
  filename         = "lambda_functions/get_user_ads_handler.zip"
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  role             = aws_iam_role.lambda_role.arn
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      ADVERTISEMENTS_TABLE = aws_dynamodb_table.advertisements.name
      SCHEDULED_ADS_TABLE = aws_dynamodb_table.scheduled_ads.name
      SCREENS_TABLE = aws_dynamodb_table.screens.name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy
  ]
}

# API Gateway for frontend to backend communication
resource "aws_apigatewayv2_api" "api" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"] # Lock this down to your domains in production
    allow_methods = ["GET", "POST", "PUT", "DELETE"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
}

# IAM Role and Policies
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

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
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.project_name}-lambda-policy"
  description = "Policy for Lambda function to access DynamoDB, S3, and IoT"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = [
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.advertisements.arn,
          aws_dynamodb_table.screens.arn,
          aws_dynamodb_table.scheduled_ads.arn,
          "${aws_dynamodb_table.users.arn}/index/*",
          "${aws_dynamodb_table.advertisements.arn}/index/*",
          "${aws_dynamodb_table.screens.arn}/index/*",
          "${aws_dynamodb_table.scheduled_ads.arn}/index/*"
        ]
      },
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.ad_content.arn,
          "${aws_s3_bucket.ad_content.arn}/*"
        ]
      },
      {
        Action = [
          "iot:Publish"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:iot:${var.aws_region}:${data.aws_caller_identity.current.account_id}:topic/*"
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_iot_endpoint" "endpoint" {
  endpoint_type = "iot:Data-ATS"
}

# Outputs
output "api_endpoint" {
  value = aws_apigatewayv2_api.api.api_endpoint
}

output "iot_endpoint" {
  value = data.aws_iot_endpoint.endpoint.endpoint_address
}

output "ad_content_bucket" {
  value = aws_s3_bucket.ad_content.bucket
}