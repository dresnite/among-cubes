import { Message } from "../../../messages/Message";
import { PlayerRole } from "../../../player/PlayerRole";
import { TIME_TO_END_EMERGENCY_MEETING, TIME_TO_HIDE_EMERGENCY_MEETING_MESSAGE } from "../../../utils/config";
import { Poll } from "../../../utils/Poll";
import { ColorType } from "../../color/ColorType";
import type { Game } from "../../Game";
import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";
import { InProgressPhase } from "./InProgressPhase";

export class EmergencyMeetingPhase extends Phase {

    private _timeToHideEmergencyMeetingMessage: number;
    private _timeToEndEmergencyMeeting: number;

    private _poll: Poll;

    constructor(game: Game) {
        super(game);

        this._timeToHideEmergencyMeetingMessage = TIME_TO_HIDE_EMERGENCY_MEETING_MESSAGE;
        this._timeToEndEmergencyMeeting = TIME_TO_END_EMERGENCY_MEETING;
        this._poll = this._createImpostorPoll();
    }

    public getPhaseType(): PhaseType {
        return PhaseType.EMERGENCY_MEETING;
    }

    public onHeartbeat(): void {
        this._timeToHideEmergencyMeetingMessage--;

        if (this._timeToHideEmergencyMeetingMessage === 0) {
            this._setupEmergencyMeeting();
        } else if (this._timeToHideEmergencyMeetingMessage < 0) {
            this._runEmergencyMeeting();
        } else {
            this._displayEmergencyMeetingStartingMessages();
        }
    }

    private _displayEmergencyMeetingStartingMessages(): void {
        for (const playerSession of this._game.getPlayerSessions()) {
            playerSession.title(Message.t('EMERGENCY_MEETING_MESSAGE'));
        }
    }

    private _runEmergencyMeeting(): void {
        this._timeToEndEmergencyMeeting--;

        if (this._timeToEndEmergencyMeeting <= 0) {
            return this._endEmergencyMeeting()
        }

        for (const playerSession of this._game.getPlayerSessions()) {
            playerSession.popup(Message.t('DISCUSS_IMPOSTOR'));
            playerSession.statusBar({
                coins: playerSession.getCoins(),
                time: this._timeToEndEmergencyMeeting.toString(),
                milliseconds: 1000
            });
        }
    }

    private _endEmergencyMeeting(): void {
        // kick the most voted player here

        this._game.setPhase(new InProgressPhase(this._game));
    }

    private _setupEmergencyMeeting(): void {
        for (const playerSession of this._game.getPlayerSessions()) {
            playerSession.teleportToVotingArea();

            if (playerSession.getRole() === PlayerRole.IMPOSTOR) {
                playerSession.setKnifeVisible(false);
                playerSession.setupKnifeVisibility();
            }
        }
    }

    private _createImpostorPoll(): Poll {
        const colors: string[] = [];

        for (const color of Object.values(ColorType)) {
            colors.push(color);
        }

        return new Poll([
            ...colors,
            'none'
        ]);
    }

}
