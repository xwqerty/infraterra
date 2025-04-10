# API Gateway integrations with Lambda functions

# Ad submission API route
resource "aws_apigatewayv2_route" "ad_submission" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /ads"
  target    = "integrations/${aws_apigatewayv2_integration.ad_submission.id}"
}

resource "aws_apigatewayv2_integration" "ad_submission" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.ad_submission_handler.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
  timeout_milliseconds = 30000
}

# Screen registration API route
resource "aws_apigatewayv2_route" "screen_registration" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /screens"
  target    = "integrations/${aws_apigatewayv2_integration.screen_registration.id}"
}

resource "aws_apigatewayv2_integration" "screen_registration" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.screen_registration_handler.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
  timeout_milliseconds = 30000
}

# Get screens API route
resource "aws_apigatewayv2_route" "get_screens" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /screens"
  target    = "integrations/${aws_apigatewayv2_integration.get_screens.id}"
}

resource "aws_apigatewayv2_integration" "get_screens" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.get_screens_handler.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

# Get user ads API route
resource "aws_apigatewayv2_route" "get_user_ads" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /users/{userId}/ads"
  target    = "integrations/${aws_apigatewayv2_integration.get_user_ads.id}"
}

resource "aws_apigatewayv2_integration" "get_user_ads" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.get_user_ads_handler.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_ad_submission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ad_submission_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*/ads"
}

resource "aws_lambda_permission" "api_screen_registration" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.screen_registration_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*/screens"
}

resource "aws_lambda_permission" "api_get_screens" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_screens_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*/screens"
}

resource "aws_lambda_permission" "api_get_user_ads" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_user_ads_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*/users/{userId}/ads"
}