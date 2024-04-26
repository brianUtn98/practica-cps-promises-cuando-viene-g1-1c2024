const http = require('http');
const { resolve } = require('path');

/**
 * Alguien nos dejó esta implementación de un GET en node.
 * ¡No cambiar interfaz!
 */
function get(servicio, ruta, cb) {
    const opciones = {
        hostname: servicio.host,
        port: servicio.puerto,
        path: ruta,
        method: 'GET',
    };

    const req = http.request(opciones, res => {
        if (res.statusCode !== 200) {
            return cb(new Error(`Request a ${servicio.nombre}${ruta} respondió ${res.statusCode}`));
        }
        let body = '';
        res
            .on('data', chunk => {
                body += chunk;
            })
            .on('end', () => {
                try {
                    cb(null, JSON.parse(body));
                } catch (e) {
                    cb(e);
                }
            });
    });
    req.on('error', error => {
        cb(error);
    });
    req.end();
}

function fetch(servicio, ruta){
    const opciones = {
        hostname: servicio.host,
        port: servicio.puerto,
        path: ruta,
        method: 'GET',
    };

    return new Promise((resolve, reject) => {
        const req = http.request(opciones, res => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Request a ${servicio.nombre}${ruta} respondió ${res.statusCode}`));
            }
            let body = '';
            res
                .on('data', chunk => {
                    body += chunk;
                })
                .on('end', () => {
                    try {
                        resolve(null, JSON.parse(body));
                    } catch (e) {
                        reject(e);
                    }
                });
        });
        req.on('error', error => {
            reject(error);
        });
        req.end();
    })
}

function getWithTimeout(servicio, ruta, timeout, cb) {
    Promise.race([
        fetch(servicio, ruta),
        new Promise((resolve,_) => {
            setTimeout(() => {
                resolve(new Error("Timeout"), null);
            }, timeout);
        })
    ]).then((err, data) => {
        if(err){
            cb(err, null);
            console.log(err.message);
        } else {
            console.log(data);
            cb(null, data);
        }
    })
}

module.exports = {
    get,
    getWithTimeout
};
