"""Gera a imagem de prévia do link (og.png) e os ícones do app a partir da logo.

Uso: python3 scripts/gerar-imagens.py CAMINHO_DA_LOGO.png FONTE_TITULO.ttf FONTE_TEXTO.ttf
A logo pode ter fundo preto ou transparente; o símbolo é usado em amarelo.
"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageOps

LOGO, F_TITULO, F_TEXTO = sys.argv[1:4]
PRETO = (10, 10, 10)
AMARELO = (255, 194, 0)
BRANCO = (245, 245, 242)
CINZA = (163, 163, 160)


def simbolo(tamanho):
    """Recorta o símbolo da logo (parte clara) e pinta de amarelo, com fundo transparente."""
    img = Image.open(LOGO).convert('RGBA')
    fundo = Image.new('RGBA', img.size, (0, 0, 0, 255))
    plano = Image.alpha_composite(fundo, img).convert('L')
    mascara = plano.point(lambda v: 255 if v > 60 else int(v * 255 / 60))
    caixa = mascara.getbbox() or (0, 0, *img.size)
    mascara = mascara.crop(caixa)
    lado = max(mascara.size)
    quadro = Image.new('L', (lado, lado), 0)
    quadro.paste(mascara, ((lado - mascara.width) // 2, (lado - mascara.height) // 2))
    quadro = quadro.resize((tamanho, tamanho), Image.LANCZOS)
    cor = Image.new('RGBA', (tamanho, tamanho), AMARELO + (255,))
    cor.putalpha(quadro)
    return cor


def icone(tamanho, margem=0.18):
    img = Image.new('RGBA', (tamanho, tamanho), PRETO + (255,))
    s = int(tamanho * (1 - 2 * margem))
    img.alpha_composite(simbolo(s), ((tamanho - s) // 2, (tamanho - s) // 2))
    return img.convert('RGB')


# Ícones do app
icone(192).save('public/icons/icon-192.png')
icone(512).save('public/icons/icon-512.png')
icone(512, 0.24).save('public/icons/icon-maskable-512.png')
icone(180).save('public/icons/apple-touch-icon.png')
icone(48, 0.08).save('public/favicon.png')
simbolo(256).save('public/logo.png')

# Imagem de prévia do link (1200x630)
W, H = 1200, 630
og = Image.new('RGBA', (W, H), PRETO + (255,))
d = ImageDraw.Draw(og)
d.rectangle([0, 0, 18, H], fill=AMARELO)
og.alpha_composite(simbolo(300), (W - 300 - 90, (H - 300) // 2))

t_sup = ImageFont.truetype(F_TEXTO, 30)
t1 = ImageFont.truetype(F_TITULO, 150)
t2 = ImageFont.truetype(F_TITULO, 110)
t_inf = ImageFont.truetype(F_TEXTO, 30)

x = 90
d.text((x, 118), 'VIVER CHURCH', font=t_sup, fill=AMARELO)
d.text((x, 160), 'ESCALA', font=t1, fill=BRANCO)
d.text((x, 330), 'DE SERVIÇO', font=t2, fill=AMARELO)
d.text((x, 490), 'Veja quando você serve e receba o aviso no celular.', font=t_inf, fill=CINZA)
og.convert('RGB').save('public/og.png', optimize=True)
print('imagens geradas')
