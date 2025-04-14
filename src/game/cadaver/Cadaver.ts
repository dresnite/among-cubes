import { Entity, RigidBodyType } from "hytopia";
import type { PlayerSession } from "../../player/PlayerSession";
import { createUniqueId } from "../../utils/math";
import { Main } from "../../Main";

export class Cadaver {

    private _uniqueId: string;
    private _entity: Entity | null;
    private _playerSession: PlayerSession;

    constructor(playerSession: PlayerSession) {
        this._uniqueId = createUniqueId();
        this._entity = null;
        this._playerSession = playerSession;
    }

    public getUniqueId(): string {
        return this._uniqueId;
    }
    
    public spawn(): void {
        const color = this._playerSession.getColor();

        if (!color) {
            throw new Error(`Could not spawn cadaver of ${this._playerSession.getPlayer().username} because they had no color`)
        }

        const cadaver = new Entity({
            modelUri: color.getSkinPath(),
            modelScale: 0.8,
            name: this._uniqueId,
            modelLoopedAnimations: ['sleep'],
            rigidBodyOptions: {
                type: RigidBodyType.FIXED, 
            },
        })

        const playerEntity = this._playerSession.getPlayerEntity();

        if (!playerEntity) {
            throw new Error(`Could not spawn cadaver of ${this._playerSession.getPlayer().username} because they had no player entity`)
        }

        cadaver.spawn(Main.getInstance().getWorldOrThrow(), {
            x: playerEntity.position.x,
            y: Main.getInstance().getGameMap().getCadaverSpawnY(),
            z: playerEntity.position.z,
        });
    }

    public despawn(): void {
        if (!this._entity) {
            throw new Error(`Could not despawn cadaver of ${this._uniqueId} because it had no entity`)
        }

        this._entity.despawn();
        this._entity = null;
    }
}