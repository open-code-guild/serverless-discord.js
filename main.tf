terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.41.0"
    }
  }
}

locals {
  envs = { for tuple in regexall("(.*)=(.*)", file(".env")) : tuple[0] => sensitive(tuple[1]) }
}

variable "aws_access_key" {
  type = string
}

variable "aws_secret_key" {
  type = string
}

provider "aws" {
  region     = "us-east-1"
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# copy before archiving
resource "null_resource" "serverless-discord-js" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = "mkdir ./tmp-tf-build/ && cp -r ./src/* ./tmp-tf-build/ && cp -r ./node_modules/ ./tmp-tf-build/"
  }
}

# create an archive of the lambda function source code
data "archive_file" "serverless-discord-js" {
  type        = "zip"
  source_dir  = "./tmp-tf-build/"
  output_path = "./dist/serverless-discord-js.zip"

  depends_on = [
    resource.null_resource.serverless-discord-js
  ]
}

# delete build directory after archiving
resource "null_resource" "serverless-discord-js-cleanup" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = "rm -rf ./tmp-tf-build/"
  }

  depends_on = [
    data.archive_file.serverless-discord-js
  ]
}

resource "aws_iam_role" "serverless-discord-js" {
  name = "tf-serverless-discord-js"

  assume_role_policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Action" : "sts:AssumeRole",
        "Principal" : {
          "Service" : "lambda.amazonaws.com"
        },
        "Effect" : "Allow",
        "Sid" : ""
      }
    ]
  })

  inline_policy {
    name = "tf-inline-policy"

    policy = jsonencode({
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Action" : [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          "Resource" : "arn:aws:logs:*:*:*",
          "Effect" : "Allow"
        }
      ]
    })
  }
}

resource "aws_lambda_function" "serverless-discord-js" {
  function_name    = "tf-serverless-discord-js"
  description      = "A freed Discord bot, based on serverless-discord.js by zuedev!"
  role             = aws_iam_role.serverless-discord-js.arn
  handler          = "main.handler"
  runtime          = "nodejs16.x"
  memory_size      = 1024
  package_type     = "Zip"
  filename         = data.archive_file.serverless-discord-js.output_path
  source_code_hash = data.archive_file.serverless-discord-js.output_base64sha256
  publish          = true
  timeout          = 30

  environment {
    variables = {
      DISCORD_PUBLIC_KEY = local.envs.DISCORD_PUBLIC_KEY
      DISCORD_BOT_TOKEN  = local.envs.DISCORD_BOT_TOKEN
    }
  }

  depends_on = [
    null_resource.serverless-discord-js
  ]
}

resource "aws_lambda_function_url" "serverless-discord-js" {
  function_name      = aws_lambda_function.serverless-discord-js.function_name
  authorization_type = "NONE"
}
