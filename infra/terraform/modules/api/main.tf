# NestJS API on ECS Fargate (arm64) behind an Application Load Balancer.
# - Secrets (DATABASE_URL, JWT_SECRET) live in Secrets Manager and are injected by ECS.
# - The task role grants only: S3 uploads/* read/write, SES send from the configured address.
# - CI/CD (GitHub Actions) registers new task-definition revisions with new image tags;
#   Terraform ignores those changes so the two never fight.
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

resource "random_password" "jwt" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "api" {
  name                    = "${var.name}/api"
  description             = "Forum500 API runtime secrets"
  recovery_window_in_days = var.secret_recovery_days
}

resource "aws_secretsmanager_secret_version" "api" {
  secret_id = aws_secretsmanager_secret.api.id
  secret_string = jsonencode({
    DATABASE_URL = var.database_url
    JWT_SECRET   = random_password.jwt.result
  })
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.name}-api"
  retention_in_days = var.log_retention_days
}

resource "aws_ecs_cluster" "this" {
  name = var.name
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_cluster_capacity_providers" "this" {
  cluster_name       = aws_ecs_cluster.this.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

# ── IAM: execution role (pull image, read secret, write logs)
data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  name               = "${var.name}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "execution_secrets" {
  name = "read-api-secret"
  role = aws_iam_role.execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [aws_secretsmanager_secret.api.arn]
    }]
  })
}

# ── IAM: task role (what the running app may do)
resource "aws_iam_role" "task" {
  name               = "${var.name}-api-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy" "task" {
  name = "api-runtime"
  role = aws_iam_role.task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AssetsReadWrite"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = ["${var.assets_bucket_arn}/uploads/*"]
      },
      {
        Sid       = "AssetsList"
        Effect    = "Allow"
        Action    = ["s3:ListBucket"]
        Resource  = [var.assets_bucket_arn]
        Condition = { StringLike = { "s3:prefix" = ["uploads/*"] } }
      },
      {
        Sid       = "SendEmail"
        Effect    = "Allow"
        Action    = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource  = ["*"]
        Condition = { StringEquals = { "ses:FromAddress" = var.mail_from_address } }
      },
    ]
  })
}

# ── Task definition
locals {
  environment = {
    NODE_ENV              = "production"
    PORT                  = tostring(var.container_port)
    AWS_REGION            = data.aws_region.current.name
    PUBLIC_API_URL        = var.public_api_url
    WEB_APP_URL           = var.web_app_url
    ADMIN_APP_URL         = var.admin_app_url
    CORS_ORIGINS          = join(",", [var.web_app_url, var.admin_app_url])
    STORAGE_DRIVER        = "s3"
    S3_BUCKET             = var.assets_bucket_name
    ASSET_PUBLIC_BASE_URL = var.asset_public_base_url
    MAIL_DRIVER           = "ses"
    MAIL_FROM             = "Forum500 <${var.mail_from_address}>"
    JWT_EXPIRES_IN        = "1d"
    RATE_LIMIT_PER_MINUTE = tostring(var.rate_limit_per_minute)
    TRUST_PROXY           = "true"
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.name}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  runtime_platform {
    cpu_architecture        = "ARM64"
    operating_system_family = "LINUX"
  }

  container_definitions = jsonencode([{
    name         = "api"
    image        = "${var.image_repository_url}:${var.image_tag}"
    essential    = true
    portMappings = [{ containerPort = var.container_port, protocol = "tcp" }]
    environment  = [for k, v in local.environment : { name = k, value = v }]
    secrets = [
      { name = "DATABASE_URL", valueFrom = "${aws_secretsmanager_secret.api.arn}:DATABASE_URL::" },
      { name = "JWT_SECRET", valueFrom = "${aws_secretsmanager_secret.api.arn}:JWT_SECRET::" },
    ]
    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://localhost:${var.container_port}/api/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.api.name
        awslogs-region        = data.aws_region.current.name
        awslogs-stream-prefix = "api"
      }
    }
  }])
}

# ── Load balancer
resource "aws_lb" "api" {
  name                       = "${var.name}-api"
  load_balancer_type         = "application"
  internal                   = false
  security_groups            = [var.alb_security_group_id]
  subnets                    = var.public_subnet_ids
  drop_invalid_header_fields = true
  idle_timeout               = 120 # large uploads
  enable_deletion_protection = var.deletion_protection
}

resource "aws_lb_target_group" "api" {
  name        = "${var.name}-api"
  port        = var.container_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    path                = "/api/health"
    matcher             = "200"
    interval            = 15
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
  deregistration_delay = 30
}

# HTTPS when a certificate is provided; otherwise plain HTTP (only acceptable for a first test).
resource "aws_lb_listener" "https" {
  count             = var.enable_https ? 1 : 0
  load_balancer_arn = aws_lb.api.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  dynamic "default_action" {
    for_each = var.enable_https ? [1] : []
    content {
      type = "redirect"
      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }
  dynamic "default_action" {
    for_each = var.enable_https ? [] : [1]
    content {
      type             = "forward"
      target_group_arn = aws_lb_target_group.api.arn
    }
  }
}

# ── Service
resource "aws_ecs_service" "api" {
  name                              = "${var.name}-api"
  cluster                           = aws_ecs_cluster.this.id
  task_definition                   = aws_ecs_task_definition.api.arn
  desired_count                     = var.desired_count
  launch_type                       = "FARGATE"
  health_check_grace_period_seconds = 90
  enable_execute_command            = false
  propagate_tags                    = "SERVICE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.api_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = var.container_port
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  # CI deploys new revisions (new image tags); don't revert them on the next `terraform apply`.
  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  depends_on = [aws_lb_listener.http]
}

# ── Autoscaling on CPU
resource "aws_appautoscaling_target" "api" {
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = var.min_count
  max_capacity       = var.max_count
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.name}-api-cpu"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.api.service_namespace
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  target_tracking_scaling_policy_configuration {
    target_value = 60
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
