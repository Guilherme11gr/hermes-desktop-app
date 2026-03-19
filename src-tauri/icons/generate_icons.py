#!/usr/bin/env python3
from PIL import Image, ImageDraw

# Cria um ícone simples RGBA - bolinha dourada
img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Desenha um círculo dourado
draw.ellipse([20, 20, 108, 108], fill=(255, 193, 7, 255))

# Salva em diferentes tamanhos
img.save('icon.png')
print('icon.png criado')

# Redimensiona para outros tamanhos
sizes = [(32, 32), (128, 128), (256, 256)]
for w, h in sizes:
    resized = img.resize((w, h), Image.Resampling.LANCZOS)
    if w == 32:
        resized.save('32x32.png')
        print('32x32.png criado')
    elif w == 128:
        resized.save('128x128.png')
        print('128x128.png criado')
    elif w == 256:
        resized.save('128x128@2x.png')
        print('128x128@2x.png criado')

# Cria ICO
img.save('icon.ico', format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128)])
print('icon.ico criado')

print('Todos os ícones criados!')
