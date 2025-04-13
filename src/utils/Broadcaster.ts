import { Main } from "../Main";
import { Message } from "../messages/Message";

export class Broadcaster {

    private _interval: number;
    private _timeForNextBroadcast: number;
    
    constructor(interval: number) {
        this._interval = interval;
        this._timeForNextBroadcast = interval;
    }

    private getBroadcastableMessages(): string[] {
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
            this.broadcast();
            this._timeForNextBroadcast = this._interval;
        }
    }

    private broadcast(): void {
        const randomMessage = this.getBroadcastableMessages()[Math.floor(Math.random() * this.getBroadcastableMessages().length)];

        if (!randomMessage) {
            return;
        }

        Main.getInstance().getWorldOrThrow().chatManager.sendBroadcastMessage(randomMessage);
    }

}