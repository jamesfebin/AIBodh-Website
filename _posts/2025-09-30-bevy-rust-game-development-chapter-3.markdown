---
layout: post
title: "The Impatient Programmer's Guide to Bevy and Rust: Chapter 3 - Let The Data Flow"
date: 2025-10-11 10:00:00 +0000
category: rust
excerpt: "Learn to build a flexible, data-driven character system in Bevy and Rust. This third chapter covers creating evolving characters, decoupling stats from code, and building a scalable character progression framework that grows with your game."
image: /assets/book_assets/chapter3/ch3.gif
og_image: /assets/book_assets/chapter3/animation-system.png
---

<style>
.tile-image {
  margin: 0 !important;
  object-fit: none !important;
  cursor: default !important;
  pointer-events: none !important;
}
</style>

By the end of this tutorial, you'll have a flexible, data-driven character system that supports character switching, multiple animation types (Walk, Run, Jump) configured through a single external data file.

> **Prerequisites**: This is Chapter 3 of our Bevy tutorial series. [Join our community](https://discord.com/invite/cD9qEsSjUH) for updates on new releases. Before starting, complete [Chapter 1: Let There Be a Player](/posts/bevy-rust-game-development-chapter-1/) and [Chapter 2: Let There Be a World](/posts/bevy-rust-game-development-chapter-2/), or clone the Chapter 2 code from [this repository](https://github.com/jamesfebin/ImpatientProgrammerBevyRust) to follow along.

<!-- ![Animation System Demo]({{ "/assets/book_assets/chapter3/ch3.gif" | relative_url }}) -->

## The Problem with Hardcoded Characters

In Chapter 1, we built a player with movement and animation, however **everything was hardcoded and tightly coupled**.

```rust
// Pseudo code warning, don't use
// From Chapter 1 player.rs - Everything is hardcoded!
const TILE_SIZE ... = 64;        // ← Hardcoded sprite size
const WALK_FRAMES ... = 9;     // ← Hardcoded frame count
const MOVE_SPEED ... = 140.0;    // ← Hardcoded movement speed
const ANIM_DT ... = 0.1;         // ← Hardcoded animation timing
```

### Maintainance Nightmare

Let's see what happens when you add a second character. You'd need to duplicate everything:

```rust
// Pseudo code warning, don't use
// First character
const WARRIOR_TILE_SIZE ... = 64;
const WARRIOR_WALK_FRAMES ... = 9;
const WARRIOR_MOVE_SPEED ... = 140.0;

fn spawn_warrior(...) { /* 50 lines of code */ }
fn animate_warrior(...) { /* 80 lines of animation logic */ }
fn warrior_row_zero_based(...) { /* row mapping */ }

// Second character - DUPLICATE ALL THE CODE
const MAGE_TILE_SIZE ... = 64;
const MAGE_WALK_FRAMES ... = 6;
const MAGE_MOVE_SPEED ... = 100.0;

fn spawn_mage(...) { /* 50 lines of IDENTICAL code */ }
fn animate_mage(...) { /* 80 lines of IDENTICAL animation logic */ }
fn mage_row_zero_based(...) { /* different row mapping */ }
```

Now imagine you discover a bug in your animation system. You need to fix it in:
- `animate_warrior()`
- `animate_mage()`
- `animate_rogue()`
- `animate_paladin()`
- ...and 6 more character functions

Miss one? That character breaks. Want to add a "jump" animation? Update 10 functions. Want to change how movement works? Touch every single character's code.

This is the copy-paste maintenance nightmare you want to avoid.


### Data-Driven Design

The solution lies in **data-oriented programming** - a design approach where we **separate what things are (data) from what they do (behavior)**. 

Instead of tightly coupling character attributes with character-specific code, we:

**1. Separate Data from Code**

Move character properties into a single external `.ron` configuration file:

```ron
// characters.ron, All characters in one file!
(
    characters: [
        (
            name: "Warrior",
            base_move_speed: 140.0,
            max_health: 150.0,
            animations: {...}
        ),
        (
            name: "Mage",
            base_move_speed: 100.0,
            max_health: 80.0,
            animations: {...}
        ),
    ]
)
```

**What's a `.ron` file?**

RON stands for **Rusty Object Notation**, a data format similar to JSON but designed for Rust. It's human-readable, supports Rust types like tuples and structs, and allows comments. Think of it as JSON that feels native to Rust developers.

| JSON | RON |
|------|-----|
| Requires quotes on every key | Optional quotes for simple identifiers less typing, cleaner files |
| No comment support | Inline and multiline comments, document your data directly |
| Trailing commas cause syntax errors | Trailing commas allowed, fewer bugs when editing lists |
| Limited to JavaScript types | Native Rust types (tuples, structs, enums), matches your code |

RON eliminates JSON's verbosity while adding features that Rust developers need, making it ideal for game configuration. 

**2. Write Systems that Operate on Data**

Build generic systems that work with **any** character data:

```rust
// Pseudo code warning, don't use
// Before: Code + Data mixed together
fn animate_warrior(...) { /* hardcoded warrior logic */ }
fn animate_mage(...) { /* hardcoded mage logic */ }

// After: Flexible system that operates on data
fn animate_characters(...) { 
    // Reads character data and animates accordingly
    // Works for warrior, mage, rogue, or any future character!
}
```

**Benefits of Separation**

When data lives separately from code, the same animation system adapts to any character automatically.

Fix a bug? **One place**. Change animation speeds or frame counts? **Update the data file, no code changes**. Switch characters? **Load different data from the file**.

But the benefits extend far beyond maintenance. This separation helps with powerful capabilities that would be difficult or impossible with hardcoded values. 

You can load characters from a network server at runtime, enabling downloadable content and live game updates without redistributing your entire game binary. 

Players can create their own custom characters by simply editing the `.ron` file, opening the door to user-generated content.

 Game designers can experiment with character balance through A/B testing by swapping different data files, gathering player feedback and iterating on game balance without touching a single line of code.

**What We'll Build in This Chapter:**

While the data-driven approach opens up all these possibilities, we'll start with the foundation:
1. **Creating & loading external `.ron` file** containing all character data
2. **Generic animation system** that works with any character
3. **Runtime character switching** with number keys (1-6)
4. **Multiple animation types** (Walk, Run, Jump) per character

Ready to build this data-driven character system? Let's dive in! 

## Setting Up the Characters Module

Find the Chapter 3 project files from the [repo](http://github.com/jamesfebin/ImpatientProgrammerBevyRust) and copy these spritesheets into your project’s `src/assets/` directory:


```bash
male_spritesheet.png
female_spritesheet.png
crimson_count_spritesheet.png
graveyard_reaper_spritesheet.png
lantern_warden_spritesheet.png
starlit_oracle_spritesheet.png
```
### Character Schema
Every entry in `characters.ron` follows the same structure:

- `name`: Identifier that shows up in logs/UI.
- `max_health`, `base_move_speed`, `run_speed_multiplier`: Gameplay attributes.
- `texture_path`: Which spritesheet to load.
- `tile_size`: Each frame’s width/height in pixels.
- `atlas_columns`: How many columns exist in the spritesheet grid.
- `animations`: Map where the key is an `AnimationType` (`Walk`, `Run`, `Jump`) and the value is:
  - `start_row`: Row number in the spritesheet grid, counting from 0 at the top.
  - `frame_count`: Number of frames for that animation.
  - `frame_time`: Seconds per frame.
  - `directional`: `true` when the spritesheet contains four direction rows (Up, Left, Down, Right) stacked vertically for that animation. If `false`, Bevy uses the same row regardless of facing direction.

Make a folder `src/assets/characters/` and copy `characters.ron` file from the [repo](http://github.com/jamesfebin/ImpatientProgrammerBevyRust), it includes data of all 6 characters.

### Building the Config Module

With our data file in place, we need code that reads it and spawns the player. We’re going to replace the Chapter 1 `player.rs` with a new `characters` module. 

Hence delete `src/player.rs` and remove `mod player;` and `PlayerPlugin` usage from `main.rs`.

Create a new folder `src/characters/` and create the file `config.rs` inside it.
```
characters/
├── config.rs
```

First we need to define what type of animation are possible. Presently we only support `Walk`, `Run` and `Jump` animations. `AnimationDefinition` captures where each animation lives in the spritesheet, how many frames it has, and how fast it should play.

```rust
// characters/config.rs
use bevy::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AnimationType {
    Walk,
    Run,
    Jump
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationDefinition {
    pub start_row: usize,
    pub frame_count: usize,
    pub frame_time: f32,
    pub directional: bool, // true = 4 rows (one per direction), false = 1 row
}
```

**What's `Hash`, `Serialize`, and `Deserialize`?**  
`Hash` lets us use `AnimationType` as a key inside `HashMap`, so retrieving the settings for `AnimationType::Run` is just a dictionary lookup. `Serialize` and `Deserialize` allow Rust to turn these structs into `.ron` text (and back) automatically when you load or save character data.

With the animation schema in place we can define `CharacterEntry`, the asset we load from `characters.ron`. It bundles character attributes, sprite metadata, and the animation map so every system pulls the info it needs from a single struct record.

Append the following code to `characters/config.rs`.

```rust
// Append this to characters/config.rs
#[derive(Component, Asset, TypePath, Debug, Clone, Serialize, Deserialize)]
pub struct CharacterEntry {
    pub name: String,
    pub max_health: f32,
    pub base_move_speed: f32,
    pub run_speed_multiplier: f32,
    pub texture_path: String,
    pub tile_size: u32,
    pub atlas_columns: usize,
    pub animations: HashMap<AnimationType, AnimationDefinition>,
}

impl CharacterEntry {
    pub fn calculate_max_animation_row(&self) -> usize {
        self.animations
            .values()
            .map(|def| if def.directional { def.start_row + 3 } else { def.start_row })
            .max()
            .unwrap_or(0)
    }
}

#[derive(Asset, TypePath, Debug, Clone, Serialize, Deserialize)]
pub struct CharactersList {
    pub characters: Vec<CharacterEntry>,
}
```

The `calculate_max_animation_row` helper inspects every animation definition to figure out how many rows the texture atlas needs. 

Directional animations like `Walk` often consume four stacked rows (Up, Left, Down, Right), while others, say a climb animation, may only need a single row regardless of facing. This helper keeps those differences data-driven so atlas loading code can stay generic.

**Is `self.animations` calling multiple functions sequentially?**  
Yes! This is called **method chaining**. Each function runs in order: first `.values()` gets all animation definitions from the HashMap, then `.map()` transforms each one, then `.max()` finds the largest value. They execute left-to-right, one after another.

**What's map doing, also is that a closure inside map?**  
`map` transforms each item in the collection. Yes, `|def|` is a **closure** as we studied in the previous chapter. It takes each animation definition (`def`) and calculates its maximum row: if the animation is directional (4 rows), it returns `start_row + 3`; otherwise just `start_row`. Think of it as "for each animation, calculate its end row."

**What's `unwrap_or`?**  
`max()` returns an `Option<usize>`, it could be `Some(number)` if there are animations, or `None` if the HashMap is empty. `unwrap_or(0)` says "if you got a number, give it to me; if you got `None`, use `0` instead." This prevents crashes when a character has no animations defined.

`CharactersList` groups all your `CharacterEntry` configs into one loadable asset, so Bevy can read every character’s data from a single JSON/RON file instead of loading many separate files.

**What's the purpose of using `Asset`, `TypePath` macros?**  
`Asset` simply tells Bevy “this struct is something you can load from disk and store in the asset server.” `TypePath` gives Bevy a unique name for the type so it knows exactly which asset you’re asking for later. Together they turn `CharacterEntry`/`CharactersList` into first-class loadable data, the same way textures or audio files already work.

**What's `HashMap<AnimationType, AnimationDefinition>` doing?**  
Each character needs different timing and sprite rows for `Walk`, `Run`, `Jump`, etc. The `HashMap` is simply a lookup table with key as `AnimationType`, so when the animation system asks for `AnimationType::Run`, it instantly receives the corresponding `AnimationDefinition` (start row, frame count, frame speed, directional flag). 


Now that we have a data structure to hold our character information, we need a system to bring it to life.


## The Animation Engine

Here we will be building the animation engine to interpret our data structure.

Create a new file `src/characters/animation.rs`. This will house the logic that brings our sprites to life.

```
characters/
├── config.rs
├── animation.rs  <- Create this
```

Our animation engine need to help us with the following:

1. **Direction Tracking**: When your character moves right, you want them to face right. When they move up, they should face up. We need a system to convert movement into facing direction.
2. **State Management**: We need to know *when* to change animations. Did the player just start running? Just stop? Just jump? These transitions are when we reset the animation.
3. **Frame Calculation**: Given a character's current state ("running left"), which exact frame from the spritesheet should we display right now?

Let's build each piece.

### Direction Tracking

When your player presses the arrow keys, we get a velocity vector like `Vec2 { x: 1.0, y: 0.0 }` for moving right. But our spritesheet doesn't understand vectors—it has specific rows for Up, Down, Left, and Right animations.

We need to translate "moving in this direction" into "show this specific row of sprites." That's what the `Facing` enum does.

Add this to `src/characters/animation.rs`:

```rust
use bevy::prelude::*;
use serde::{Deserialize, Serialize};
use crate::characters::config::{CharacterEntry, AnimationType};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Facing {
    Up,
    Left,
    Down,
    Right,
}

impl Facing {
    // Convert a velocity vector into a discrete direction
    pub fn from_direction(direction: Vec2) -> Self {
        if direction.x.abs() > direction.y.abs() {
            if direction.x > 0.0 { Facing::Right } else { Facing::Left }
        } else {
            if direction.y > 0.0 { Facing::Up } else { Facing::Down }
        }
    }
    
    // Helper to map direction to row offset (0, 1, 2, 3)
    fn direction_index(self) -> usize {
        match self {
            Facing::Up => 0,
            Facing::Left => 1,
            Facing::Down => 2,
            Facing::Right => 3,
        }
    }
}
```

**Converting Movement to Facing**

The `from_direction` function takes a velocity vector and figures out which direction is dominant. If the player is moving diagonally (both x and y are non-zero), we pick the stronger component. Moving mostly right with a bit of up? Face right. Moving mostly up with a bit of right? Face up. This ensures your character always faces the most relevant direction during gameplay.

**Mapping Direction to Sprite Rows**

Our spritesheets follow a convention. For directional animations like "Walk", the rows are organized as:
- Row 0: Walk Up
- Row 1: Walk Left
- Row 2: Walk Down
- Row 3: Walk Right

The `direction_index` function converts our `Facing` enum into these row offsets (0, 1, 2, 3). So when we know the player is facing `Down` and we want to play the "Walk" animation starting at row 8, we calculate: `8 + Facing::Down.direction_index()` = `8 + 2` = row 10. That's where the "Walk Down" frames live in the atlas.

### Tracking Animation State

We also need to know *when* to change animations. If your character transitions from standing still to running, we need to detect that moment and restart the animation from frame 0. Otherwise, the run animation might start mid-cycle, looking janky.

We need these components to track the *current* state of the animation. 

- **`AnimationController`**:  It knows what animation we *want* to play (e.g., "Run") and which way we are facing.
- **`AnimationState`**: It tracks if we are moving or jumping, and importantly, if we *were* moving last frame. This helps us detect state *changes* (like starting to run) so we can reset the animation timer.
- **`AnimationTimer`**: Controls how fast frames update.

Add these components to `src/characters/animation.rs`:

```rust
// Component that holds animation configuration
#[derive(Component)]
pub struct AnimationController {
    pub current_animation: AnimationType,
    pub facing: Facing,
}

impl Default for AnimationController {
    fn default() -> Self {
        Self {
            current_animation: AnimationType::Walk,
            facing: Facing::Down,
        }
    }
}

#[derive(Component, Default)]
pub struct AnimationState {
    pub is_moving: bool,
    pub was_moving: bool,
    pub is_jumping: bool,
    pub was_jumping: bool,
}

#[derive(Component, Deref, DerefMut)]
pub struct AnimationTimer(pub Timer);
```

### Frame Calculation

Now we know *which* animation to play (Walk, Run, Jump) and *which* direction the character is facing. But how do we translate that into "show frame 47 from the texture atlas right now"?

Think of the spritesheet as a numbered grid, reading left-to-right, top-to-bottom. If "Walk Down" is on row 2 and the grid has 12 columns, the first frame of that animation is at position 24 (because we skip the first 2 rows: 2 × 12 = 24). If the animation has 6 frames, we'll cycle through positions 24, 25, 26, 27, 28, 29, then loop back to 24.

We'll create an `AnimationClip` struct to handle this math for us.

```rust
// Runtime animation clip helper
#[derive(Clone, Copy)]
pub struct AnimationClip {
    first: usize,
    last: usize,
}

impl AnimationClip {
    pub fn new(row: usize, frame_count: usize, atlas_columns: usize) -> Self {
        let first = row * atlas_columns;
        Self {
            first,
            last: first + frame_count - 1,
        }
    }
    
    pub fn start(self) -> usize {
        self.first
    }
    
    // Check if a frame index belongs to this clip
    pub fn contains(self, index: usize) -> bool {
        (self.first..=self.last).contains(&index)
    }
    
    // Calculate the next frame, looping back to start if needed
    pub fn next(self, index: usize) -> usize {
        if index >= self.last {
            self.first
        } else {
            index + 1
        }
    }
}
```

The `AnimationClip` struct stores just two numbers: the `first` and `last` frame indices for a specific animation sequence. The `new` method calculates these indices from the row, frame count, and atlas width. 

The `start` method returns where the animation begins. The `contains` method checks if a given frame index belongs to this clip (useful for detecting if we've wandered into the wrong animation). The `next` method advances to the next frame, automatically looping back to the start when we reach the end.

**Connecting Clips to Controllers**

Now that we have a way to represent frame ranges, we need to connect it to our `AnimationController`. Remember, the controller knows *what* animation to play ("Run") and *which* direction we're facing ("Left"). We'll add a helper method that combines this information with the character's configuration data to produce the correct `AnimationClip`.

Now we can add a method to `AnimationController` to easily get the current clip based on the character's config:

```rust
impl AnimationController {
    pub fn get_clip(&self, config: &CharacterEntry) -> Option<AnimationClip> {
        // 1. Get the definition (e.g. "Walk" data)
        let def = config.animations.get(&self.current_animation)?;
        
        // 2. Calculate the actual row based on facing direction
        let row = if def.directional {
            def.start_row + self.facing.direction_index()
        } else {
            def.start_row
        };
        
        // 3. Create the clip
        Some(AnimationClip::new(row, def.frame_count, config.atlas_columns))
    }
}
```

### Animating Characters

Finally, the system that ties it all together. This system runs every frame and:
1. Checks if the animation changed (e.g., started moving).
2. If changed, resets the timer and frame index.
3. If not changed, ticks the timer and advances the frame.

```rust
// Generic animation system - works for ALL entities
pub fn animate_characters(
    time: Res<Time>,
    mut query: Query<(
        &AnimationController,
        &AnimationState,
        &mut AnimationTimer,
        &mut Sprite,
        &CharacterEntry,
    )>,
) {
    for (animated, state, mut timer, mut sprite, config) in query.iter_mut() {
        
        let Some(atlas) = sprite.texture_atlas.as_mut() else { continue; };
        
        // Get the correct clip for current state/facing
        let Some(clip) = animated.get_clip(config) else { continue; };
        
        // Get timing info
        let Some(anim_def) = config.animations.get(&animated.current_animation) else { continue; };
        
        // Safety: If we somehow ended up on a frame outside our clip, reset.
        if !clip.contains(atlas.index) {
            atlas.index = clip.start();
            timer.0.reset();
        }
        
        // Detect state changes
        let just_started_moving = state.is_moving && !state.was_moving;
        let just_stopped_moving = !state.is_moving && state.was_moving;
        let just_started_jumping = state.is_jumping && !state.was_jumping;
        let just_stopped_jumping = !state.is_jumping && state.was_jumping;
        
        let animation_changed = just_started_moving || just_started_jumping 
                              || just_stopped_moving || just_stopped_jumping;
        
        if animation_changed {
            // Reset animation
            atlas.index = clip.start();
            timer.0.set_duration(std::time::Duration::from_secs_f32(anim_def.frame_time));
            timer.0.reset();
        } else if state.is_moving || state.is_jumping {
            // Advance animation
            timer.tick(time.delta());
            if timer.just_finished() {
                atlas.index = clip.next(atlas.index);
            }
        }
    }
}

// Helper to update "was_moving" flags at the end of the frame
pub fn update_animation_flags(mut query: Query<&mut AnimationState>) {
    for mut state in query.iter_mut() {
        state.was_moving = state.is_moving;
        state.was_jumping = state.is_jumping;
    }
}
```

**Detecting State Changes**

`is_moving` tells us the current state ("am I moving right now?"), while `was_moving` tells us the previous frame's state ("was I moving last frame?"). When `is_moving` is true but `was_moving` is false, we know the player *just* pressed a movement key. That's when we reset the animation to frame 0.

Without this detection, animations would continue from wherever they left off, creating jarring transitions. Imagine your character's walk cycle is on frame 5, then you press jump without resetting, the jump animation would start at frame 5 instead of frame 0, looking broken.

**Why do we need `update_animation_flags`?**<br>
We need `update_animation_flags` to run *after* all logic is done, so that in the *next* frame, `was_moving` correctly reflects the previous frame's state. This allows us to detect the exact moment a state changes.
