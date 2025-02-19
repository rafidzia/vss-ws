
const host = process.env.VSS_HOST || ""


export function request<T>(path: string, method: string, data: { [key: string]: string | number | boolean }): Promise<T> {
    const url = `https://${host}/vss` + path
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                "Referer": host
            },
            body: Object.keys(data).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key])).join('&')
        })
        .then(res => res.json())
        .then(resolve)
        .catch(reject)
    })
}