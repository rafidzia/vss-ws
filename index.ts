import dotenv from 'dotenv'
dotenv.config()

import ws from 'ws'
import { Writer } from 'nsqjs'
import { createHash, randomUUID } from 'crypto';
import { createWriteStream, writeFileSync } from 'fs';
import { request } from './request';
import { LoginResponse } from './login';
import { Data } from './data';
import { parse, proceedAsFlespi, proceedAsGate } from './process';
import { init } from './model';


const host = process.env.VSS_HOST || ""
const username = process.env.VSS_USER || ""

if (Boolean(process.env.FREE_LOGIN)) {
    var password = process.env.VSS_PASS || ""
} else {
    var password = createHash('md5').update(process.env.VSS_PASS || "").digest('hex')
}

const run = async () => {
    const path = Boolean(process.env.FREE_LOGIN) ? "/user/login.action" : "/user/apiLogin.action"
    init(username, password, path)
    // const loginData = await request<LoginResponse>(path, 'POST', {
    //     username: username,
    //     password: password,
    // })
    // if (!loginData.data) {
    //     console.log(loginData)
    //     return console.log('Login failed')
    // }
    // writeFileSync('./login.json', JSON.stringify(loginData))
    // console.log(loginData.data.token)
    // console.log(loginData.data.pid)

    const wsport = 36301

    const deviceIDs = [
        65254586,
        998094,
        832996,
        953750,
        // 708048854678
    ]
    let clientOut: Writer | undefined
    let clientIn: ws | undefined

    let heartbeatInterval: NodeJS.Timeout | undefined
    let lastReceiveWs: number = Date.now()

    async function wsinit() {

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

        const wsClient = new ws(`wss://${host}:${wsport}/wss`, {})
        const lastWsInterval = setInterval(() => {
            console.log(Date.now() - lastReceiveWs)
            if (Date.now() - lastReceiveWs > 30000) {
                wsClient.terminate()
                clearInterval(lastWsInterval)
            }
        }, 5000)

        wsClient.on('close', () => {
            console.log('WS closed')
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval)
                heartbeatInterval = undefined
            }
            clearInterval(lastWsInterval)
            clientIn = undefined
            wsinit()
            x()
        });

        wsClient.on('message', function message(data: string) {
        })

        wsClient.on('error', console.error);

        wsClient.on('open', function open() {
            clientIn = wsClient
            wsClient.send(JSON.stringify(
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
                heartbeatInterval = setInterval(() => {
                    wsClient.send(JSON.stringify(
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
    }
    wsinit()

    function nsqinit() {
        const nsqClient: Writer = new Writer(String(process.env.NSQ_HOST), Number(process.env.NSQ_PORT), {
            clientId: 'vss-test'
        })
    
    
        nsqClient.on('ready', () => {
            clientOut = nsqClient
        })
        nsqClient.on('error', (err) => {
            console.log(err)
        })
        nsqClient.on('closed', () => {
            console.log('NSQ closed')
            nsqinit()
        })
        nsqClient.connect()
    }
    nsqinit()



    function x() {
        if (!clientIn) {
            setTimeout(x, 1000)
        } else {
            clientIn.on('message', function message(data: string) {
                lastReceiveWs = Date.now()
                if (clientOut) {
                    // proceedAsFlespi(String(process.env.NSQ_TUBE), deviceIDs, data, clientOut)
                    proceedAsGate(String(process.env.NSQ_TUBE), deviceIDs, data, clientOut)
                }
            });
        }
    }
    x()
}

run()

