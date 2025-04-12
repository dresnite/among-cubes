import { Main } from "../main";
import { Message } from "../messages/Message";

export class Broadcaster {

    interval: number;
    timeForNextBroadcast: number;
    
    constructor(interval: number = 30) {
        this.interval = interval;
        this.timeForNextBroadcast = interval;
    }

    getBroadcastableMessages(): string[] {
        return [
            Message.t('BROADCAST_1'),
            Message.t('BROADCAST_2'),
            Message.t('BROADCAST_3'),
            Message.t('BROADCAST_4'),
            Message.t('BROADCAST_5'),
            Message.t('BROADCAST_6'),
        ];
    }

    handleHeartbeat(): void {
        this.timeForNextBroadcast--;

        if (this.timeForNextBroadcast <= 0) {
            this.broadcast();
            this.timeForNextBroadcast = this.interval;
        }
    }

    broadcast(): void {
        const randomMessage = this.getBroadcastableMessages()[Math.floor(Math.random() * this.getBroadcastableMessages().length)];

        if (!randomMessage) {
            return;
        }

        Main.getInstance().getWorldOrThrow().chatManager.sendBroadcastMessage(randomMessage);
    }

}