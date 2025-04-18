import { Entity, RigidBodyType, Vector3, type Vector3Like } from "hytopia";
import type { PlayerSession } from "../../player/PlayerSession";
import { createUniqueId } from "../../utils/math";
import { Main } from "../../main";
import { InProgressPhase } from "../phase/phases/InProgressPhase";
import type { Color } from "../color/Color";

export class Cadaver {

    private _uniqueId: string;
    private _entity: Entity | null;
    private _color: Color;
    private _position: Vector3Like;
    private _spawned: boolean;

    constructor(color: Color, position: Vector3Like) {
        this._uniqueId = createUniqueId();
        this._entity = null;
        this._color = color;
        this._position = position;
        this._spawned = false;
    }

    public getUniqueId(): string {
        return this._uniqueId;
    }

    public getColor(): Color {
        return this._color;
    }

    public onTouch(playerSession: PlayerSession): void {
        if (!this._spawned) {
            return;
        }

        const game = playerSession.getGame();

        if (!game) {
            return;
        }

        const phase = game.getPhase();

        if (phase instanceof InProgressPhase) {
            phase.onCadaverReport(playerSession, this);
        }
    }

    public spawn(): void {
        console.log('spawning cadaver with id', this._uniqueId, ' and color', this._color.getSkinPath());

        this._entity = new Entity({
            modelUri: this._color.getSkinPath(),
            modelScale: 0.5,
            name: this._uniqueId,
            modelLoopedAnimations: ['sleep'],
            rigidBodyOptions: {
                type: RigidBodyType.FIXED,
            },
        })

        this._entity.spawn(Main.getInstance().getWorldOrThrow(), {
            x: this._position.x,
            y: Main.getInstance().getGameMap().getCadaverSpawnY(),
            z: this._position.z,
        });

        this._spawned = true;
    }

    public despawn(): void {
        if (!this._spawned) {
            return;
        }

        if (!this._entity) {
            throw new Error(`Could not despawn cadaver of ${this._uniqueId} because it had no entity`)
        }

        this._entity.despawn();
        this._entity = null;
        this._spawned = false;
    }
}