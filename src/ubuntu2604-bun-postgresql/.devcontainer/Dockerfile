FROM ubuntu:26.04

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
 && if getent group "${USER_GID}" >/dev/null; then \
      EXISTING_GROUP="$(getent group "${USER_GID}" | cut -d: -f1)"; \
      if [ "${EXISTING_GROUP}" != "${USERNAME}" ]; then \
        groupmod --new-name "${USERNAME}" "${EXISTING_GROUP}"; \
      fi; \
    else \
      groupadd --gid "${USER_GID}" "${USERNAME}"; \
    fi \
 && if getent passwd "${USER_UID}" >/dev/null; then \
      EXISTING_USER="$(getent passwd "${USER_UID}" | cut -d: -f1)"; \
      EXISTING_HOME="$(getent passwd "${USER_UID}" | cut -d: -f6)"; \
      if [ "${EXISTING_USER}" != "${USERNAME}" ]; then \
        if [ -d "${EXISTING_HOME}" ] && [ ! -e "/home/${USERNAME}" ]; then \
          usermod --login "${USERNAME}" --home "/home/${USERNAME}" --move-home "${EXISTING_USER}"; \
        else \
          usermod --login "${USERNAME}" --home "/home/${USERNAME}" "${EXISTING_USER}"; \
        fi; \
      fi; \
      usermod --gid "${USER_GID}" --shell /bin/bash "${USERNAME}"; \
    else \
      useradd --uid "${USER_UID}" --gid "${USER_GID}" -m -s /bin/bash "${USERNAME}"; \
    fi \
 && mkdir -p "/home/${USERNAME}" \
 && chown -R "${USER_UID}:${USER_GID}" "/home/${USERNAME}" \
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
