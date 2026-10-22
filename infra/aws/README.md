# infra/aws: manual reference only

**Use `infra/terraform/` to create and manage AWS resources.** Terraform creates the same
roles, policies and task definition from code; see [docs/TERRAFORM.md](../../docs/TERRAFORM.md).

These JSON files are kept for reference and for click-ops or emergency use:
- `ecs-task-definition.json`: the API task definition (Terraform: `modules/api`)
- `iam-*.json`: task, execution and GitHub deploy policies (Terraform: `modules/api`, `modules/github_oidc`)
- `s3-*.json`: bucket policy and CORS (Terraform: `modules/storage`)

**The CI deploy no longer reads `ecs-task-definition.json`.** It fetches the live
Terraform-managed task definition from ECS and swaps in the new image.
