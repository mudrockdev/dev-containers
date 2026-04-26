FROM almalinux:10

ARG USERNAME=devcontainer
ARG USER_UID=1000
ARG USER_GID=1000

RUN dnf install -y \
    bash \
    ca-certificates \
    curl \
    git \
    procps-ng \
    shadow-utils \
    sudo \
    unzip \
    xz \
 && dnf clean all \
 && rm -rf /var/cache/dnf \
 && groupadd --gid "${USER_GID}" "${USERNAME}" \
 && useradd --uid "${USER_UID}" --gid "${USER_GID}" -m -s /bin/bash "${USERNAME}" \
 && echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/${USERNAME}" \
 && chmod 0440 "/etc/sudoers.d/${USERNAME}" \
 && printf '%s\n' 'export PATH="$HOME/.local/bin:$PATH"' > /etc/profile.d/devcontainer-user-path.sh

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

USER ${USERNAME}
ENV HOME=/home/${USERNAME}
ENV PATH=${HOME}/.local/bin:${PATH}
RUN curl https://mise.run | sh

WORKDIR /workspaces
CMD ["sleep", "infinity"]
