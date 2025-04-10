variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"  # Change to your preferred region
}

variable "project_name" {
  description = "Name of the project, used as prefix for resource names"
  type        = string
  default     = "infraterra"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}