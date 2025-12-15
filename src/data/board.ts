import 'dotenv/config'

/* Seed Board IDs */
const dev = {
    hkeaa: {
        token: getToken(1),
        boardIds: [
            '8871724565',
            '6907117500',
        ],
    },
    had: {
        token: getToken(2),
        boardIds: [
            '7100594965',
        ],
    },
    cic: {
        token: getToken(3),
        boardIds: [
            '3384646556',
        ],
    }
}

const prod = {
    hkeaa: {
        token: getToken(1),
        boardIds: [
            // core
            '8871724565',
            '6907117500',
            // other
            '5767070472',
            '5957471717',
            '5003677322',
            '3948084424',
            '4897947028',
            '3304086102',
            '6979305353',
            '3020945166',
            '3381521036',
            '6995563680',
        ],
    },
    had: {
        token: getToken(2),
        boardIds: [
            '7100594965',
        ],
    },
    cic: {
        token: getToken(3),
        boardIds: [
            '3384646556',
        ],
    }
}

export const seedBoardIds = {
    dev,
    prod,
}

function getToken(number: number): string {
    const token = process.env[`MONDAY_API_TOKEN_${number}`]
    if (!token) {
        return process.env.MONDAY_API_TOKEN || ''
    }
    return token
}