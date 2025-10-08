---
layout: post
title: "The Impatient Programmer's Guide to Bevy and Rust: Chapter 2 - Let There Be a World"
date: 2025-09-30 10:00:00 +0000
category: rust
tags: [rust, bevy, game development, tutorial]
excerpt: "Continue building your video game with Bevy and Rust. This second chapter covers creating a game world, implementing collision detection, and adding interactive elements to your game environment."
---

Here's what you will be able to achieve by the end of this tutorial. 

Before we begin, I am constantly looking for ways to improve this tutorial and make the learning experience enjoyable, please comment your frustrations on reddit/discord. If you like it please write that too.

I have huge respect for artists who hand craft tiles to build game worlds. But I belong to the impatient lazy species. So, I thought, there has to be a better way. I went on an exploration to figure it out. Little did I know the complexity involved in procedural generation. I was in the verge of giving up, but because of the comments and messages from readers of chapter 1, I kept going. And the enlightment came three days ago, all the pieces suddenly fit together.

Basically it's about automatically fitting things together like a jigsaw puzzle. To solve this problem, let's again think in systems. 

**What do we need to generate the game world procedurally?**
1. Tileset.
2. Sockets for tiles because only comptable tiles should fit.
3. Comptability rules.
4. Magic algorithm that uses all the above components to generate a coherent world.

**How does this magic algorithm work?**
//Todo introduce wave function algorithm in the same tone in 4-5 lines, start with telling how similar this is like solving a sudoku puzzle.

//Todo Use table/columns to give an example of sudoku solving with a couple of iterations (with examples) of how picking cell with minimal entropy works, how picking something minimized possiblities, and other things...

//Todo Continue to explain constraint propogation..

//Todo Now connect it back to procedural world generation.