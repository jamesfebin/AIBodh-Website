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

## Building the Characters Module

In Chapter 1 we hardcoded the player attributes directly into Rust. In this chapter we move that information into `src/assets/characters/characters.ron`.

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

### Setting up the module

With our data file in place, we need code that reads it and spawns the player. We’re going to replace the Chapter 1 `player.rs` with a new `characters` module. 

Hence Delete `src/player.rs` and remove `mod player;` and `PlayerPlugin` usage from `main.rs`.

Create a new folder `src/characters/` with the following files:

```
characters/
├── mod.rs
├── config.rs
└── spawn.rs
```

Let's start by focusing on `config.rs`

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

`CharactersList` groups all your `CharacterEntry` configs into one loadable asset, so Bevy can read every character’s data from a single JSON/RON file instead of loading many separate files.

**What's the purpose of using `Asset`, `TypePath` macros?**  
`Asset` simply tells Bevy “this struct is something you can load from disk and store in the asset server.” `TypePath` gives Bevy a unique name for the type so it knows exactly which asset you’re asking for later. Together they turn `CharacterEntry`/`CharactersList` into first-class loadable data, the same way textures or audio files already work.

**What's `HashMap<AnimationType, AnimationDefinition>` doing?**  
Each character needs different timing and sprite rows for `Walk`, `Run`, `Jump`, etc. The `HashMap` is simply a lookup table with key as `AnimationType`, so when the animation system asks for `AnimationType::Run`, it instantly receives the corresponding `AnimationDefinition` (start row, frame count, frame speed, directional flag). 