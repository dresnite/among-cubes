import { Entity, RigidBodyType, SceneUI, type QuaternionLike, type Vector3Like } from "hytopia";
import { createUniqueId } from "../utils/math";
import { Main } from "../main";
import type { PlayerSession } from "../player/PlayerSession";
import { TELEPORT_STATION_COST } from "../utils/config";
import { Message } from "../messages/Message";

export class TeleportStation {

    private _uniqueId: string;
    private _entity: Entity | null = null;
    private _teleportTarget: Vector3Like;
    private _stationLinked: TeleportStation | null = null;

    constructor(teleportTarget: Vector3Like) {
        this._uniqueId = createUniqueId();
        this._teleportTarget = teleportTarget;
    }

    public getUniqueId(): string {
        return this._uniqueId;
    }

    public getStationLinked(): TeleportStation | null {
        return this._stationLinked;
    }

    public getTeleportTarget(): Vector3Like {
        return this._teleportTarget;
    }

    public setStationLinked(station: TeleportStation): void {
        this._stationLinked = station;
    }

    public use(session: PlayerSession): void {
        if (!this._stationLinked) {
            console.log(`Tried to use a teleport station but it is not linked to another station`);
            return;
        }

        if (session.useCoins(TELEPORT_STATION_COST)) {
            session.getPlayerEntity()?.setPosition(this._stationLinked.getTeleportTarget());
        } else {
            session.popup(Message.t("TELEPORT_STATION_NO_COINS", {
                cost: TELEPORT_STATION_COST.toString()
            }))
        }
    }

    public spawn(position: Vector3Like, rotation: QuaternionLike): void {
        console.log(`Spawning teleport station ${this._uniqueId} at ${position.x}, ${position.y}, ${position.z}`);

        const world = Main.getInstance().getWorldOrThrow();

        this._entity = new Entity({
            modelUri: 'models/environment/teleport-station.glb',
            modelScale: 4,
            name: this._uniqueId,
            opacity: 0.99,
            rigidBodyOptions: {
                type: RigidBodyType.FIXED, // This makes the entity not move
                rotation,
            },
        });

        this._entity.spawn(world, position);
        this._entity.setRotation(rotation);

        // Create the Scene UI over the NPC
        const sceneUI = new SceneUI({
            templateId: 'teleport-station-entity',
            attachedToEntity: this._entity,
            offset: { x: 0, y: 2.5, z: 0 },
        });

        sceneUI.load(world);
    }

}

