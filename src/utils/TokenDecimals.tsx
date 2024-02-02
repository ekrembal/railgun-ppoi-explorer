import { tokens } from './alltokens';

export function getTokenAmountString(amount: string, tokenAddress: string): string {
    const tokenAddressLower = tokenAddress.toLowerCase();
    const token = tokens.find((token) => token.i === tokenAddressLower);
    if(token === undefined){
        return amount;
    }

    return (parseInt(amount) / Math.pow(10, parseInt(token.d.toString()))).toFixed(4) + " " + token.s;
}
