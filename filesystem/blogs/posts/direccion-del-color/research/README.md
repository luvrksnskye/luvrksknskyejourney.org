# El código detrás de la entrada

Todo lo que se ve en el blog de Skye Journey *Todo color tiene una dirección* salió de datos públicos, y aquí está el código que los preparó. Si te da curiosidad, si pintas, si estudias color o si solo quieres jugar con los colores de verdad, llévatelo. Es tuyo.

## Qué hace cada archivo

| Archivo | Qué hace |
| --- | --- |
| `munsell.py` | Lee la renotación de Munsell de 1943, convierte cada color a sRGB y a Display P3, marca los que no caben en una pantalla y arma la tabla para leer píxeles al revés, de pantalla a Munsell. También se prueba a sí mismo. |
| `berlin_kay.py` | Lee las 330 fichas del World Color Survey y los datos originales de Berlin y Kay (1969) para el español de México, el inglés, el japonés y el mandarín. |
| `fondo.py` | Mide el fondo de la entrada: le da una dirección de Munsell a varios puntos del video y cuenta en qué familias de tono caen las luces y las sombras. |

## Cómo correrlo

Solo necesitas Python 3. `fondo.py` usa también `ffmpeg` para leer los fotogramas del video.

```bash
python munsell.py real.dat all.dat 1929.dat ../data
python berlin_kay.py cnum-vhcm-lab-new.txt BK-term.txt BK-foci.txt BK-dict.txt ../data/berlin-kay.json
python fondo.py ../assets/video/background-loop.mp4 ../data/munsell-lut.bin puntos.json
```

`munsell.py` tarda cerca de un minuto, porque calcula la tabla de 33 × 33 × 33 colores. Al terminar imprime cuántos colores caben en sRGB y en P3, y el error de ida y vuelta, que debería salir prácticamente en cero. `fondo.py` necesita un archivo `puntos.json` con los puntos que quieras medir, por ejemplo `{"cielo": [50, 50], "cinta": [440, 190]}`, en una imagen de 480 × 270.

## De dónde salen los datos

La renotación de Munsell (Newhall, Nickerson y Judd, 1943) la publica el
[Munsell Color Science Laboratory del Rochester Institute of Technology](https://www.rit.edu/science/munsell-color-science-lab-educational-resources)
en tres tablas: `real.dat`, `all.dat` y `1929.dat`. Están calculadas para el iluminante C y el observador de 2 grados.

Las fichas del World Color Survey y los datos de Berlin y Kay vienen del
[archivo del World Color Survey](https://linguistics.berkeley.edu/wcs/data.html), de Richard Cook, Paul Kay y Terry Regier, que piden que se cite el archivo en cualquier trabajo que use sus datos.

Para llevar los colores a una pantalla, los adapto de la luz C a la D65 con la transformación de Bradford, los paso a sRGB o a P3 y, si no caben, les bajo el croma en OKLab sin cambiarles el tono ni el valor. Para leer píxeles, la tabla interpola dentro de la renotación extendida. Son aproximaciones honestas, no medidas de laboratorio.

## Úsalo

Puedes copiarlo, cambiarlo, romperlo y publicar lo que hagas con él. No me pidas permiso.
Si te sirvió y quieres decírmelo, me hace ilusión, pero no hace falta.

---

*Everything here is free to take. The code reads the 1943 Munsell renotation data and the World Color Survey archive, and turns them into the figures you see in the post: a Munsell color tree built from real measurements, the chips your screen can and cannot show, a lookup table that reads the Munsell address of any pixel, and the Berlin and Kay color names for Spanish, English, Japanese and Mandarin. Copy it, break it, build something better with it. No permission needed.*
