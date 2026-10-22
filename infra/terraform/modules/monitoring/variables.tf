variable "name" { type = string }
variable "alert_emails" { type = list(string) }
variable "alb_arn_suffix" { type = string }
variable "target_group_arn_suffix" { type = string }
variable "ecs_cluster_name" { type = string }
variable "ecs_service_name" { type = string }
variable "db_identifier" { type = string }
variable "db_max_connections_alarm" { type = number }
