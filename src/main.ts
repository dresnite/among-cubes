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
import { CAMERA_ENTITY_NAME, COIN_ENTITY_NAME, COIN_SPAWN_TIME, COMPUTER_ENTITY_NAME, EMERGENCY_BUTTON_ENTITY_NAME, XP_PER_COIN } from "./utils/config";
import { VoteEntitiesManager } from "./npc/VoteEntitiesManager";

export class Main {

  private static _instance: Main | null = null;

  private _world: World | null = null;
  private _gameManager: GameManager;
  private _playerSessionManager: PlayerSessionManager;
  private _broadcaster: Broadcaster;
  private _gameMap: GameMap;
  private _voteEntitiesManager: VoteEntitiesManager;
  private _cameraEntity: Entity | null = null;

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

  public getCameraEntity(): Entity | null {
    return this._cameraEntity;
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
      
      session.getExperienceManager().load()
      session.setupEntity();

      // Load our game UI for this player
      player.ui.load('ui/index.html');

      session.openSilenceModal()
    });

    this._world?.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
      this._world?.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());

      const session = this._playerSessionManager.getSessionOrThrow(player)
      session.getExperienceManager().save()
      session.getGame()?.removePlayer(session)
      this._playerSessionManager.closeSession(player)
    })
  }

  private _setupWorldLighting(): void {
    // Set very low ambient light to simulate darkness of space
    this._world?.setAmbientLightIntensity(3);
    // Deep blue tint for ambient light
    this._world!.setAmbientLightColor({ r: 10, g: 10, b: 40 });
    // Bright directional light to simulate distant stars/sun
    this._world!.setDirectionalLightIntensity(1.5);
    // Add slight blue tint to directional light
    this._world!.setDirectionalLightColor({ r: 200, g: 200, b: 255 });
  }

  private _setupWorldEntities(): void {
    this._cameraEntity = new Entity({
      modelUri: 'models/environment/camera.glb',
      modelScale: 1,
      name: CAMERA_ENTITY_NAME,
      opacity: 0.99,
      rigidBodyOptions: {
        type: RigidBodyType.FIXED, // This makes the entity not move
      },
    });

    this._cameraEntity.spawn(this._world!, this._gameMap.getCameraCoords());

    const computerEntity = new Entity({
      modelUri: 'models/environment/computer.glb',
      modelScale: 1.8,
      name: COMPUTER_ENTITY_NAME,
      opacity: 0.99,
      rigidBodyOptions: {
        type: RigidBodyType.FIXED, // This makes the entity not move
      },
    });

    computerEntity.spawn(this._world!, this._gameMap.getComputerCoords());

    // Create the Scene UI over the NPC
    const computerMessageUI = new SceneUI({
      templateId: 'computer-entity',
      attachedToEntity: computerEntity,
      offset: { x: 0, y: 1.75, z: 0 },
    });

    computerMessageUI.load(this._world!);
    

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
                  playerSession.getExperienceManager().addExperience(XP_PER_COIN);

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