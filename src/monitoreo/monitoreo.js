const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { get } = require('../request');
const { SERVICIOS } = require('../config');
const { inspect } = require('util');


const MONITOREO = SERVICIOS.monitoreo;

const app = new express();

app.get('/', (res, req) => {
    req.sendFile('index.html', { root: __dirname });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function mensaje(contenido) {
    const esTexto = typeof contenido === 'string';
    return JSON.stringify({ msg: contenido, type: esTexto ? 'texto' : 'estados' });
}

wss.on('connection', (ws) => {
    ws.send(mensaje('¡Conectado al monitoreo de servicios!'));

    setInterval(() => {
        Promise.all(Object.entries(SERVICIOS).filter(([nombre, _]) => nombre !== "monitoreo").map(([nombre, servicio]) => {
            return new Promise((resolve, reject) => {
                get(servicio, "/health", (err, data) => {
                    if(err){
                        console.log(`[${nombre}] error: ${err.message}`);
                        resolve({
                            servicio: servicio.nombre,
                            status: "DOWN",
                        });
                    } else {
                        console.log(`[${nombre}] status: ${inspect(data)}`);
                        resolve({
                            servicio: servicio.nombre, 
                            status: data.status,
                        });
                    }
                })
            }).then((estado) => {
               return estado;
            })
        })).then((estados) => {
        console.log
           ws.send(JSON.stringify({
            type: "estados",
            msg: {
                estados
            }
           }))
        })
        ws.send(mensaje('Hey'));
    }, 1000);

    ws.on('close', () => {
        console.log('Se cerró una conexión');
    });
});

server.listen(MONITOREO.puerto, () => {
    console.log(`[${MONITOREO.nombre}] escuchando en el puerto ${MONITOREO.puerto}`);
});

