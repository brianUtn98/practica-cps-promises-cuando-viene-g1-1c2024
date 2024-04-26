const express = require('express');
const fs = require('fs');
const { SERVICIOS } = require('../config');
const { healthCheck } = require('../middleware.js');
const { actualizarUbicaciones } = require('./actualizarUbicaciones');

const LINEAS = SERVICIOS.lineas;

const lineasDb = {
    // linea: string, callback (err, data): void
    buscarPorLinea(linea, callback) {
        fs.readFile("lineas.db.json", "utf-8", (err, data) => {
            if(err){
                return callback(new Error("Error al leer archivo"))
            }

            const lineas = JSON.parse(data);

            if(lineas[linea] === undefined){
                return callback(new Error(`No se encontró la línea ${linea}`))
            }

            callback(null, lineas[linea])
        });
    }
};

const app = new express();

app.use(healthCheck);

app.get('/lineas/:linea', (req, res) => {
    const linea = req.params.linea;
    
    lineasDb.buscarPorLinea(linea, (err, estadoLinea) => {
        if (err) {
            console.log(err.message);
            res.status(404).json(err.message);
        } else {
            res.json(estadoLinea);
        }
    });    
});

app.listen(LINEAS.puerto, () => {
    console.log(`[${LINEAS.nombre}] escuchando en el puerto ${LINEAS.puerto}`);
    actualizarUbicaciones();
});
