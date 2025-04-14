import { Message } from "../../../messages/Message";
import { PlayerRole } from "../../../player/PlayerRole";
import type { PlayerSession } from "../../../player/PlayerSession";
import { TIME_TO_END_EMERGENCY_MEETING, TIME_TO_HIDE_EMERGENCY_MEETING_MESSAGE } from "../../../utils/config";
import { Poll } from "../../../utils/Poll";
import { capitalize } from "../../../utils/text";
import type { Cadaver } from "../../cadaver/Cadaver";
import type { Color } from "../../color/Color";
import { ColorType } from "../../color/ColorType";
import type { Game } from "../../Game";
import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";
import { InProgressPhase } from "./InProgressPhase";

export class EmergencyMeetingPhase extends Phase {

    private _timeToHideEmergencyMeetingMessage: number;
    private _timeToEndEmergencyMeeting: number;

    private _poll: Poll;

    private _requesterColor: Color;
    private _requesterName: string;
    
    private _cadaver: Cadaver | null;

    public static readonly SKIP_OPTION = 'skip';

    constructor(game: Game, requester: PlayerSession, cadaver: Cadaver | null = null) {
        super(game);

        this._timeToHideEmergencyMeetingMessage = TIME_TO_HIDE_EMERGENCY_MEETING_MESSAGE;
        this._timeToEndEmergencyMeeting = TIME_TO_END_EMERGENCY_MEETING;

        this._poll = this._createImpostorPoll();

        this._requesterColor = requester.getColor()!;
        this._requesterName = requester.getPlayer().username;

        this._cadaver = cadaver;
    }

    public getPhaseType(): PhaseType {
        return PhaseType.EMERGENCY_MEETING;
    }

    public getPoll(): Poll {
        return this._poll;
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
            if (this._cadaver) {
                const bodyColor = this._cadaver.getColor().getType().toString();

                playerSession.title(Message.t('DEAD_BODY_FOUND', {
                    color: bodyColor
                }));
                playerSession.popup(Message.t('DEAD_BODY_FOUND_BY', {
                    color: capitalize(bodyColor),
                    requester: this._requesterName
                }));
            } else {
                playerSession.title(Message.t('EMERGENCY_MEETING_MESSAGE'));
                playerSession.popup(Message.t('EMERGENCY_MEETING_REQUESTED_BY', {
                    requester: this._requesterName,
                    color: capitalize(this._requesterColor.getType().toString())
                }));
            }
        }
    }

    private _runEmergencyMeeting(): void {
        this._timeToEndEmergencyMeeting--;

        if (this._timeToEndEmergencyMeeting <= 0) {
            return this._endEmergencyMeeting()
        }

        for (const playerSession of this._game.getPlayerSessions()) {
            if (this._poll.hasVoted(playerSession)) {
                playerSession.popup(Message.t('IMPOSTER_VOTED', {
                    color: capitalize(this._poll.getVotedOption(playerSession)!)
                }));
            } else {
                playerSession.popup(Message.t('DISCUSS_IMPOSTOR'));
            }

            playerSession.statusBar({
                coins: playerSession.getCoins(),
                time: this._timeToEndEmergencyMeeting.toString(),
                milliseconds: 1000
            });
        }
    }

    private _endEmergencyMeeting(): void {
        const options = this._poll.getMostVotedOptions()

        if (options.length === 1) {
            const winnerOption = options.shift()

            if (winnerOption === EmergencyMeetingPhase.SKIP_OPTION) {
                this._endEmergencyMeetingWithDraw();
            } else {
                // kick the winner color 
                const winnerColor = winnerOption as ColorType;
                this._endEmergencyMeetingWithKick(winnerColor);
            }
        } else {
            this._endEmergencyMeetingWithDraw();
        }

        this._game.setPhase(new InProgressPhase(this._game, false));
    }

    private _endEmergencyMeetingWithDraw(): void {
        // draw
    }

    private _endEmergencyMeetingWithKick(color: ColorType): void {
        for (const playerSession of this._game.getPlayerSessions()) {
            if (playerSession.getColor()?.getType() === color) {
                playerSession.teleportToWaitingRoom();
                playerSession.message(Message.t('YOU_WERE_VOTED_OUT'));

                this._game.removePlayer(playerSession);
            }
        }
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
            EmergencyMeetingPhase.SKIP_OPTION
        ]);
    }

}
