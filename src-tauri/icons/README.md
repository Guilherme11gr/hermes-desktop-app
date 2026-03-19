# Icons

Coloque aqui os ícones do aplicativo nos seguintes formatos:

- `32x32.png` - Ícone 32x32px
- `128x128.png` - Ícone 128x128px  
- `128x128@2x.png` - Ícone 256x256px (Retina)
- `icon.icns` - Ícone macOS
- `icon.ico` - Ícone Windows

## Gerar ícones automaticamente

Use o comando do Tauri CLI:

```bash
npm run tauri icon /caminho/para/imagem.png
```

A imagem deve ter pelo menos 1024x1024px para gerar todos os tamanhos.

Ou instale o `tauri-cli` e use:

```bash
cargo tauri icon /caminho/para/imagem.png
```
