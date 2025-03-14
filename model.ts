import { LoginResponse } from "./login"
import { request } from "./request"
import { Vehicle } from "./vehicle"


export const deviceIdToModel: { [key: string]: string } = {}

export function init(username: string, password: string, path: string) {
    async function start() {
        const loginData = await request<LoginResponse>(path, 'POST', {
            username: username,
            password: password,
        })
        if (!loginData.data) {
            console.log(loginData)
            return console.log('Login failed')
        }


        const vehicleData = await request<Vehicle>('/vehicle/findAll.action?pageNum=-1&pageCount=-1&token=' + loginData.data.token + '&scheme=https&lang=en', 'GET', {})
        for (let i = 0; i < vehicleData.data.dataList.length; i++) {
            if (deviceIdToModel[vehicleData.data.dataList[i].deviceno]) continue
            deviceIdToModel[vehicleData.data.dataList[i].deviceno] = vehicleData.data.dataList[i].devicetype
        }
    }

    start()

    setInterval(() => {
        start()
    }, 15*60*1000)
}