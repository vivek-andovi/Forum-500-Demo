#!/bin/sh
# Runs inside LocalStack when it is ready: create a public-read bucket and verify the sender for SES.
awslocal s3 mb s3://forum500-assets
awslocal s3api put-bucket-policy --bucket forum500-assets --policy '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::forum500-assets/*"}]}'
awslocal ses verify-email-identity --email-address no-reply@forum500.club
