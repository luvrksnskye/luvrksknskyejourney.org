# El código detrás de la entrada

Todo lo que se ve en el blog de Skye Journey *¿Cabe el universo en un cubo?* salió de datos públicos de la NASA, y aquí está el código que los preparó. Si te da curiosidad, si estudias algo parecido o si
simplemente quieres jugar con estrellas de verdad, llévatelo. Es tuyo.

## Qué hace cada archivo

| Archivo | Qué hace |
| --- | --- |
| `light_curves.mjs` | Lee los archivos FITS de Kepler y saca una curva de luz lista para la web. |
| `bls.py` | El buscador de tránsitos. Dobla la curva en miles de periodos y mide dónde encaja un escalón. |
| `transit_search.py` | Prueba 90 000 periodos sobre Kepler-90 y dibuja el periodograma de la entrada. |
| `transit_hunt.py` | Busca un planeta, lo borra de la curva y repite. Ocho veces. Se rompe a la tercera, y esa es la gracia. |
| `kepler_field.py` | Estima la distancia de cada estrella y arma el mapa en tres dimensiones. |
| `autoencoder.mjs` | Entrena una red que resume la tabla de planetas en tres números. Sin librerías, todo a mano. |

## Cómo correrlo

Necesitas Python con numpy, y Node para los dos archivos `.mjs`. Nada más.

```bash
node light_curves.mjs carpeta-con-fits ../data/kepler-90.bin
python transit_search.py ../data/kepler-90.bin ../data/kepler-90-bls.json
python transit_hunt.py ../data/kepler-90.bin hunt.json
python kepler_field.py koi_cumulative.csv ../data/kepler-field.json
node autoencoder.mjs koi_cumulative.csv ../data/koi-latent.json
```

La búsqueda completa tarda unos dos minutos. La iterativa puede que unos nueve. El resto es casi inmediato.

## De dónde salen los datos

Las curvas de luz vienen del [archivo MAST](https://archive.stsci.edu/kepler/) del Space Telescope
Science Institute. La tabla de objetos de interés viene del
[NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=cumulative),
que opera Caltech para la NASA. Los dos son públicos y gratuitos.

El método de búsqueda es BLS, de Kovács, Zucker y Mazeh (2002). Las distancias del mapa son
estimaciones hechas con el tamaño y la temperatura de cada estrella: sirven para ver la forma
del campo, no para navegar.

## Úsalo

Puedes copiarlo, cambiarlo, romperlo y publicar lo que hagas con él. No me pidas permiso.
Si te sirvió y quieres decírmelo, me hace ilusión, pero no hace falta.

---

*Everything here is free to take. The code reads public NASA data from the Kepler mission and
turns it into the figures you see in the post: transit searches, a 3D map of the Kepler field
and a small autoencoder written from scratch. Copy it, break it, build something better with it.
No permission needed.*
