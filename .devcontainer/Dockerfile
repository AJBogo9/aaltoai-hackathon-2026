FROM node:24.21.0-trixie-slim@sha256:8ec5d7557396cfe32d21c3f9c13072355ceab22b584578ca4bb28af31120cffe

ENV NPM_CONFIG_IGNORE_SCRIPTS=true

ARG PI_VERSION=0.85.1

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates git ripgrep \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_VERSION} \
  && npm cache clean --force

RUN mkdir -p /home/node/.pi/agent && chown -R node:node /home/node/.pi

USER node
