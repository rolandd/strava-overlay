# SPDX-License-Identifier: MIT
# Copyright 2026 Roland Dreier <roland@rolandd.dev>

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "cloudflare_pages_project" "pwa" {
  account_id        = var.cloudflare_account_id
  name              = var.project_name
  production_branch = "main"

  source {
    type = "github"
    config {
      owner                         = var.github_owner
      repo_name                     = var.github_repo
      production_branch             = "main"
      pr_comments_enabled           = false
      deployments_enabled           = true
      production_deployment_enabled = true
      preview_deployment_setting    = "none"
      preview_branch_includes       = []
    }
  }

  build_config {
    build_command   = "pnpm run build"
    destination_dir = "build"
    root_dir        = ""
  }

  deployment_configs {
    production {
      environment_variables = {
        NODE_VERSION  = "24"
        PNPM_VERSION  = "11"
        PUBLIC_DOMAIN = "https://${var.domain}"
      }
    }
    preview {
      environment_variables = {
        NODE_VERSION  = "24"
        PNPM_VERSION  = "11"
        PUBLIC_DOMAIN = "https://${var.domain}"
      }
    }
  }
}

resource "cloudflare_pages_domain" "custom_domain" {
  count        = var.domain != "" ? 1 : 0
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.pwa.name
  domain       = var.domain
}

resource "cloudflare_record" "pages_cname" {
  count   = var.cloudflare_zone_id != "" && var.domain != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = var.domain
  value   = "${cloudflare_pages_project.pwa.name}.pages.dev"
  type    = "CNAME"
  proxied = true
  ttl     = 1
}

output "pages_subdomain" {
  description = "Default Cloudflare Pages subdomain"
  value       = "https://${cloudflare_pages_project.pwa.name}.pages.dev"
}

output "pages_custom_domain" {
  description = "Configured custom domain"
  value       = var.domain != "" ? "https://${var.domain}" : null
}
