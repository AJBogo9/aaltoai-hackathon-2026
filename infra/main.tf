# Verda infrastructure for the hackathon.
#
#   cd infra
#   tofu init
#   tofu plan
#   tofu apply
#
# Everything below is commented out so an accidental `apply` costs nothing.
# Uncomment what you need.
#
# This provider ships no data sources, so you cannot look values up in HCL.
# Find instance types, locations and images with the CLI instead:
#   verda instance-types
#   verda locations

# resource "verda_ssh_key" "me" {
#   name       = "andreas"
#   public_key = file(pathexpand("~/.ssh/id_ed25519.pub"))
# }

# A GPU box you SSH into. Billed per minute for as long as it exists,
# so `tofu destroy` it the moment you stop using it.
# resource "verda_instance" "dev" {
#   instance_type = "1B200.30V"
#   image         = "ubuntu-24.04-cuda-12.8-open-docker"
#   hostname      = "hackathon-dev"
#   description   = "Data Sovereignty hackathon"
#   location      = "FIN-03"
#   ssh_key_ids   = [verda_ssh_key.me.id]
# }

# A serverless container, the same shape as the endpoint Norrin handed us.
# min_replica_count = 0 scales to zero, so an idle deployment costs nothing,
# at the price of a cold start on the first request.
# resource "verda_container" "inference" {
#   name = "sovereignty-demo"
#
#   compute = {
#     name = "H100"
#     size = 1
#   }
#
#   scaling = {
#     min_replica_count               = 0
#     max_replica_count               = 1
#     queue_message_ttl_seconds       = 300
#     concurrent_requests_per_replica = 10
#
#     scale_down_policy = { delay_seconds = 60 }
#     scale_up_policy   = { delay_seconds = 10 }
#     queue_load        = { threshold = 0.5 }
#   }
#
#   containers = [
#     {
#       image        = "vllm/vllm-openai:latest"
#       exposed_port = 8000
#     }
#   ]
# }
