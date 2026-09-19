terraform {
  required_version = ">= 1.6"

  required_providers {
    verda = {
      source  = "verda-cloud/verda"
      version = "~> 1.1"
    }
  }
}

# Credentials come from the environment, never from this file:
#   export VERDA_CLIENT_ID=...
#   export VERDA_CLIENT_SECRET=...
# Create the pair at https://console.verda.com/ -> Credentials -> Cloud API credentials.
# The secret is shown exactly once.
provider "verda" {}
