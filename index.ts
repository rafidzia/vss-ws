import dotenv from 'dotenv'
dotenv.config()

import ws from 'ws'
import crypto from 'crypto';
import { writeFileSync } from 'fs';
import { request } from './request';
import { LoginResponse } from './login';


const host = process.env.VSS_HOST || ""
const username = process.env.VSS_USER || ""

if (Boolean(process.env.FREE_LOGIN)) {
    var password = process.env.VSS_PASS || ""
} else {
    var password = crypto.createHash('md5').update(process.env.VSS_PASS || "").digest('hex')
}


const run = async () => {
    const path = Boolean(process.env.FREE_LOGIN) ? "/user/login.action" : "/user/apiLogin.action"
    const loginData = await request<LoginResponse>(path, 'POST', {
        username: username,
        password: password,
    })
    if (!loginData.data) {
        console.log(loginData)
        return console.log('Login failed')
    }
    writeFileSync('./login.json', JSON.stringify(loginData))
    console.log(loginData.data.token)
    console.log(loginData.data.pid)

    const wsport = 36301

    const wsclient = new ws(`wss://${host}:${wsport}/wss`, {})

    wsclient.on('close', console.log);

    wsclient.on('error', console.error);

    wsclient.on('open', function open() {
        wsclient.send(JSON.stringify(
            {
                action: 80000,
                payload:
                {
                    username: username,
                    pid: loginData.data.pid,
                    token: loginData.data.token
                }
            }
        ));

        if (Boolean(process.env.HEARTBEAT)) {
            setInterval(() => {
                wsclient.send(JSON.stringify(
                    {
                        action: 80009,
                        payload:
                        {
                            username: username,
                            token: loginData.data.token
                        }
                    }
                ))
            }, 1000 * 60)
        }
    });

    wsclient.on('message', function message(data) {
        console.log('received: %s', data);
    });
}

run()

