#!/usr/bin/env bash
set -euo pipefail

DOTNET_VERSION="8.0"
INSTALL_DIR="$HOME/.dotnet"

echo "Verificando instalação do .NET $DOTNET_VERSION SDK..."

if command -v dotnet &>/dev/null; then
  INSTALLED=$(dotnet --version 2>/dev/null | cut -d'.' -f1)
  if [ "$INSTALLED" -ge "8" ] 2>/dev/null; then
    echo ".NET $DOTNET_VERSION SDK já está instalado: $(dotnet --version)"
    exit 0
  fi
fi

echo "Baixando o script de instalação do .NET..."
curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
chmod +x /tmp/dotnet-install.sh

echo "Instalando .NET $DOTNET_VERSION SDK silenciosamente em $INSTALL_DIR..."
/tmp/dotnet-install.sh --channel "$DOTNET_VERSION" --install-dir "$INSTALL_DIR" --no-path

export DOTNET_ROOT="$INSTALL_DIR"
export PATH="$INSTALL_DIR:$PATH"

PROFILE_FILE="$HOME/.bashrc"
if [[ "$SHELL" == */zsh ]]; then PROFILE_FILE="$HOME/.zshrc"; fi

if ! grep -q "DOTNET_ROOT" "$PROFILE_FILE" 2>/dev/null; then
  {
    echo ""
    echo "# .NET SDK"
    echo "export DOTNET_ROOT=\"$INSTALL_DIR\""
    echo "export PATH=\"\$DOTNET_ROOT:\$PATH\""
  } >> "$PROFILE_FILE"
fi

echo ".NET $(dotnet --version) instalado com sucesso."
rm -f /tmp/dotnet-install.sh
