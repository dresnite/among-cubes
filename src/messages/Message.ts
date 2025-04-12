import { en_en } from "./languages/en_en";

type Args = {
    [key: string]: string;
}

export class Message {

    id: string;
    args: Args;

    static t(id: string, args: Args): string {
        return new Message(id, args).toString();
    }

    constructor(id: string, args: Args) {
        this.id = id;
        this.args = args;
    }

    toString(): string {
        const translation = en_en[this.id as keyof typeof en_en];

        if (!translation) {
            throw new Error(`Translation for ${this.id} not found`);
        }

        return translation.replace(/{(\w+)}/g, (match, key) => {
            return this.args[key] || match;
        });
    }
    
    
}
