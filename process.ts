import { Writer } from "nsqjs";
import { Data } from "./data";
import { createWriteStream } from "fs";
import { deviceIdToModel } from "./model";


function convertToNumber(value: string) {
    return Number(value) ?? value
}


const deviceTimeDifference: { [key: string]: number } = {}

function getTimeLocation(data: Data) {
    if (!data.payload.ext) {
        const timeDifference = deviceTimeDifference[data.payload.deviceID]
        const timeLocation = new Date(data.payload.location.dtu).getTime() + (timeDifference * 3600 * 1000)
        return timeLocation
    } else {
        const timeDtu = new Date(data.payload.dtu).getTime()
        const timestamp = new Date(data.payload.ext.reportTime).getTime()
        const timeDifference = Math.round(Math.round((timestamp - timeDtu) / 1000) / 3600)
        deviceTimeDifference[data.payload.deviceID] = timeDifference
        const timeLocation = new Date(data.payload.location.dtu).getTime() + (timeDifference * 3600 * 1000)
        return timeLocation
    }
}


export function parse(data: Data) {
    if (!data.payload.ext && !deviceTimeDifference[data.payload.deviceID]) {
        return {}
    }

    const out = {
        "position.latitude": convertToNumber(data.payload.location.latitude),
        "position.longitude": convertToNumber(data.payload.location.longitude),
        "position.speed": convertToNumber(data.payload.location.speed),
        "position.satellites": convertToNumber(data.payload.location.satellites),
        "position.direction": convertToNumber(data.payload.location.direct),

        "timestamp": getTimeLocation(data),
        "ident": data.payload.deviceID,
    }
    if (data.payload.basic) {
        // @ts-ignore
        out["engine.ignition.status"] = data.payload.basic.key === '1'
    }
    return { data: out }
}


const dataWriter = createWriteStream(`./data/data-${new Date().getTime()}.txt`)

let timestamps: {[k: string]: number} = {}


export function proceedAsFlespi(tube: string, deviceIDs: number[], data: string, client: Writer) {
    const asd = JSON.parse(data.toString()) as Data
    if (['80003', '80004'].includes(asd.action)) {
        console.log(asd.payload.module)
        if (asd.payload.module.mobile == "0") {
            console.log(asd.payload.mobile)
        }
        if (!deviceIDs.includes(Number(asd.payload.deviceID))) return
        const x = parse(asd)
        if (client && x.data) {
            if (timestamps[x.data.ident]) {
                if (timestamps[x.data.ident] - x.   data.timestamp > 60000) {
                    dataWriter.write(x.data.ident + '   ' + x.data.timestamp + '   ' + timestamps[x.data.ident] + '\n')
                }
            }
            timestamps[x.data.ident] = x.data.timestamp

            x.data.timestamp = x.data.timestamp / 1000
            const outdata = {
                data: x.data,
                identifier: x.data.ident,
                family: "flespi_mqtt",
                model: "fmb130"
            }
            console.log(outdata)
            client.publish(tube, JSON.stringify(outdata))
        }
    }
}

export function proceedAsGate(tube: string, deviceIDs: number[], data: string, client: Writer) {
    const asd = JSON.parse(data.toString()) as Data
    if (!['80003', '80004', '80005'].includes(asd.action)) return
    const model = deviceIdToModel[asd.payload.deviceID]
    const outdata = {
        data: asd,
        identifier: asd.payload.deviceID,
        family: "vss_ws",
        model
    }
    console.log(outdata)
    client.publish(tube, JSON.stringify(outdata))
}
