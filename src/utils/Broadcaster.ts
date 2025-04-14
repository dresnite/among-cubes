import { Main } from "../Main";
import { Message } from "../messages/Message";
import { BROADCASTER_FREQUENCY } from "./config";

export class Broadcaster {

    private _timeForNextBroadcast: number;
    
    constructor() {
        this._timeForNextBroadcast = BROADCASTER_FREQUENCY;
    }

    private _getBroadcastableMessages(): string[] {
        return [
            Message.t('BROADCAST_1'),
            Message.t('BROADCAST_2'),
            Message.t('BROADCAST_3'),
            Message.t('BROADCAST_4'),
            Message.t('BROADCAST_5'),
            Message.t('BROADCAST_6'),
        ];
    }

    public handleHeartbeat(): void {
        this._timeForNextBroadcast--;

        if (this._timeForNextBroadcast <= 0) {
            this._sendBroadcast();
            this._timeForNextBroadcast = BROADCASTER_FREQUENCY;
        }
    }

    private _sendBroadcast(): void {
        const randomMessage = this._getBroadcastableMessages()[Math.floor(Math.random() * this._getBroadcastableMessages().length)];

        if (!randomMessage) {
            return;
        }

        Main.getInstance().getWorldOrThrow().chatManager.sendBroadcastMessage(randomMessage);
    }

}