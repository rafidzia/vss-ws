export interface Vehicle {
    "status": number,
    "msg": string,
    "error": string,
    "data": {
        "totalCount": number,
        "pageCount": number,
        "fromCount": number,
        "toCount": number,
        "totalNum": number,
        "pageNum": number,
        "dataList": {
            "deviceno": string,
            "devicetype": string,
        }[]
    },
    "count": number
}