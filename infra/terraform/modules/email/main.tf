# Amazon SES sending domain with DKIM and a custom MAIL FROM subdomain.
# If route53_zone_id is set the DNS records are created automatically; otherwise add the
# records from the `dns_records` output at your DNS provider.
# NOTE: new SES accounts are in the sandbox. Request production access in the SES console.
resource "aws_ses_domain_identity" "this" {
  domain = var.domain
}

resource "aws_ses_domain_dkim" "this" {
  domain = aws_ses_domain_identity.this.domain
}

resource "aws_ses_domain_mail_from" "this" {
  domain           = aws_ses_domain_identity.this.domain
  mail_from_domain = "mail.${var.domain}"
}

resource "aws_ses_configuration_set" "this" {
  name = "${var.name}-default"
  delivery_options { tls_policy = "Require" }
  reputation_metrics_enabled = true
}

locals {
  # Keys are static (known at plan time); values may only be known after apply.
  # SES always issues exactly 3 DKIM tokens.
  dns_record_map = merge(
    {
      verification  = { name = "_amazonses.${var.domain}", type = "TXT", value = aws_ses_domain_identity.this.verification_token }
      mail_from_mx  = { name = "mail.${var.domain}", type = "MX", value = "10 feedback-smtp.${var.aws_region}.amazonses.com" }
      mail_from_spf = { name = "mail.${var.domain}", type = "TXT", value = "v=spf1 include:amazonses.com ~all" }
      dmarc         = { name = "_dmarc.${var.domain}", type = "TXT", value = "v=DMARC1; p=quarantine; rua=mailto:dmarc@${var.domain}" }
    },
    {
      for i in range(3) : "dkim_${i}" => {
        name  = "${aws_ses_domain_dkim.this.dkim_tokens[i]}._domainkey.${var.domain}"
        type  = "CNAME"
        value = "${aws_ses_domain_dkim.this.dkim_tokens[i]}.dkim.amazonses.com"
      }
    },
  )
  dns_records = values(local.dns_record_map)
}

resource "aws_route53_record" "this" {
  for_each = var.route53_zone_id != "" ? local.dns_record_map : {}
  zone_id  = var.route53_zone_id
  name     = each.value.name
  type     = each.value.type
  ttl      = 600
  records  = [each.value.value]
}

resource "aws_ses_domain_identity_verification" "this" {
  count      = var.route53_zone_id != "" ? 1 : 0
  domain     = aws_ses_domain_identity.this.id
  depends_on = [aws_route53_record.this]
}
