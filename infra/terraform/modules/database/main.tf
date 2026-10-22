# RDS PostgreSQL 16 in private subnets: encrypted, TLS enforced, automated backups,
# deletion protection in production. The app connection string is stored in Secrets Manager
# by the root module (password generated here, never typed by a human).
resource "random_password" "master" {
  length  = 32
  special = false # avoids URL-encoding issues in DATABASE_URL
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.name}-db"
  subnet_ids = var.private_subnet_ids
}

resource "aws_db_parameter_group" "this" {
  name   = "${var.name}-pg16"
  family = "postgres16"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # log queries slower than 1s
  }
}

resource "aws_db_instance" "this" {
  identifier     = "${var.name}-db"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.instance_class

  db_name  = "forum500"
  username = "forum500"
  password = random_password.master.result
  port     = 5432

  allocated_storage     = var.allocated_storage_gb
  max_allocated_storage = var.max_allocated_storage_gb
  storage_type          = "gp3"
  storage_encrypted     = true

  multi_az               = var.multi_az
  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [var.db_security_group_id]
  parameter_group_name   = aws_db_parameter_group.this.name
  publicly_accessible    = false

  backup_retention_period         = var.backup_retention_days
  backup_window                   = "02:00-03:00"
  maintenance_window              = "sun:03:30-sun:04:30"
  copy_tags_to_snapshot           = true
  deletion_protection             = var.deletion_protection
  skip_final_snapshot             = !var.deletion_protection
  final_snapshot_identifier       = var.deletion_protection ? "${var.name}-db-final" : null
  performance_insights_enabled    = true
  enabled_cloudwatch_logs_exports = ["postgresql"]
  auto_minor_version_upgrade      = true
  apply_immediately               = !var.deletion_protection
}
