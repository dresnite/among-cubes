import type { World } from "hytopia";
import {
  Audio,
  PlayerEntity,
  PlayerEvent,
} from 'hytopia';

import worldMap from '../assets/maps/themaze.json';

export class Main {
  
  static initialize(world: World) {
    const loader = new Main();
    loader.loadGameWorld(world);
    loader.playBackgroundMusic(world);
  }

  constructor() {
    this.playBackgroundMusic = this.playBackgroundMusic.bind(this);
  }

  loadGameWorld(world: World): void {
    world.loadMap(worldMap);
    world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
      const playerEntity = new PlayerEntity({
        player,
        name: 'Player',
        modelUri: 'models/players/player.gltf',
        modelLoopedAnimations: ['idle'],
        modelScale: 0.5,
      });

      playerEntity.spawn(world, { x: 0, y: 10, z: 0 });

      // Load our game UI for this player
      player.ui.load('ui/index.html');

      // Send a nice welcome message that only the player who joined will see ;)
      world.chatManager.sendPlayerMessage(player, 'Welcome to Among Cubes!', 'FFE4E1');
    });

    /**
     * Handle player leaving the game. The PlayerEvent.LEFT_WORLD
     * event is emitted to the world when a player leaves the game.
     * Because HYTOPIA is not opinionated on join and
     * leave game logic, we are responsible for cleaning
     * up the player and any entities associated with them
     * after they leave. We can easily do this by 
     * getting all the known PlayerEntity instances for
     * the player who left by using our world's EntityManager
     * instance.
     * 
     * The HYTOPIA SDK is heavily driven by events, you
     * can find documentation on how the event system works,
     * here: https://dev.hytopia.com/sdk-guides/events
     */
    world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
      world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
    });

    /**
     * A silly little easter egg command. When a player types
     * "/rocket" in the game, they'll get launched into the air!
     */
    world.chatManager.registerCommand('/rocket', player => {
      world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => {
        entity.applyImpulse({ x: 0, y: 20, z: 0 });
      });
    });
  }

  playBackgroundMusic(world: World): void {
    new Audio({
      uri: 'audio/music/among-cubes-theme.mp3',
      loop: true,
      volume: 0.1,
    }).play(world);
  }

}