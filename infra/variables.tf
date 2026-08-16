# SPDX-License-Identifier: MIT
# Copyright 2026 Roland Dreier <roland@rolandd.dev>

variable "cloudflare_api_token" {
  description = "Cloudflare API Token with Pages and DNS edit permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for custom domain DNS (optional)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "domain" {
  description = "Custom domain name to deploy to (e.g. overlay.example.com)"
  type        = string
  default     = "overlay.example.com"
}

variable "github_owner" {
  description = "GitHub username or organization"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "Merge"
}

variable "project_name" {
  description = "Cloudflare Pages project name"
  type        = string
  default     = "ride-stat-overlay"
}
