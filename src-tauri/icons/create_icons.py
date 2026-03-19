from PIL import Image, ImageDraw

# Criar ícone 256x256
img = Image.new('RGB', (256, 256), color='#1e90ff')
draw = ImageDraw.Draw(img)

# Desenhar um "H" simples no centro
draw.rectangle([80, 80, 100, 176], fill='white')  # barra esquerda
draw.rectangle([156, 80, 176, 176], fill='white')  # barra direita
draw.rectangle([100, 118, 156, 138], fill='white')  # barra do meio

# Salvar PNG
img.save('icon.png', 'PNG')
print('icon.png criado')

# Criar ICO (redimensionando para múltiplos tamanhos)
sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
icons = []
for size in sizes:
    icons.append(img.resize(size, Image.Resampling.LANCZOS))

icons[0].save('icon.ico', format='ICO', sizes=sizes)
print('icon.ico criado')
