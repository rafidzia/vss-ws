export interface Data {
    action: string
    payload: {
        deviceID: string
        nodeID: string
        dtu: string
        location: {
            mode: string
            dtu: string
            direct: string
            satellites: string
            speed: string
            altitude: string
            precision: string
            longitude: string
            latitude: string
        }
        gsensor: {
            x: string
            y: string
            z: string
            tilt: string
            hit: string
        }
        basic: {
            key: string
        }
        module: {
            mobile: string
            location: string
            wifi: string
            gsensor: string
            record: string
        }
        fuel: {
            cost: string
        }
        mobile: {
            type: string
            strength: string
        }
        wifi: {
            strength: string
            ip: string
            mask: string
            gateway: string
            ssid: string
        }
        storage: [
            {
                name: string
                index: string
                status: string
                total: string
                free: string
            }
        ]
        alarm: {
            videoLost: string
            motionDection: string
            videoMask: string
            input: string
            overSpeed: string
            lowSpeed: string
            urgency: string
        }
        mileage: {
            todayDay: string
            total: string
        }
        voltage: {
            vcc: string
            bat: string
            vo1: string
            vo2: string
        }
        driver: {
            id: string
            name: string
        }
        bluetooth: {
            connect: string
        }
        load: {
            status: string
        }


        // only for 80004
        isLater: boolean
        eventType: string

        payload: {
            st: string
            det: {
                ch: string
            }
            dtu: string
            drid: string
            drname: string
            spds: string
            uuid: string
            ec: number
            et: string
        }
        alarmID: string
        alarmDetail: string


        // only for 80003
        ext: {
            isLater: boolean
            reportTime: string
        }
    }
}