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

Now let's put this into practice and implement `CharacterState`.

## Implementing Character States

Create a new file `src/characters/state.rs`:

```
characters/
├── config.rs
├── animation.rs
├── movement.rs
├── mod.rs
├── spawn.rs
├── state.rs  ← Create this
```

### The CharacterState Enum

We need an enum that represents all possible states our character can be in:

```rust
// src/characters/state.rs
use bevy::prelude::*;

/// Character states. Only one can be active at a time.
#[derive(Component, Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum CharacterState {
    #[default]
    Idle,
    Walking,
    Running,
    Jumping,
}
```

### Querying State with Methods

Earlier, we explained how boolean flags can create invalid combinations. Instead of tracking `is_jumping` and `was_jumping` flags separately, we now have a single `CharacterState`. But we still need to answer questions like "can this character jump right now?"

That's where these query methods come in. They let us ask questions about the current state without maintaining separate flag variables:

```rust
// Append to src/characters/state.rs
impl CharacterState {
    /// Check if this is a grounded state (can jump from here)
    pub fn is_grounded(&self) -> bool {
        matches!(self, CharacterState::Idle | CharacterState::Walking | CharacterState::Running)
    }
}
```

This method replaces boolean flag logic for jump control. Instead of tracking an `is_jumping` flag and checking it manually, we query the state. The logic is simple: you can only jump when grounded (Idle, Walking, or Running). You can't jump while already in the Jumping state.

Later, when handling input, we'll use this method:

```rust
// Pseudo code, don't use
if wants_jump && current_state.is_grounded() {
    *state = CharacterState::Jumping;
}
```

**What's `matches!`?**

The `matches!` macro checks if a value matches a pattern. `matches!(self, CharacterState::Idle)` returns `true` if `self` is `Idle`, `false` otherwise. The `|` means "or" so `matches!(self, CharacterState::Walking | CharacterState::Running)` checks if it's either Walking or Running.

## Animation Refactoring

Now we'll refactor `animation.rs` to use our new state-based approach. While we're at it, let's also clean up a code organization issue: currently, `AnimationController` stores both the current animation type and the facing direction. But these are owned by different systems, facing decides direction, animation decides the clip. Separating them makes each system's responsibility clearer.

First, create a new file `src/characters/facing.rs`. By making `Facing` its own component, the movement system owns direction updates, and the animation system focuses on sprite animation.

```rust
// src/characters/facing.rs
use bevy::prelude::*;

/// The direction a character is facing.
/// Separate from movement - character can face one way while moving another.
#[derive(Component, Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Facing {
    Up,
    Left,
    #[default]
    Down,
    Right,
}

impl Facing {
    pub fn from_velocity(velocity: Vec2) -> Self {
        if velocity.x.abs() > velocity.y.abs() {
            if velocity.x > 0.0 { Facing::Right } else { Facing::Left }
        } else {
            if velocity.y > 0.0 { Facing::Up } else { Facing::Down }
        }
    }
    
    /// Helper to map direction to row offset (0, 1, 2, 3)
    pub(crate) fn direction_index(self) -> usize {
        match self {
            Facing::Up => 0,
            Facing::Left => 1,
            Facing::Down => 2,
            Facing::Right => 3,
        }
    }
}
```

Expose both `state` and `facing` in `src/characters/mod.rs`:

```rust
// src/characters/mod.rs
pub mod config;
pub mod animation;
pub mod movement;
pub mod state; // Add this line
pub mod facing;  // Add this line
```

Open `src/characters/animation.rs`. We'll update it section by section.

First, delete the old `Facing` enum and `AnimationState` struct. We'll be using `CharacterState` instead.

```rust
// src/characters/animation.rs - Delete the following sections 

// DELETE this (Facing moved to facing.rs)
pub enum Facing { ... }
impl Facing { ... }

// DELETE this (AnimationState replaced by CharacterState)
pub struct AnimationState {
    pub is_moving: bool,
    ...
}
```

Remove `facing` from `AnimationController` since it's now a separate component. Also derive `Default` macro for `AnimationController`.

```rust
// src/characters/animation.rs - Update AnimationController
#[derive(Component, Default)] // Line update alert
pub struct AnimationController {
    pub current_animation: AnimationType,
    // Facing is removed now, line update alert
}
```

You'll also need to delete the old manual `Default` implementation for `AnimationController`. Previously, it looked like this:

```rust
// DELETE the following old implementation from src/characters/animation.rs
impl Default for AnimationController {
    fn default() -> Self {
        Self {
            current_animation: AnimationType::Walk,
            facing: Facing::Down,  // This field no longer exists
        }
    }
}
```

Delete it entirely. Since `AnimationController` now only has one field (`current_animation`), we need `AnimationType` to have a default value. Add `#[derive(Default)]` to `AnimationType` and mark `Walk` as the default:

```rust
// src/characters/config.rs - Set default animation type to Walk
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Default)] // Line update alert
pub enum AnimationType {
    #[default] // Line update alert
    Walk,
    Run,
    Jump
}
```

Now update the imports at the top of the file. Let's add imports for `CharacterState` and `Facing`.

```rust
// src/characters/animation.rs - Update imports
use bevy::prelude::*;
use crate::characters::config::{CharacterEntry, AnimationType};
use crate::characters::state::CharacterState; // Line update alert
use crate::characters::facing::Facing; // Line update alert
```

Since we moved `Facing` out of `AnimationController`, `get_clip` can no longer access `self.facing`. We need to pass facing as a parameter. This is actually cleaner: the method now explicitly declares what data it needs:

```rust
// src/characters/animation.rs - Update get_clip signature
impl AnimationController {
    /// Get the animation clip for the current animation and facing direction.
    /// `facing` is passed in since it's now a separate component.
    pub fn get_clip(&self, config: &CharacterEntry, facing: Facing) -> Option<AnimationClip> {
        let def = config.animations.get(&self.current_animation)?;
        
        let row = if def.directional {
            def.start_row + facing.direction_index()
        } else {
            def.start_row
        };
        
        Some(AnimationClip::new(row, def.frame_count, config.atlas_columns))
    }
}
```

**Delete update_animation_flags**

We no longer need this function since we will be using `Changed<CharacterState>` instead of manual tracking.

```rust
// src/characters/animation.rs - DELETE this entire function
pub fn update_animation_flags(...) { ... }
```

### Replace Animation System

Here's where the state pattern really pays off. The old `animate_characters` function manually tracked state changes with boolean flags. With `CharacterState`, Bevy's `Changed` filter does this for us automatically.

Delete `animate_characters` entirely. 
```rust
// src/characters/animation.rs - DELETE this entire function
pub fn animate_characters(...) { ... }
```

We'll write one system that responds to state changes (using `Changed<CharacterState>`), and another that does animation playback. This separation means state-change logic only runs when needed, not every frame.

**System 1: Handle Character State Changes**

This system runs only when `CharacterState` changes, using Bevy's `Changed` filter. When triggered, it updates the animation type so the playback system knows which animation to play.

```rust
// src/characters/animation.rs - Add this new function
pub fn on_state_change_update_animation(
    mut query: Query<
        (&CharacterState, &mut AnimationController, &mut AnimationTimer),
        Changed<CharacterState>
    >,
) {
    for (state, mut controller, mut timer) in query.iter_mut() {
        // Select animation based on new state
        let new_animation = match state {
            CharacterState::Idle | CharacterState::Walking => AnimationType::Walk,
            CharacterState::Running => AnimationType::Run,
            CharacterState::Jumping => AnimationType::Jump,
        };
        
        // Only update and reset timer if animation actually changed
        if controller.current_animation != new_animation {
            controller.current_animation = new_animation;
            timer.0.reset();
        }
    }
}
```

**What's `Changed<CharacterState>`?**

This is the change detection we discussed earlier! The query only returns entities whose `CharacterState` changed since last frame. No manual tracking needed.

**Why check `controller.current_animation != new_animation` if Changed already filters?**

Because multiple states can map to the same animation. Look at the match: both `Idle` and `Walking` use `AnimationType::Walk`. If the player transitions from `Idle` to `Walking`, `Changed<CharacterState>` fires (state changed), but the animation type stays `Walk`. Without this guard, we'd reset the timer and cause a visual stutter even though we're playing the same animation.

**System 2: Animation Playback**

 While the first system picks *which* animation to play when state changes, this one handles the frame-by-frame playback. Together they form a complete animation pipeline: state changes set up the animation, and this system keeps it running.

```rust
// src/characters/animation.rs - Add this new function
pub fn animations_playback(
    time: Res<Time>,
    mut query: Query<(
        &CharacterState,
        &Facing,
        &AnimationController,
        &mut AnimationTimer,
        &mut Sprite,
        &CharacterEntry,
    )>,
) {
    for (state, facing, controller, mut timer, mut sprite, config) in query.iter_mut() {
        // Don't animate when idle
        if *state == CharacterState::Idle {
            // Ensure idle sprite is at frame 0
            if let Some(atlas) = sprite.texture_atlas.as_mut() {
                if let Some(clip) = controller.get_clip(config, *facing) {
                    if atlas.index != clip.start() {
                        atlas.index = clip.start();
                    }
                }
            }
            continue;
        }
        
        let Some(atlas) = sprite.texture_atlas.as_mut() else { continue; };
        let Some(clip) = controller.get_clip(config, *facing) else { continue; };
        let Some(anim_def) = config.animations.get(&controller.current_animation) else { continue; };
        
        // Safety: If we somehow ended up on a frame outside our clip, reset.
        if !clip.contains(atlas.index) {
            atlas.index = clip.start();
            timer.0.reset();
        }
        
        // Update timer duration if needed
        let expected_duration = std::time::Duration::from_secs_f32(anim_def.frame_time);
        if timer.0.duration() != expected_duration {
            timer.0.set_duration(expected_duration);
        }
        
        // Advance animation
        timer.tick(time.delta());
        if timer.just_finished() {
            let old_index = atlas.index;
            atlas.index = clip.next(atlas.index);
        }
    }
}
```
