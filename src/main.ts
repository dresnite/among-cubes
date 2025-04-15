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

/**
 * Main game class that serves as the core controller for the Among Cubes game.
 * Implements the Singleton pattern to ensure only one instance exists.
 * Manages the game world, entities, players, and core game systems.
 */
export class Main {
  /** Singleton instance of the Main class */
  private static _instance: Main | null = null;

  /** Reference to the game world */
  private _world: World | null = null;
  /** Manages game state and core game logic */
  private _gameManager: GameManager;
  /** Manages player sessions and their states */
  private _playerSessionManager: PlayerSessionManager;
  /** Handles broadcasting messages to players */
  private _broadcaster: Broadcaster;
  /** Manages the game map and its features */
  private _gameMap: GameMap;
  /** Manages voting-related entities and mechanics */
  private _voteEntitiesManager: VoteEntitiesManager;
  /** Reference to the security camera entity */
  private _cameraEntity: Entity | null = null;

  /**
   * Initializes core game components and managers.
   * This constructor is private and should only be called through getInstance().
   */
  constructor() {
    this._voteEntitiesManager = new VoteEntitiesManager();
    this._gameManager = new GameManager();
    this._playerSessionManager = new PlayerSessionManager();
    this._broadcaster = new Broadcaster();
    this._gameMap = new Spaceship();
  }

  /**
   * Initializes the game world and sets up core systems.
   * This is the main entry point for starting the game.
   * @param world - The Hytopia world instance to initialize
   */
  public static initialize(world: World) {
    const loader = Main.getInstance();

    loader._loadGameWorld(world);
    loader._playBackgroundMusic(world);
    loader._setupHeartbeat();
  }

  /**
   * Gets the singleton instance of the Main class.
   * Creates a new instance if one doesn't exist.
   * @returns The singleton instance of Main
   */
  public static getInstance(): Main {
    if (!Main._instance) {
      Main._instance = new Main();
    }

    return Main._instance;
  }

  /**
   * Gets the current world instance.
   * @returns The current world instance or null if not initialized
   */
  public getWorld(): World | null {
    return this._world;
  }

  /**
   * Gets the current world instance or throws if not initialized.
   * @throws Error if world is not initialized
   * @returns The current world instance
   */
  public getWorldOrThrow(): World {
    if (!this._world) {
      throw new Error('World not loaded');
    }

    return this._world;
  }

  /**
   * Gets the game manager instance.
   * @returns The GameManager instance
   */
  public getGameManager(): GameManager {
    return this._gameManager;
  }

  /**
   * Gets the player session manager instance.
   * @returns The PlayerSessionManager instance
   */
  public getPlayerSessionManager(): PlayerSessionManager {
    return this._playerSessionManager;
  }

  /**
   * Gets the game map instance.
   * @returns The GameMap instance
   */
  public getGameMap(): GameMap {
    return this._gameMap;
  }

  /**
   * Gets the vote entities manager instance.
   * @returns The VoteEntitiesManager instance
   */
  public getVoteEntitiesManager(): VoteEntitiesManager {
    return this._voteEntitiesManager;
  }

  /**
   * Gets the camera entity instance.
   * @returns The camera Entity instance or null if not initialized
   */
  public getCameraEntity(): Entity | null {
    return this._cameraEntity;
  }

  /**
   * Loads the game world and sets up core world systems.
   * @param world - The world instance to load
   */
  private _loadGameWorld(world: World): void {
    this._world = world;
    world.loadMap(worldMap);

    this._setupWorldLighting();
    this._setupWorldEvents();
    this._setupWorldEntities();
  }

  /**
   * Initializes and plays the background music.
   * @param world - The world instance to play music in
   */
  private _playBackgroundMusic(world: World): void {
    new Audio({
      uri: 'audio/music/shadows-on-the-wall.mp3',
      loop: true,
      volume: 0.1,
    }).play(world);
  }

  /**
   * Sets up the game heartbeat system for periodic updates.
   * Runs every second to update game state and broadcast messages.
   */
  private _setupHeartbeat(): void {
    setInterval(() => {
      this._gameManager.onHeartbeat();
      this._broadcaster.handleHeartbeat();
    }, 1000);
  }

  /**
   * Sets up world event handlers for player join/leave events.
   * Manages player sessions, UI, and experience tracking.
   */
  private _setupWorldEvents(): void {
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

  /**
   * Sets up the world lighting system.
   * Configures ambient and directional lighting to create a space atmosphere.
   */
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

  /**
   * Sets up all core world entities including:
   * - Security camera
   * - Computer terminal
   * - Emergency button
   * - Collectible coins
   */
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

  /**
   * Spawns a collectible coin entity at the specified coordinates.
   * The coin includes collision detection for collection and respawns after a delay.
   * Also adds floating and rotation animations to the coin.
   * @param coinCoords - The coordinates to spawn the coin at
   */
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