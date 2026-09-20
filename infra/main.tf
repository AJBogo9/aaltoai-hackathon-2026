# Verda infrastructure for the hackathon.
#
#   ./infra/tofu.sh plan
#   ./infra/tofu.sh apply
#
# Use the wrapper, not bare `tofu`. The provider reads only VERDA_CLIENT_ID and
# VERDA_CLIENT_SECRET from the environment, and the wrapper supplies them from
# the credentials the CLI already stores.
#
# Everything below is commented out so an accidental apply costs nothing.
#
# This provider ships no data sources, so you cannot look values up in HCL.
# Get real values from the CLI first:
#   verda instance-types    # names and $/hr
#   verda locations         # FIN-01, FIN-02, FIN-03
#   verda images            # OS image slugs

# resource "verda_ssh_key" "me" {
#   name       = "andreas"
#   public_key = file(pathexpand("~/.ssh/id_ed25519.pub"))
# }

# A GPU box you SSH into. Billed per minute for as long as it EXISTS, not for
# as long as it is busy, so destroy it the moment you stop using it.
#
# 1A6000.10V is $0.60/hr with 48 GB of VRAM, which fits a 13B model
# comfortably or a 30B in 4-bit. Moving up to 1B200.30V costs $6.49/hr,
# eleven times more, and would consume the team's whole budget in ~44 hours.
# Check `verda images` for a current image slug before uncommenting.
# resource "verda_instance" "dev" {
#   instance_type = "1A6000.10V"
#   image         = "26.04.cuda13.2.docker"
#   hostname      = "hackathon-dev"
#   description   = "Data Sovereignty hackathon"
#   location      = "FIN-01"
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
