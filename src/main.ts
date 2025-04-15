import type { Vector3Like, World } from "hytopia";
import {
  Audio,
  Entity,
  PlayerEvent,
  RigidBodyType,
  SceneUI,
  EntityEvent,
  ColliderShape,
  type BlockType,
  PlayerEntity,
} from 'hytopia';

import worldMap from '../assets/maps/spaceship.json';
import { PlayerSessionManager } from "./player/PlayerSessionManager";
import { GameManager } from "./game/GameManager";
import { Broadcaster } from "./utils/Broadcaster";
import type { GameMap } from "./map/GameMap";
import { Spaceship } from "./map/maps/Spaceship";
import { COIN_ENTITY_NAME, COIN_SPAWN_TIME, EMERGENCY_BUTTON_ENTITY_NAME } from "./utils/config";
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
    this._gameMap = new Spaceship();
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

    this._setupWorldLighting();
    this._setupWorldEvents();
    this._setupWorldEntities();
  }

  private _playBackgroundMusic(world: World): void {
    new Audio({
      uri: 'audio/music/shadows-on-the-wall.mp3',
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

  private _setupWorldLighting(): void {
    this._world!.setAmbientLightIntensity(5);
    this._world!.setAmbientLightColor({ r: 20, g: 40, b: 60 });
    this._world!.setDirectionalLightIntensity(1);
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

    for (const coinCoords of this._gameMap.getCoinCoords()) {
      this._spawnCoin(coinCoords);
    }

    this._voteEntitiesManager.setup()
  }

  private _spawnCoin(coinCoords: Vector3Like): void {
    const coinEntity = new Entity({
      modelUri: 'models/environment/coin.glb',
      modelScale: 1,
      name: COIN_ENTITY_NAME,
      opacity: 0.99,
      rigidBodyOptions: {
        type: RigidBodyType.KINEMATIC_POSITION,
        colliders: [
          {
            shape: ColliderShape.CYLINDER,
            radius: 0.5,
            halfHeight: 0.5,
            isSensor: true,
            onCollision: (other: Entity | BlockType, started: boolean) => {
              if (started && other instanceof PlayerEntity) {
                // Find player session and add coin
                const playerSession = this._playerSessionManager.getSession(other.player);
                if (playerSession) {
                  playerSession.addCoin();

                  // Despawn the coin
                  coinEntity.despawn();

                  // Respawn after 15 seconds
                  setTimeout(() => {
                    this._spawnCoin(coinCoords);
                  }, COIN_SPAWN_TIME);
                }
              }
            }
          }]
      },
    });

    const spawnPosition = {
      x: coinCoords.x,
      y: coinCoords.y + 1,
      z: coinCoords.z,
    };

    coinEntity.spawn(this._world!, spawnPosition);

    // Add floating and rotation animation
    coinEntity.on(EntityEvent.TICK, ({ tickDeltaMs }) => {
      const rotationSpeed = 0.001; // radians per ms
      const floatHeight = 0.2; // meters
      const floatSpeed = 0.001; // Hz

      // Update position with floating motion
      const newY = spawnPosition.y + Math.sin(Date.now() * floatSpeed) * floatHeight;
      coinEntity.setPosition({
        x: coinEntity.position.x,
        y: newY,
        z: coinEntity.position.z,
      });

      // Update rotation around Y axis
      const yRotation = (Date.now() * rotationSpeed) % (Math.PI * 2);
      coinEntity.setRotation({ x: 0, y: Math.sin(yRotation / 2), z: 0, w: Math.cos(yRotation / 2) });
    });
  }

}