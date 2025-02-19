export interface LoginResponse {
    status: number;
    msg: string;
    error: string;
    data: {
        token: string;
        pid: string;
    }
}