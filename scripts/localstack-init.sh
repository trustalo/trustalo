#!/bin/bash
awslocal s3 mb s3://trustalo-files --region us-east-1 2>/dev/null || true
awslocal sqs create-queue --queue-name trustalo-evidence --region us-east-1 2>/dev/null || true
awslocal sqs create-queue --queue-name trustalo-jobs --region us-east-1 2>/dev/null || true
awslocal sqs create-queue --queue-name trustalo-vendor-research-requests --region us-east-1 2>/dev/null || true
awslocal sqs create-queue --queue-name trustalo-vendor-research-results --region us-east-1 2>/dev/null || true
# Phase 3 (AI accelerators): integration automated checks. The collector
# pushes RunCheckMessage onto -requests; the API worker consumes
# CheckResultMessage from -results and writes Evidence.
awslocal sqs create-queue --queue-name trustalo-integration-check-requests --region us-east-1 2>/dev/null || true
awslocal sqs create-queue --queue-name trustalo-integration-check-results --region us-east-1 2>/dev/null || true
echo "LocalStack init complete: bucket and queues created"
