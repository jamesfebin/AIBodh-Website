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

## Systems That Run Only When Needed

`Startup` and `Update` we use to trigger our systems are **schedules**. Bevy's way of organizing when systems run. `Startup` runs once at launch, `Update` runs every frame.

But what if we need systems that run at *specific moments*? Not every frame, not just at startup, but exactly when something happens like when assets finish loading, or when the player pauses the game.

### State-Based Schedules

The solution is to organize our game into distinct **phases**. We call these phases **states**: Loading, Playing, and Paused. Each state represents a different mode of the game.

When the game transitions from one state to another (say, from Loading to Playing), Bevy provides special schedules that run exactly once:

- **OnEnter** - Runs when entering a state
- **OnExit** - Runs when leaving a state

This is how we eliminate polling. Instead of `initialize_player_character` checking every frame "Are assets loaded yet?", we attach it to `OnExit(Loading)`. When assets finish loading and we leave the Loading state, Bevy runs it exactly once with no checking, no guard clauses, no wasted frames.

Here's how our game flows through states:

```d2
direction: down

Startup: {
  shape: rectangle
  label: Startup Schedule\nspawn_player()
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



