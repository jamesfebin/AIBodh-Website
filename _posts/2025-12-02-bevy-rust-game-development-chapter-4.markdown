---
layout: post
title: "The Impatient Programmer's Guide to Bevy and Rust: Chapter 4 - Let There Be Collisions"
date: 2025-12-02 10:00:00 +0000
category: rust
excerpt: "Learn to implement collision detection and physics in Bevy. We'll add collision boundaries, handle player-world interactions, and create a robust physics system for your game."
image: /assets/book_assets/chapter4/chapter4.gif
og_image: /assets/book_assets/chapter4/chapter4.gif
---

<style>
.tile-image {
  margin: 0 !important;
  object-fit: none !important;
  cursor: default !important;
  pointer-events: none !important;
}
</style>

By the end of this tutorial, you'll have implemented collision detection, player boundaries, and physics interactions in your Bevy game.

> **Prerequisites**: This is Chapter 4 of our Bevy tutorial series. [Join our community](https://discord.com/invite/cD9qEsSjUH) for updates on new releases. Before starting, complete [Chapter 1: Let There Be a Player](/posts/bevy-rust-game-development-chapter-1/), [Chapter 2: Let There Be a World](/posts/bevy-rust-game-development-chapter-2/), and [Chapter 3: Let The Data Flow](/posts/bevy-rust-game-development-chapter-3/), or clone the Chapter 3 code from [this repository](https://github.com/jamesfebin/ImpatientProgrammerBevyRust) to follow along.

![Collision System Demo]({{ "/assets/book_assets/chapter4/chapter4.gif" | relative_url }})

<div style="margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-radius: 8px; border-left: 4px solid #1976d2;">
<strong>Before We Begin:</strong> <em style="font-size: 14px;">I'm constantly working to improve this tutorial and make your learning journey enjoyable. Your feedback matters - share your frustrations, questions, or suggestions on <a href="https://www.reddit.com/r/bevy/" target="_blank">Reddit</a>/<a target="_blank" href="https://discord.com/invite/cD9qEsSjUH">Discord</a>/<a href="https://www.linkedin.com/in/febinjohnjames" target="_blank">LinkedIn</a>. Loved it? Let me know what worked well for you! Together, we'll make game development with Rust and Bevy more accessible for everyone.</em>
</div>

## Systems Running When They Shouldn't

In Chapter 3, we built a character system that loads sprite data from a `.ron` file. But there's a problem in how we handle the initialization.

The `spawn_player` system runs once at startup. It spawns the player entity and begins loading the character data file. So far, so good.

But then `initialize_player_character` runs **every single frame**, checking if the assets have finished loading:

We have a **polling pattern** that repeatedly checks if something is ready:

```d2
direction: right

Loading: Frames 1-59\nAssets loading... {shape: rectangle}
Check1: initialize_player() {shape: hexagon}
Exit: Not ready\nExit early {shape: diamond}

Success: Frame 60\nAssets ready! {shape: rectangle}
Check2: initialize_player() {shape: hexagon}
Init: Initialize\nplayer {shape: diamond}

Forever: Frames 61+\nForever... {shape: rectangle}
Check3: initialize_player() {shape: hexagon}
Nothing: Already done\nDo nothing {shape: diamond}

Loading -> Check1 -> Exit
Exit -> Loading: Repeat

Success -> Check2 -> Init

Forever -> Check3 -> Nothing
Nothing -> Forever: Repeat
```


The system runs **every frame forever** with wasted checks while loading, one useful execution, then infinite no-ops causing performance waste, code clutter, and making the code difficult to extend.

```comic
left_guy_smile: Are we there yet? Are we there yet? Are we there yet?
right_girl_angry: That's your code. Every single frame.
```

### Systems That Run Only When Needed

`Startup` and `Update` we use to trigger our systems are **schedules**. Bevy's way of organizing when systems run. `Startup` runs once at launch, `Update` runs every frame.

But what if we need systems that run at *specific moments*? Not every frame, not just at startup, but exactly when something happens like when assets finish loading, or when the player pauses the game.

### State-Based Schedules

The solution is to organize our game into distinct **phases**. We call these phases **states**: Loading, Playing, and Paused. Each state represents a different mode of the game.

When the game transitions from one state to another (say, from Loading to Playing), Bevy provides special schedules that run exactly once:

- **OnEnter** - Runs when entering a state
- **OnExit** - Runs when leaving a state

This is how we eliminate polling. Instead of `initialize_player_character` checking every frame "Are assets loaded yet?", we attach it to `OnExit(Loading)`. When assets finish loading and we leave the Loading state, Bevy runs it exactly once with no checking, no guard clauses, no wasted frames.

```d2
direction: down

Startup: {
  shape: rectangle
  label: Startup State\nspawn_player()
}

Loading: {
  shape: rectangle
  label: Loading State\nCheck if assets loaded
}

OnExit Loading: {
  shape: hexagon
  label: OnExit(Loading)\ninitialize_player()
}

Playing: {
  shape: rectangle
  label: Playing State\nMovement & Animation
}

Startup -> Loading: App starts
Loading -> OnExit Loading: Assets ready
OnExit Loading -> Playing: One-time player initialization 
```

## Implementing Game States

Let's build a complete state management module with loading screens and pause functionality. Create the folder `state` inside the `src` folder.

### Defining Game States

**What states do we need?**

Think about your game's lifecycle. Right now, when the game starts:
1. Assets need time to load from disk
2. Once loaded, gameplay begins
3. Players might want to pause

These are three distinct phases, each needing different systems:
- **Loading**: Show loading screen, check if assets ready, don't run gameplay
- **Playing**: Run movement/animation, hide loading screen, allow pausing
- **Paused**: Show pause menu, stop gameplay, allow un-pausing

Let's define these as an enum:

Create `src/state/game_state.rs`:

```rust
// src/state/game_state.rs
use bevy::prelude::*;

#[derive(States, Default, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum GameState {
    #[default]
    Loading,
    Playing,
    Paused,
}
```

**What's the `States` macro?**

The `#[derive(States)]` macro implements the `States` trait, which tells Bevy:
- This enum represents game phases where only one can be active at a time
- Bevy should track which state is active
- Systems can be gated to run only in specific states
- State transitions should trigger OnEnter/OnExit schedules

The `#[default]` attribute marks which state the game starts in. Here, Bevy initializes the state to the default value (Loading in our case).


### Loading Screen

Let's create a loading screen with a full-screen dark background, animated "Loading..." text.

Create `src/state/loading.rs` 

```rust
// src/state/loading.rs
use bevy::prelude::*;

#[derive(Component)]
pub struct LoadingScreen;

#[derive(Component)]
pub struct LoadingText;

pub fn spawn_loading_screen(mut commands: Commands) {
    commands.spawn((
        LoadingScreen,
        Node {
            width: Val::Percent(100.0),
            height: Val::Percent(100.0),
            justify_content: JustifyContent::Center,
            align_items: AlignItems::Center,
            ..default()
        },
        BackgroundColor(Color::srgb(0.1, 0.1, 0.15)),
    )).with_children(|parent| {
        parent.spawn((
            LoadingText,
            Text::new("Loading..."),
            TextFont {
                font_size: 48.0,
                ..default()
            },
            TextColor(Color::WHITE),
        ));
    });
    
    info!("Loading screen spawned");
}
```

**What's happening:**
- `LoadingScreen` and `LoadingText` are marker components to identify our UI entities
- `Node` creates a full-screen container (100% width and height)
- `justify_content` and `align_items` centered means text appears in the middle
- `.with_children()` spawns the text as a child of the background

Now append the animation function to the same file:

```rust
// Append to src/state/loading.rs
pub fn animate_loading(
    time: Res<Time>,
    mut query: Query<&mut Text, With<LoadingText>>,
) {
    for mut text in query.iter_mut() {
        let dots = (time.elapsed_secs() * 2.0) as usize % 4;
        **text = format!("Loading{}", ".".repeat(dots));
    }
}
```

This animates the text: "Loading" → "Loading." → "Loading.." → "Loading..." (cycling through 0-3 dots).

**What's `**text`, is this like double dereferencing?**

Yes! When we call `.iter_mut()`, Bevy wraps our `&mut Text` in a special type that tracks changes. The first `*` unwraps that to get `&mut Text`, and the second `*` dereferences the reference to reach the actual `Text` value we can modify.

Finally, append the despawn function:

```rust
// Append to src/state/loading.rs
pub fn despawn_loading_screen(
    mut commands: Commands,
    query: Query<Entity, With<LoadingScreen>>,
) {
    for entity in query.iter() {
        commands.entity(entity).despawn();
    }
    
    info!("Loading screen despawned");
}
```

**Why despawn?**

When we transition to Playing state, the loading screen should disappear. Without despawning, the UI entities would remain in the world forever, cluttering memory and rendering on top of the game. The `.despawn()` function removes the loading screen entity. Since LoadingText is a child (via `.with_children()`), Bevy automatically removes it too.


### Pause Menu

Now let's create a pause menu that shows a semi-transparent overlay with "PAUSED" text when the player presses Escape, and hides when they press it again.

Create `src/state/pause.rs`:

```rust
// src/state/pause.rs
use bevy::prelude::*;

#[derive(Component)]
pub struct PauseMenu;

pub fn spawn_pause_menu(mut commands: Commands) {
    commands.spawn((
        PauseMenu,
        Node {
            width: Val::Percent(100.0),
            height: Val::Percent(100.0),
            justify_content: JustifyContent::Center,
            align_items: AlignItems::Center,
            ..default()
        },
        BackgroundColor(Color::srgba(0.0, 0.0, 0.0, 0.7)),
    )).with_children(|parent| {
        parent.spawn((
            Text::new("PAUSED\n\nPress ESC to resume"),
            TextFont {
                font_size: 36.0,
                ..default()
            },
            TextColor(Color::WHITE),
            TextLayout::new_with_justify(Justify::Center),
        ));
    });
    
    info!("Pause menu spawned");
}

pub fn despawn_pause_menu(
    mut commands: Commands,
    query: Query<Entity, With<PauseMenu>>,
) {
    for entity in query.iter() {
        commands.entity(entity).despawn();
    }
    
    info!("Pause menu despawned");
}
```

### State Plugin

Now we'll create the `StatePlugin` that wires everything together. We'll build it piece by piece.

Create `src/state/mod.rs`.

```rust
// src/state/mod.rs
mod game_state;
mod loading;
mod pause;

use bevy::prelude::*;
use crate::characters::spawn::CharactersListResource;
use crate::characters::config::CharactersList;

pub use game_state::GameState;

pub struct StatePlugin;

impl Plugin for StatePlugin {
    fn build(&self, app: &mut App) {
        app
            .init_state::<GameState>()
            
            // Loading state systems
            .add_systems(OnEnter(GameState::Loading), loading::spawn_loading_screen)
            .add_systems(Update, (
                check_assets_loaded,
                loading::animate_loading,
            ).run_if(in_state(GameState::Loading)))
            .add_systems(OnExit(GameState::Loading), (
                loading::despawn_loading_screen,
                crate::characters::spawn::initialize_player_character,
            ))
                // Pause state systems
            .add_systems(OnEnter(GameState::Paused), pause::spawn_pause_menu)
            .add_systems(OnExit(GameState::Paused), pause::despawn_pause_menu)
            
            // Pause toggle (works in Playing or Paused states)
            .add_systems(Update, 
                toggle_pause.run_if(in_state(GameState::Playing).or(in_state(GameState::Paused)))
            );
    }
}

fn check_assets_loaded(
    characters_list_res: Option<Res<CharactersListResource>>,
    characters_lists: Res<Assets<CharactersList>>,
    mut next_state: ResMut<NextState<GameState>>,
) {
    let Some(res) = characters_list_res else {
        return;
    };
    
    if characters_lists.get(&res.handle).is_some() {
        info!("Assets loaded, transitioning to Playing!");
        next_state.set(GameState::Playing);
    }
}

fn toggle_pause(
    input: Res<ButtonInput<KeyCode>>,
    current_state: Res<State<GameState>>,
    mut next_state: ResMut<NextState<GameState>>,
) {
    if input.just_pressed(KeyCode::Escape) {
        match current_state.get() {
            GameState::Playing => {
                info!("Game paused");
                next_state.set(GameState::Paused);
            }
            GameState::Paused => {
                info!("Game resumed");
                next_state.set(GameState::Playing);
            }
            _ => {}
        }
    }
}
```

**What's happening here?**

We start by telling Bevy to track our custom `GameState` enum. 

When the game starts and enters `Loading` state, `OnEnter(GameState::Loading)` runs `spawn_loading_screen` once, showing the loading UI.

While in Loading state, `Update.run_if(in_state(GameState::Loading))` runs two systems one to check if assets are loaded and another to animate the loading text.

Once assets load, `check_assets_loaded` requests a transition to `Playing` state. When this happens, `OnExit(GameState::Loading)` triggers, running two systems that cleans up the loading UI and initialize the player. Now player initialization can happen only once since exiting from loading state is a one-time event.

For pausing, we added systems on `OnEnter(GameState::Paused)` and `OnExit(GameState::Paused)` to show and hide the pause menu. The `toggle_pause` function listens for the Escape key and switches between Playing and Paused states.

Our `StatePlugin` now orchestrates the entire game flow. The Loading state handles asset loading with visual feedback, the Playing state runs gameplay systems, and the Paused state freezes gameplay while showing a menu. The beauty of this design is that systems automatically attach to state transitions, no polling, no wasted frames. Everything runs exactly when needed.

Now open `src/characters/mod.rs` and remove `initialize_player_character` from the Update schedule. Since we have already added it through `StatePlugin`.

```rust
// src/characters/mod.rs
impl Plugin for CharactersPlugin {
    fn build(&self, app: &mut App) {
        app.add_plugins(RonAssetPlugin::<CharactersList>::new(&["characters.ron"]))
            .init_resource::<spawn::CurrentCharacterIndex>()
            .add_systems(Startup, spawn::spawn_player)
            // REMOVE initialize_player_character from here!
            // It now runs in StatePlugin's OnExit(Loading)
            .add_systems(Update, (
                spawn::switch_character,
                movement::move_player,
                movement::update_jump_state,
                animation::animate_characters,
                animation::update_animation_flags,
            ));
    }
}
```

### Integrating StatePlugin

Add the state module and plugin to `src/main.rs`:

```rust
// src/main.rs
mod characters;
mod map;
mod state;  // Add this
```

**Important**: Add `StatePlugin` BEFORE `CharactersPlugin` so the state system is initialized before character systems try to use it.

```rust
// Add state plugin inside main function of src/main.rs
        // Previous code as it is
        .add_plugins(ProcGenSimplePlugin::<Cartesian3D, Sprite>::default())
        .add_plugins(state::StatePlugin)  // Add BEFORE CharactersPlugin!
        .add_plugins(characters::CharactersPlugin)
        .add_systems(Startup, setup_camera)
        .run();
```

Run your game:

```bash
cargo run
```

You might not see the loading screen (assets load quickly, but you can manually add a delay if needed). The game starts and your character appears, ready to move. Press Escape anytime to pause, the game freezes and shows a pause overlay. Press Escape again to continue seamlessly.

## The State Pattern for Characters
We just used states to control our *game flow* (Loading → Playing → Paused). Now let's apply the same pattern to something else: *character behavior*.

Have a look at out `AnimationState` component:

```rust
// Pseudo code, don't use
#[derive(Component, Default)]
pub struct AnimationState {
    pub is_moving: bool,
    pub was_moving: bool,
    pub is_jumping: bool,
    pub was_jumping: bool,
}
```

Four booleans tracking two pieces of information: what the character is doing *now* and what they were doing *last frame*. We needed `was_moving` and `was_jumping` to detect transitions like "just started jumping" or "just stopped moving".

This works to help us with animation, but it has problems.

### Too Many Boolean Flags

What if we add running? We'd need:

```rust
// Pseudo code, don't use
pub is_running: bool,
pub was_running: bool,
```

Attacking?

```rust
// Pseudo code, don't use
pub is_attacking: bool,
pub was_attacking: bool,
```

Soon our component is drowning in booleans, and our animation system is drowning in transition logic:

```rust
// Pseudo code, don't use
let just_started_moving = state.is_moving && !state.was_moving;
let just_stopped_moving = !state.is_moving && state.was_moving;
let just_started_jumping = state.is_jumping && !state.was_jumping;
let just_stopped_jumping = !state.is_jumping && state.was_jumping;
let just_started_running = state.is_running && !state.was_running;
// ... it keeps growing
```

Worse, what happens if `is_moving` and `is_jumping` are both true? Or `is_running` and `is_attacking`? Boolean flags don't prevent impossible states. 

A developer might accidentally set both flags, or forget to clear one when setting another. Your animation system then has to decide: which flag wins? You end up writing priority logic, and bugs creep in when the priorities aren't consistent across systems.

### The State Pattern Solution

Remember how `GameState` worked? One enum, one value at a time, Bevy tracks transitions for us.

We can do the same for characters:

```rust
// Pseudo code, don't use
#[derive(Component, Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum CharacterState {
    #[default]
    Idle,
    Walking,
    Running,
    Jumping,
}
```

A character can only be in *one* state at a time. No more impossible combinations. No more boolean math.

### Why This Is Better

**1. Impossible states become impossible:**

With an enum, the compiler enforces that the character is in exactly one state:

```rust
// Pseudo code, don't use
// With booleans: you can do this (but shouldn't!)
is_walking = true;
is_jumping = true;  // Now both are true - invalid!

// With enum: you can't have both true
let state = CharacterState::Walking;
// state is Walking. To jump, you must replace it:
let state = CharacterState::Jumping;  // Now it's only Jumping
```

The variable holds one value. You can't be Walking and Jumping simultaneously. This approach is called *making illegal states unrepresentable*, a key principle in type-driven development. Instead of writing code to check for invalid combinations, you design your types so invalid combinations can't exist.

**2. Bevy detects changes for us:**

Remember manually tracking `was_moving` and `was_jumping`? That was change detection done by hand. Bevy has this built in. When you use `Changed<CharacterState>`, Bevy only runs your code when the state actually changes. 

Your animation update system only runs when the character transitions between states. Your sound effect system only runs when entering a new state. Less code, fewer bugs, and we'll use this later in the chapter.

**3. Animation selection becomes a simple match:**

With an enum, picking the right animation is straightforward. You match on the current state, and each state maps to exactly one animation. There's no ambiguity, no priority logic, no "what if both flags are true?" dilemma.

```rust
// Pseudo code, don't use
let new_animation = match state {
    CharacterState::Idle | CharacterState::Walking => AnimationType::Walk,
    CharacterState::Running => AnimationType::Run,
    CharacterState::Jumping => AnimationType::Jump,
};
```

The compiler warns you if you forget to handle a state. If you later add a new state to the enum, every match statement becomes a compile error until you handle the new case. The compiler forces you to think through all possibilities.


### The Connection

Notice the parallel? `GameState` controls which *game systems* run. `CharacterState` controls which *animation* plays. Both use enums where only one value is active at a time, both use change detection for transitions, and both scale naturally. Once you see this pattern, you'll find uses everywhere: enemy AI (Patrol, Chase, Attack), doors (Open, Closed, Locked), network connections (Connecting, Connected, Disconnected).

Later in this chapter, we'll implement this refactoring: replacing `AnimationState` booleans with a `CharacterState` enum, separating `Facing` into its own component, and using Bevy's change detection for smooth transitions.

