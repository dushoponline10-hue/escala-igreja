"""Gera a logo do app, os ícones e a imagem de prévia do link (og.png) a partir da logo oficial.

Uso: python3 scripts/gerar-imagens.py LOGO.png FONTE_TITULO.ttf FONTE_TEXTO.ttf
A logo oficial da Viver é quadrada, fundo preto, com o círculo e a folha em V.
"""
import sys
from PIL import Image, ImageDraw, ImageFont

LOGO, F_TITULO, F_TEXTO = sys.argv[1:4]
PRETO = (13, 12, 11)
AMARELO = (255, 194, 0)
BRANCO = (248, 248, 245)
CINZA = (205, 205, 200)

base = Image.open(LOGO).convert('RGB')


def logo(tamanho, redonda=False):
    img = base.resize((tamanho, tamanho), Image.LANCZOS).convert('RGBA')
    if redonda:  # tira os cantos pretos para assentar em qualquer fundo
        mascara = Image.new('L', (tamanho * 4, tamanho * 4), 0)
        ImageDraw.Draw(mascara).ellipse([0, 0, tamanho * 4 - 1, tamanho * 4 - 1], fill=255)
        img.putalpha(mascara.resize((tamanho, tamanho), Image.LANCZOS))
    return img


def icone(tamanho, margem):
    img = Image.new('RGB', (tamanho, tamanho), PRETO)
    s = int(tamanho * (1 - 2 * margem))
    img.paste(logo(s, True), ((tamanho - s) // 2, (tamanho - s) // 2), logo(s, True))
    return img


# Logo usada nas telas e ícones do app
logo(256, True).save('public/logo.png')
icone(192, 0.04).save('public/icons/icon-192.png')
icone(512, 0.04).save('public/icons/icon-512.png')
icone(512, 0.14).save('public/icons/icon-maskable-512.png')
icone(180, 0.06).save('public/icons/apple-touch-icon.png')
icone(48, 0.0).save('public/favicon.png')

# Imagem de prévia do link (1200x630)
W, H = 1200, 630
og = Image.new('RGBA', (W, H), PRETO + (255,))
d = ImageDraw.Draw(og)
d.rectangle([0, 0, 18, H], fill=AMARELO)
L = 360
og.alpha_composite(logo(L, True), (W - L - 80, (H - L) // 2))

t_sup = ImageFont.truetype(F_TEXTO, 30)
t1 = ImageFont.truetype(F_TITULO, 150)
t2 = ImageFont.truetype(F_TITULO, 110)
t_inf = ImageFont.truetype(F_TEXTO, 28)

x = 90
d.text((x, 118), 'VIVER CHURCH', font=t_sup, fill=AMARELO)
d.text((x, 160), 'ESCALA', font=t1, fill=BRANCO)
d.text((x, 330), 'DE SERVIÇO', font=t2, fill=AMARELO)
d.text((x, 492), 'Veja quando você serve e receba o aviso no celular.', font=t_inf, fill=CINZA)
og.convert('RGB').save('public/og.png', optimize=True)
print('imagens geradas')
