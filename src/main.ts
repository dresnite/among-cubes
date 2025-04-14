import type { World } from "hytopia";
import {
  Audio,
  Entity,
  PlayerEvent,
  RigidBodyType,
  SceneUI,
} from 'hytopia';

import worldMap from '../assets/maps/themaze.json';
import { PlayerSessionManager } from "./player/PlayerSessionManager";
import { GameManager } from "./game/GameManager";
import { Broadcaster } from "./utils/Broadcaster";
import type { GameMap } from "./map/GameMap";
import { TheMaze } from "./map/maps/TheMaze";
import { EMERGENCY_BUTTON_ENTITY_NAME } from "./utils/config";
import { VoteEntitiesManager } from "./npc/VoteEntitiesManager";

export class Main {

  private static _instance: Main | null = null;

  private _world: World | null = null;
  private _gameManager: GameManager;
  private _playerSessionManager: PlayerSessionManager;
  private _broadcaster: Broadcaster;
  private _gameMap: GameMap;
  private _voteEntitiesManager: VoteEntitiesManager;

  constructor() {
    this._voteEntitiesManager = new VoteEntitiesManager();
    this._gameManager = new GameManager();
    this._playerSessionManager = new PlayerSessionManager();
    this._broadcaster = new Broadcaster();
    this._gameMap = new TheMaze();
  }


  public static initialize(world: World) {
    const loader = Main.getInstance();

    loader._loadGameWorld(world);
    loader._playBackgroundMusic(world);
    loader._setupHeartbeat();
  }

  public static getInstance(): Main {
    if (!Main._instance) {
      Main._instance = new Main();
    }

    return Main._instance;
  }

  public getWorld(): World | null {
    return this._world;
  }

  public getWorldOrThrow(): World {
    if (!this._world) {
      throw new Error('World not loaded');
    }

    return this._world;
  }

  public getGameManager(): GameManager {
    return this._gameManager;
  }

  public getPlayerSessionManager(): PlayerSessionManager {
    return this._playerSessionManager;
  }

  public getGameMap(): GameMap {
    return this._gameMap;
  }

  public getVoteEntitiesManager(): VoteEntitiesManager {
    return this._voteEntitiesManager;
  }

  private _loadGameWorld(world: World): void {
    this._world = world;
    world.loadMap(worldMap);

    this._setupWorldEvents();
    this._setupWorldEntities();
  }

  private _playBackgroundMusic(world: World): void {
    new Audio({
      uri: 'audio/music/among-cubes-theme.mp3',
      loop: true,
      volume: 0.1,
    }).play(world);
  }

  private _setupHeartbeat(): void {
    setInterval(() => {
      this._gameManager.onHeartbeat();
      this._broadcaster.handleHeartbeat();
    }, 1000);
  }

  private _setupWorldEvents(): void {
    // setInterval(() => {
    //   for (const player of this._playerSessionManager.getSessions().values()) {
    //     player.message(`Your rotation is x ${player.getPlayerEntity()?.rotation.x} y ${player.getPlayerEntity()?.rotation.y} z ${player.getPlayerEntity()?.rotation.z} w ${player.getPlayerEntity()?.rotation.w}`)
    //   }
    // }, 1000);

    this._world?.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
      const session = this._playerSessionManager.openSession(player)

      session.setupEntity();
      session.setupCamera();

      // Load our game UI for this player
      player.ui.load('ui/index.html');

      player.ui.sendData({
        openSilenceModal: true
      });
    });

    this._world?.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
      this._world?.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());

      const session = this._playerSessionManager.getSessionOrThrow(player)
      session.getGame()?.removePlayer(session)
      this._playerSessionManager.closeSession(player)
    })
  }

  private _setupWorldEntities(): void {
    const emergencyButtonEntity = new Entity({
      modelUri: 'models/environment/emergency-button.glb',
      modelScale: 2,
      name: EMERGENCY_BUTTON_ENTITY_NAME,
      opacity: 0.99,
      rigidBodyOptions: {
        type: RigidBodyType.FIXED, // This makes the entity not move
      },
    });

    emergencyButtonEntity.spawn(this._world!, this._gameMap.getEmergencyButtonCoords());

    // Create the Scene UI over the NPC
    const npcMessageUI = new SceneUI({
      templateId: 'emergency-button-entity',
      attachedToEntity: emergencyButtonEntity,
      offset: { x: 0, y: 1.75, z: 0 },
    });

    npcMessageUI.load(this._world!);

    this._voteEntitiesManager.setup()
  }

}