FROM node:24.21.0-trixie-slim@sha256:8ec5d7557396cfe32d21c3f9c13072355ceab22b584578ca4bb28af31120cffe

ENV NPM_CONFIG_IGNORE_SCRIPTS=true
# The root filesystem is read-only when launched with scripts/launch.sh, and the workspace should not fill with .pyc files.
ENV PYTHONDONTWRITEBYTECODE=1

ARG PI_VERSION=0.85.1

# python3 (standard library only) is for the data-analysis skills.
RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates fd-find git python3 ripgrep \
  && ln -s /usr/bin/fdfind /usr/local/bin/fd \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_VERSION} \
  && npm cache clean --force

RUN mkdir -p /home/node/.pi/agent && chown -R node:node /home/node/.pi

USER node
