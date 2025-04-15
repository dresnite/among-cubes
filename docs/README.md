## Developer Documentation

Welcome to the Among Cubes developer documentation. This guide will help you understand the core architecture and main concepts of the game.

### Core Concepts

#### Game (`src/game/Game.ts`)
The central class that orchestrates the entire game flow. It manages the game state, phases, and player interactions.

#### Phases (`src/game/phase/`)
Phases represent distinct parts of the game flow, each encapsulating its own logic and event handling. Examples include:
- Countdown Phase
- Emergency Meeting (Voting) Phase
- In Progress Phase

Each phase is responsible for:
- Managing its specific game state
- Handling relevant events
- Controlling phase-specific UI elements
- Transitioning to other phases when appropriate

#### PlayerSession (`src/player/PlayerSession.ts`)
A crucial class that maintains player-specific information and state:
- Player statistics and data
- Game currency (coins)
- Methods for interacting with Game Custom UI
- Player state management

### Additional Components

#### Map (`src/map/Map.ts`)
Handles all map-related functionality:
- Map name and metadata
- Coordinate systems and positions
- Map-specific configurations

#### Message System (`src/messages/`)
Centralizes all game messages for easy maintenance and localization:
- Main message definitions in `src/messages/languages/en_en.ts`
- Some UI messages in `index.html`
- Supports multiple languages and easy message management

#### PlayerExperienceManager (`src/player/PlayerExperienceManager.ts`)
Manages the player progression system:
- Experience points calculation
- Level progression logic
- Rewards and milestones

### Architecture Notes

Most of the game's core logic is encapsulated within the Phase system. Each phase acts as an isolated module handling its specific game state and events. While some logic currently exists outside the game class, this is an area marked for future improvement.

The codebase follows a modular approach where:
1. Phases handle game flow and state
2. PlayerSession manages player-specific data
3. Supporting classes (Map, Message, PlayerExperienceManager) provide specialized functionality

For new developers, it's recommended to:
1. Start by understanding the Phase system
2. Familiarize yourself with the PlayerSession class
3. Learn how different components interact through the Game class



