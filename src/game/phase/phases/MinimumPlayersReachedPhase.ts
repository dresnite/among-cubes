import { Main } from "../../../Main";
import { Message } from "../../../messages/Message";
import type { PlayerSession } from "../../../player/PlayerSession";
import { COUNTDOWN_START_GAME, COUNTDOWN_TO_START_WITH_MINIMUM_PLAYERS, MINIMUM_PLAYERS_TO_START_GAME } from "../../../utils/config";
import type { Game } from "../../Game";
import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";
import { CountdownPhase } from "./CountdownPhase";
import { WaitingForPlayersPhase } from "./WaitingForPlayersPhase";

export class MinimumPlayersReachedPhase extends Phase {

    private _countdown: number;

    constructor(game: Game) {
        super(game);
        this._countdown = COUNTDOWN_TO_START_WITH_MINIMUM_PLAYERS;
    }

    public getPhaseType(): PhaseType {
        return PhaseType.MINIMUM_PLAYERS_REACHED;
    }

    public handleHeartbeat(): void {
        this._countdown--;

        if (this._countdown > 0) {
            for (const playerSession of this._game.getPlayerSessions()) {
                playerSession.popup(Message.t('MINIMUM_PLAYERS_REACHED_COUNTDOWN', {
                    countdown: (this._countdown + COUNTDOWN_START_GAME - 1).toString()
                }));
            }
        } else {
            this._game.setPhase(new CountdownPhase(this._game));
        }
    }

    public handleJoin(playerSession: PlayerSession): void {
        this.sendPlayerJoinAchievement(playerSession);
        this.makeSurePlayersHaveNoKnife();

        if (this._game.getAvailableColors().length === 0) {
            this._game.setPhase(new CountdownPhase(this._game));
        }
    }

    public handleLeave(playerSession: PlayerSession): void {
        if (this._game.getPlayerSessions().length < MINIMUM_PLAYERS_TO_START_GAME) {
            Main.getInstance().getWorld()?.chatManager.sendBroadcastMessage(Message.t('COULD_NOT_START_WITH_MINIMUM_PLAYERS'))
            this._game.setPhase(new WaitingForPlayersPhase(this._game));
        }
    }
    
}   