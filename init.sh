#!/bin/bash

/usr/local/bin/http-server ./www -p 9090 -a 192.168.1.30 -s & echo $! >> http-server.pid

/usr/local/bin/node ./service/app.js & echo $! >> service.pid

