FROM node:20-slim

# 1️⃣ Dependencias del sistema
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        ca-certificates \
        openssh-client \
    && rm -rf /var/lib/apt/lists/*

# 2️⃣ Habilitar corepack y pnpm
RUN corepack enable \
    && corepack prepare pnpm@latest --activate

# 3️⃣ Crear usuario no-root
RUN useradd -ms /bin/bash claude

# 4️⃣ Crear directorio global npm para usuario
RUN mkdir -p /home/claude/.npm-global \
    && chown -R claude:claude /home/claude/.npm-global

# 5️⃣ Configurar npm prefix global para el usuario
ENV NPM_CONFIG_PREFIX=/home/claude/.npm-global
ENV PATH=/home/claude/.npm-global/bin:$PATH

# 6️⃣ Cambiar a usuario no-root
USER claude
WORKDIR /workspace

# 7️⃣ Instalar Claude Code como usuario (no root)
RUN npm install -g @anthropic-ai/claude-code