# Using the Verda cloud

We have a shared Verda project, `aaltoai-hackathon`, funded with **$286.50** of
hackathon credit. Verda is a Finnish GPU cloud, formerly DataCrunch. All three
of its regions are in Finland, so nothing you run here leaves the EU.

This is a shared balance. Everything you start spends the same money everyone
else is spending.

## One-time setup, about five minutes

### 1. Accept the project invite

Check your email for the invite to `aaltoai-hackathon` and accept it. Nothing
below works until you have.

### 2. Install the CLI

```bash
VERDA_INSTALL_DIR="$HOME/.local/bin" \
  curl -sSL https://raw.githubusercontent.com/verda-cloud/verda-cli/main/scripts/install.sh | sh
```

No sudo, checksum-verified, installs a single binary. Make sure
`~/.local/bin` is on your `PATH`.

### 3. Create your own API credential

In [console.verda.com](https://console.verda.com/):

1. Switch the **project selector** to `aaltoai-hackathon`. This matters. A
   credential is welded to whichever project is active when you create it, and
   one made in your personal project will silently show you an empty account.
2. **Credentials** → **Cloud API Credentials** → **+ Create**.
3. Name it something like `<yourname>-cli`. 30 days expiry is fine.

**Create your own. Do not share one.** Credentials are tied to individual
members and are deleted if that member leaves the project.

### 4. Log the CLI in

```bash
verda auth login
```

Press Enter for the profile name (`default`), Enter again for the base URL,
then paste your Client ID and Client Secret. The secret is shown once, so keep
the browser dialog open until the wizard finishes.

### 5. Check it worked

```bash
verda cost balance
```

You should see roughly `$286.50`. If you see `$0.00`, your credential is in the
wrong project. Go back to step 3.

### 6. Add your SSH key

```bash
verda ssh-key add
verda ssh-key list
```

## Starting a GPU box

```bash
verda vm create
```

The wizard walks you through it. **Choose `1A6000.10V`.**

That is 1x RTX A6000, 48 GB of VRAM, at $0.60/hr. It fits a 13B model
comfortably or a 30B in 4-bit. For an OS image pick one with Docker and CUDA,
`verda images` lists the current slugs.

Non-interactive, if you prefer:

```bash
verda vm create \
  --kind gpu \
  --instance-type 1A6000.10V \
  --location FIN-01 \
  --os "$(verda images | grep docker | head -1 | awk '{print $1}')" \
  --hostname <yourname>-dev \
  --ssh-key <your-key-id>
```

Then:

```bash
verda vm list          # what exists
verda ssh <hostname>   # get in
```

## Rules, because it is one shared balance

**Stay at `1A6000.10V` unless the team agrees otherwise.** The price range here
is brutal:

| Instance | $/hr | How long $286.50 lasts |
| --- | --- | --- |
| `CPU.8V.32G` | $0.10 | ~2980 hours |
| `1A6000.10V` | $0.60 | ~474 hours |
| `1B200.30V` | $6.49 | ~44 hours |
| `8B300.240V` | $63.06 | ~4.5 hours |

Three of us on A6000s for the rest of the event costs about $27. Three of us on
B200s costs the entire budget. One forgotten 8xB300 overnight costs more than
we have.

**Instances bill for existing, not for being busy.** A box you stopped using
still costs $0.60/hr until you delete it.

**Destroy what you start:**

```bash
verda vm delete <hostname>
```

**Check the burn before you go to sleep:**

```bash
verda cost running     # what is costing money right now
verda status           # hourly rate and remaining balance
```

## The Norrin inference endpoint

Separate from all of the above. Norrin gave us an OpenAI-compatible endpoint
serving Mistral Large 3, hosted in Finland. It runs on **their** account, so
calling it does not touch our $286.50.

- URL: `https://containers.datacrunch.io/data-sovereignty-mistral-large-3`
- Model id: `mistralai/Mistral-Large-3-675B-Instruct-2512-NVFP4`
- Context window: 262,144 tokens
- Auth: `Authorization: Bearer <inference key>`

The model id must match exactly or vLLM answers `400`. Copy `.env.example` to
`.env.local` **once**, then ask Andreas for the key out of band. Do not put it
in the repo, and do not re-run that copy afterwards, it overwrites what you
pasted.

Test your setup with:

```bash
bash scripts/verda_probe.sh
```

## Infrastructure as code

[`infra/`](../infra/) holds an OpenTofu setup if you prefer that to the CLI.
Run it through the wrapper, which supplies credentials from the ones the CLI
already stores:

```bash
./infra/tofu.sh plan
```

Resources available: instances, containers, serverless jobs, volumes, SSH keys,
startup scripts, registry credentials. There are no data sources, so look up
instance types, locations and images with the CLI.

## Worth knowing for the pitch

Verda sells **confidential computing** instances, the `.CC` types, where memory
is hardware-encrypted and the cloud operator cannot read your data while it is
being processed. `1RTXPRO6000.30V.CC` is $1.90/hr, and on CPU the premium is
about 2% (`CPU.8V.32G` is $0.0960, the CC version $0.0979).

For a data sovereignty challenge, "processed in a TEE, in Finland, for a 2%
surcharge" is a demonstrable claim rather than a slide.
