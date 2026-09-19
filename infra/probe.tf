# TEMPORARY: proves the provider authenticates end to end at plan time.
# Delete after the check. Never applied.
resource "verda_startup_script" "probe" {
  name   = "tofu-auth-probe"
  script = "#!/bin/bash\necho probe\n"
}
