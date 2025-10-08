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

//Todo It's very hard to follow this writeup and visualize how it works on head, instead give examples of a sudoku puzzle use table for it, add some numbers and with iterations how it's solved, and write the lines next to it, so reader can understand it intuitively.

Think of the Wave Function Collapse (WFC) algorithm (//Todo, connect the magic algorithm to Wave function collapse algorithm, continue the flow, this seems to come from no where. ) as a patient Sudoku solver. It looks at the grid, finds the most constrained cell, and tests the possibilities that still follow the rules. Each choice it makes shrinks the options for everything around it. If the puzzle hits a contradiction, it backtracks, flips to the next option, and keeps going until the board is filled. Same calm, systematic vibe—just applied to tiles instead of numbers.

//Todo below table is useless, lot of mental efforts to map what woks.
| Step | Cell Picked (least options) | Possible Numbers Before | Decision Made | Effect on Neighbors |
| --- | --- | --- | --- | --- |
| 1 | Row 1, Col 2 | {3, 7} | Place **3** | Removes 3 from row/col/box peers |
| 2 | Row 4, Col 2 | {1, 7} | Place **7** | Narrows peers to {1, 5, 9} |
| 3 | Row 4, Col 5 | {2} | Forced **2** | Locks entire row except last cell |
| 4 | Row 4, Col 7 | {5, 9} | Try **5** | If later contradiction, swap to 9 |

That “remove options for peers” step is constraint propagation in action. Every time we set a cell, we immediately update its row, column, and box. The less freedom a neighbor has, the sooner it becomes the next target. If a neighbor ends up with zero options, we know the previous guess was bad and we roll back.

Procedural world generation follows the same loop. A cell in our tile grid is like a Sudoku cell. The sockets act as the row/column rules. We pick the most constrained location, try a tile, shrink what its neighbors are allowed to be, and keep marching. When a choice breaks the rules, we undo it and try the next tile until the entire map snaps together.
