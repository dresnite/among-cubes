import { Main } from "../Main";
import type { GameMap } from "../map/GameMap";
import { TeleportStation } from "./TeleportStation";

export class TeleportStationManager {

    // Map of unique id to teleport station
    private _stations: Map<string, TeleportStation> = new Map();

    public constructor(gameMap: GameMap) {
        this.setupStations(gameMap);
    }

    public getStation(uniqueId: string): TeleportStation | null {
        return this._stations.get(uniqueId) || null;
    }

    public setupStations(gameMap: GameMap): void {
        for (const station of gameMap.getTeleportStations()) {
            const station1 = new TeleportStation(station.station1.teleportTarget);
            const station2 = new TeleportStation(station.station2.teleportTarget);

            this._stations.set(station1.getUniqueId(), station1);
            this._stations.set(station2.getUniqueId(), station2);

            station1.setStationLinked(station2);
            station2.setStationLinked(station1);
        }
    }

}