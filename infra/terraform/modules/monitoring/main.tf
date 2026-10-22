# Alarms → SNS topic → email. Covers the API (5xx, latency, unhealthy targets, CPU/memory)
# and the database (CPU, free storage, connections).
resource "aws_sns_topic" "alerts" {
  name = "${var.name}-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  for_each  = toset(var.alert_emails)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

locals {
  alarms = {
    alb_5xx = {
      namespace = "AWS/ApplicationELB", metric = "HTTPCode_Target_5XX_Count", stat = "Sum", threshold = 10, period = 300, comparison = "GreaterThanThreshold"
      dims      = { LoadBalancer = var.alb_arn_suffix }, desc = "API returned more than 10 server errors in 5 minutes"
    }
    alb_latency = {
      namespace = "AWS/ApplicationELB", metric = "TargetResponseTime", stat = "Average", threshold = 2, period = 300, comparison = "GreaterThanThreshold"
      dims      = { LoadBalancer = var.alb_arn_suffix }, desc = "Average API response time above 2s"
    }
    unhealthy_targets = {
      namespace = "AWS/ApplicationELB", metric = "UnHealthyHostCount", stat = "Maximum", threshold = 0, period = 60, comparison = "GreaterThanThreshold"
      dims      = { LoadBalancer = var.alb_arn_suffix, TargetGroup = var.target_group_arn_suffix }, desc = "At least one API task failing health checks"
    }
    ecs_cpu = {
      namespace = "AWS/ECS", metric = "CPUUtilization", stat = "Average", threshold = 80, period = 300, comparison = "GreaterThanThreshold"
      dims      = { ClusterName = var.ecs_cluster_name, ServiceName = var.ecs_service_name }, desc = "API CPU above 80%"
    }
    ecs_memory = {
      namespace = "AWS/ECS", metric = "MemoryUtilization", stat = "Average", threshold = 85, period = 300, comparison = "GreaterThanThreshold"
      dims      = { ClusterName = var.ecs_cluster_name, ServiceName = var.ecs_service_name }, desc = "API memory above 85%"
    }
    rds_cpu = {
      namespace = "AWS/RDS", metric = "CPUUtilization", stat = "Average", threshold = 80, period = 300, comparison = "GreaterThanThreshold"
      dims      = { DBInstanceIdentifier = var.db_identifier }, desc = "Database CPU above 80%"
    }
    rds_storage = {
      namespace = "AWS/RDS", metric = "FreeStorageSpace", stat = "Minimum", threshold = 2147483648, period = 300, comparison = "LessThanThreshold"
      dims      = { DBInstanceIdentifier = var.db_identifier }, desc = "Database free storage below 2 GB"
    }
    rds_connections = {
      namespace = "AWS/RDS", metric = "DatabaseConnections", stat = "Maximum", threshold = var.db_max_connections_alarm, period = 300, comparison = "GreaterThanThreshold"
      dims      = { DBInstanceIdentifier = var.db_identifier }, desc = "Database connections unusually high"
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "this" {
  for_each            = local.alarms
  alarm_name          = "${var.name}-${replace(each.key, "_", "-")}"
  alarm_description   = each.value.desc
  namespace           = each.value.namespace
  metric_name         = each.value.metric
  statistic           = each.value.stat
  period              = each.value.period
  evaluation_periods  = 2
  threshold           = each.value.threshold
  comparison_operator = each.value.comparison
  dimensions          = each.value.dims
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}
