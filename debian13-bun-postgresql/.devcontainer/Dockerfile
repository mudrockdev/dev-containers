FROM debian:13

ARG USERNAME=devcontainer
ARG USER_UID=1000
ARG USER_GID=1000

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    git \
    procps \
    sudo \
    unzip \
    xz-utils \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --gid "${USER_GID}" "${USERNAME}" \
 && useradd --uid "${USER_UID}" --gid "${USER_GID}" -m -s /bin/bash "${USERNAME}" \
 && echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/${USERNAME}" \
 && chmod 0440 "/etc/sudoers.d/${USERNAME}" \
 && printf '%s\n' 'export PATH="$HOME/.bun/bin:$HOME/.local/bin:$PATH"' > /etc/profile.d/devcontainer-user-path.sh

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

USER ${USERNAME}
ENV HOME=/home/${USERNAME}
ENV BUN_INSTALL=${HOME}/.bun
ENV PATH=${HOME}/.bun/bin:${HOME}/.local/bin:${PATH}
RUN curl -fsSL https://bun.sh/install | bash

WORKDIR /workspaces
CMD ["sleep", "infinity"]
