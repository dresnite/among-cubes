import { Main } from "../Main";
import type { GameMap } from "../map/GameMap";
import { TeleportStation } from "./TeleportStation";

export class TeleportStationManager {

    // Map of unique id to teleport station
    private _stations: Map<string, TeleportStation> = new Map();

    public getStation(uniqueId: string): TeleportStation | null {
        return this._stations.get(uniqueId) || null;
    }

    public setupStations(): void {
        console.log('Setting up stations...')

        for (const stationPair of Main.getInstance().getGameMap().getTeleportStations()) {
            console.log('Loading station...')

            const station1 = new TeleportStation(stationPair.station1.teleportTarget);
            const station2 = new TeleportStation(stationPair.station2.teleportTarget);

            station1.spawn(stationPair.station1.position, stationPair.station1.rotation);
            station2.spawn(stationPair.station2.position, stationPair.station2.rotation);

            this._stations.set(station1.getUniqueId(), station1);
            this._stations.set(station2.getUniqueId(), station2);

            station1.setStationLinked(station2);
            station2.setStationLinked(station1);
        }
    }

}