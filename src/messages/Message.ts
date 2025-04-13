import { en_en } from "./languages/en_en";

type Args = {
    [key: string]: string;
}

export class Message {

    private _id: string;
    private _args: Args;

    public static t(id: string, args?: Args): string {
        return new Message(id, args ?? {}).toString();
    }

    constructor(id: string, args: Args) {
        this._id = id;
        this._args = args;
    }

    toString(): string {
        const translation = en_en[this._id as keyof typeof en_en];

        if (!translation) {
            throw new Error(`Translation for ${this._id} not found`);
        }

        return translation.replace(/{(\w+)}/g, (match, key) => {
            return this._args[key] || match;
        });
    }
    
    
}
