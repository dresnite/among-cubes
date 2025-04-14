import { Main } from "../../../Main";
import { Message } from "../../../messages/Message";
import type { PlayerSession } from "../../../player/PlayerSession";
import { MINIMUM_PLAYERS_TO_START_GAME } from "../../../utils/config";
import { ColorType } from "../../color/ColorType";
import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";
import { MinimumPlayersReachedPhase } from "./MinimumPlayersReachedPhase";

export class WaitingForPlayersPhase extends Phase {

    public getPhaseType(): PhaseType {
        return PhaseType.WAITING_FOR_PLAYERS;
    }

    public onHeartbeat(): void {
        for (const playerSession of this._game.getPlayerSessions()) {
            playerSession.popup(Message.t('WAITING_FOR_PLAYERS', {
                playerCount: this._game.getPlayerSessions().length.toString(),
                maxPlayers: Object.keys(ColorType).length.toString()
            }));
        }

        for (const playerSession of Main.getInstance().getPlayerSessionManager().getSessions().values()) {
            if (!playerSession.getGame() && this._game.canBeJoined()) {
                this._game.addPlayer(playerSession);
            }
        }
    }

    public onJoin(playerSession: PlayerSession): void {
        this.sendPlayerJoinAchievement(playerSession);
        this.makeSurePlayersHaveNoKnife();
        
        if (this._game.getPlayerSessions().length >= MINIMUM_PLAYERS_TO_START_GAME) {
            Main.getInstance().getWorld()?.chatManager.sendBroadcastMessage(Message.t('MINIMUM_PLAYERS_REACHED'))
            this._game.setPhase(new MinimumPlayersReachedPhase(this._game));
        }
    }

    public onChangePhase(): void {
        for (const playerSession of this._game.getPlayerSessions()) {
            playerSession.setupEntity();
        }
    }

}