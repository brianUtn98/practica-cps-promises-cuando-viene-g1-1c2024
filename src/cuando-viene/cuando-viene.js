const express = require('express');
const inspect = require('util').inspect;
const { colectivoMasCercano } = require('../ubicacion');
const { get, getWithTimeout } = require('../request');
const { healthCheck } = require('../middleware.js');
const { SERVICIOS } = require('../config');

const TRANSITO = SERVICIOS.cuandoViene;

const app = new express();

app.use(healthCheck);

app.get(`/conTimeout`, (req, res) => {
    const { timeout } = req.query;

    getWithTimeout(SERVICIOS.paradas, `/paradas/0`, timeout, (err, data) => {
        if(err){
            console.log(err.message);
            res.status(500).json(err.message);
        } else {
            res.status(200).json(data);
        }
    })
})

app.get('/cuando-viene/:parada', (req, res) => {
    const parada = req.params.parada;

    get(SERVICIOS.paradas, `/paradas/${parada}`, (_, detalleParada) => {
        const { lineas } = detalleParada;
        Promise.all(lineas.map((linea) => {
            console.log(`Buscando colectivo para la linea ${linea}`);
            return new Promise((resolve, reject) => {
                get(SERVICIOS.lineas, `/lineas/${linea}`, (err, estadoLinea) => {

                    if(err){
                        console.log(err.message);
                        return reject(err);
                    }

                    console.log(`Estado de la linea ${linea}`);
                    console.log(inspect({
                        linea,
                        estadoLinea
                    }, { depth: Infinity }))

                    const colectivo = colectivoMasCercano({
                        linea,
                        colectivos: estadoLinea.colectivos
                    }, detalleParada.ubicacion);
                    
                    console.log(`Colectivo mas cercano para la linea ${linea}: ${inspect(colectivo)}`);

                    resolve(colectivo);
                });
            })
        })).then((colectivos) => {
            res.status(200).json({ colectivos})
        }).catch((err) => {
            console.log(err.message);
            res.status(500).json(err.message);
        })
    })

    // Queremos obtener, para cada linea de la parada, el próximo colectivo que va a llegar
});

app.listen(TRANSITO.puerto, () => {
    console.log(`[${TRANSITO.nombre}] escuchando en el puerto ${TRANSITO.puerto}`);
});

