---
layout: post
title: "The Impatient Programmer's Guide to Bevy and Rust: Chapter 2 - Let There Be a World"
date: 2025-09-30 10:00:00 +0000
category: rust
tags: [rust, bevy, game development, tutorial]
excerpt: "Continue building your video game with Bevy and Rust. This second chapter covers creating a game world, implementing collision detection, and adding interactive elements to your game environment."
---

<style>
.tile-image {
  margin: 0 !important;
  object-fit: none !important;
  cursor: default !important;
  pointer-events: none !important;
}
</style>

Here's what you will be able to achieve by the end of this tutorial. 

<div style="margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-radius: 8px; border-left: 4px solid #1976d2;">
<strong>Before We Begin:</strong> <em style="font-size: 14px;">I'm constantly working to improve this tutorial and make your learning journey as enjoyable as possible! Your feedback matters - share your frustrations, questions, or suggestions on Reddit/Discord/LinkedIn. Loved it? Let me know what worked well for you! Together, we'll make game development with Rust and Bevy more accessible for everyone.</em>
</div>

## Procedural Generation

I have huge respect for artists who hand craft tiles to build game worlds. But I belong to the impatient lazy species. 

So, I thought, there has to be a better way. I went on an exploration to figure it out and came across procedural generation. 

Little did I know the complexities involved in it. I was in the verge of giving up, however because of the comments and messages from readers of chapter 1, I kept going. And the enlightment came three days ago, all the pieces suddenly fit together.

Basically it's about automatically fitting things together like a jigsaw puzzle. To solve this problem, let's again think in systems. 

**What do we need to generate the game world procedurally?**
1. Tileset.
2. Sockets for tiles because only comptable tiles should fit.
3. Comptability rules.
4. Magic algorithm that uses all the above components to generate a coherent world.

**How does this magic algorithm work?**

That “magic algorithm” has a name: Wave Function Collapse (WFC). The easiest way to see it is with a tiny Sudoku. Same idea: pick the cell with the fewest valid options, place a value, update neighbors, and repeat. If a choice leads to a dead end, undo that guess and try the next option.

**Small 4×4 Sudoku**

Let's solve this step by step, focusing on the most constrained cells first. I'll highlight the sub-grid we're working with and show exactly where we're placing each number.

<link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">

<div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #007acc;">
<strong>Initial Puzzle:</strong> We need to fill in the empty cells (marked with dots) following Sudoku rules.
</div>

<div class="columns is-mobile is-centered">
<div class="column is-narrow">
<table style="border-collapse: separate; border-spacing: 2px; font-family: 'VT323', monospace; font-size: 32px; border-radius: 8px; overflow: hidden; border: none; display: inline-block; margin-bottom: 20px;">
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7 !important; border-radius: 8px !important;">?</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #e3f2fd !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">2</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
</tr>
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #e3f2fd !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #e3f2fd !important; border-radius: 8px !important;">3</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
</tr>
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">1</td>
</tr>
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">4</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
</tr>
</table>
</div>
</div>

<div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
<strong>Step 1 — Finding the most constrained cell:</strong><br>
Let's analyze the top-left 2×2 box:
<ul>
<li>Row 1 already has: 2</li>
<li>Column 1 already has: 4</li>
<li>Top-left box already has: 3</li>
<li>Available numbers: 1, 2, 3, 4</li>
<li>Eliminating: 2 (in row), 4 (in column), 3 (in box)</li>
<li><strong>Only 1 remains!</strong></li>
</ul>
</div>

<div class="columns is-mobile is-centered">
<div class="column is-narrow">
<table style="border-collapse: separate; border-spacing: 2px; font-family: 'VT323', monospace; font-size: 32px; border-radius: 8px; overflow: hidden; border: none; display: inline-block; margin-bottom: 20px;">
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9 !important; border-radius: 8px !important; font-weight: bold;">1</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #e3f2fd !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">2</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
</tr>
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #e3f2fd !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #e3f2fd !important; border-radius: 8px !important;">3</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
</tr>
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">1</td>
</tr>
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">4</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
</tr>
</table>
</div>
</div>

<div style="margin: 20px 0; padding: 15px; background-color: #d1ecf1; border-radius: 8px; border-left: 4px solid #17a2b8;">
<strong>Propagation Effect:</strong> Now that we placed 1, we can eliminate 1 from:
<ul>
<li>Row 1: ✓ (already done)</li>
<li>Column 1: ✓ (already done)</li>
<li>Top-left 2×2 box: ✓ (already done)</li>
</ul>
This makes other cells more constrained!
</div>

<div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
<strong>Step 2 — Next most constrained cell:</strong><br>
Now let's find the next cell with the fewest options. 
</div>

<div class="columns is-mobile is-centered">
<div class="column is-narrow">
<table style="border-collapse: separate; border-spacing: 2px; font-family: 'VT323', monospace; font-size: 32px; border-radius: 8px; overflow: hidden; border: none; display: inline-block; margin-bottom: 20px;">
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9 !important; border-radius: 8px !important;">1</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7 !important; border-radius: 8px !important;">?</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">2</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
</tr>
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #e3f2fd !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #e3f2fd !important; border-radius: 8px !important;">3</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
</tr>
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">1</td>
</tr>
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">4</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
</tr>
</table>
</div>
</div>

<div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #6c757d;">
<strong>Analysis for the position:</strong>
<ul>
<li>Row 1 already has: 1, 2</li>
<li>Column 2 already has: 3</li>
<li>Top-left box already has: 1, 3</li>
<li>Available numbers: 1, 2, 3, 4</li>
<li>Eliminating: 1 (in row), 2 (in row), 3 (in column and box)</li>
<li><strong>Only 4 remains!</strong></li>
</ul>
</div>

<div class="columns is-mobile is-centered">
<div class="column is-narrow">
<table style="border-collapse: separate; border-spacing: 2px; font-family: 'VT323', monospace; font-size: 32px; border-radius: 8px; overflow: hidden; border: none; display: inline-block; margin-bottom: 20px;">
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9 !important; border-radius: 8px !important;">1</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9 !important; border-radius: 8px !important; font-weight: bold;">4</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">2</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
</tr>
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #e3f2fd !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #e3f2fd !important; border-radius: 8px !important;">3</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
</tr>
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">1</td>
</tr>
<tr>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">4</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #f5f5f5 !important; border-radius: 8px !important;">.</td>
</tr>
</table>
</div>
</div>

<div style="margin: 20px 0; padding: 15px; background-color: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
<strong>Key Insight:</strong> This is the essence of constraint propagation! Each placement immediately reduces the options for neighboring cells, making the puzzle progressively easier to solve. We continue this process: pick the most constrained cell → place the only possible value → propagate constraints → repeat.
</div>

```d2
direction: right

Pick: {
  label: |md
    **Pick cell**
    - fewest possiblities
  |
}

Filter: {
  label: |md
    **Filter**
    - apply rules
  |
}

Place: {
  label: |md
    **Place**
    - choose one option
  |
}

Propagate: {
  label: |md
    **Propagate**
    - update neighbors
    - detect contradictions
  |
}

Backtrack: {
  label: |md
    **Backtrack**
    - undo last guess
    - try next
  |
}

Pick -> Filter -> Place -> Propagate
Propagate -> Pick: repeat
Propagate -> Backtrack: if contradiction
Backtrack -> Pick
```

 Each placement immediately reduces the possibilities for neighboring cells. The cell with the fewest remaining possibilities becomes our next target. If any cell ends up with zero possibilities, we've hit a contradiction—in Sudoku, you backtrack and try a different value.

**For our tile-based world:** Think of each grid cell as a Sudoku cell, but instead of numbers, we're placing tiles. Each tile has sockets, and we define constraint rules about which socket types can connect to each other.

Let's see this in action with a step-by-step demonstration using the following water tiles. We'll learn how constraints propagate to form a coherent landscape:

<div class="columns is-mobile is-centered">
<div class="column is-narrow">
<table style="border-collapse: separate; border-spacing: 2px; font-family: 'VT323', monospace; font-size: 24px; border-radius: 8px; overflow: hidden; border: none; display: inline-block; margin-bottom: 20px;">
<tr>
<td style="padding: 4px; text-align: center; width: 50px; height: 50px; border: none !important; background-color: #f5f5f5; border-radius: 6px !important;"><img src="/assets/book_assets/tile_layers/water.png" alt="Water center" class="tile-image" style="width: 50px; height: 42px; display: block;"></td>
<td style="padding: 4px; text-align: center; width: 50px; height: 50px; border: none !important; background-color: #f5f5f5; border-radius: 6px !important;"><img src="/assets/book_assets/tile_layers/water_side_t.png" alt="Water top" class="tile-image" style="width: 50px; height: 42px; display: block;"></td>
<td style="padding: 4px; text-align: center; width: 50px; height: 50px; border: none !important; background-color: #f5f5f5; border-radius: 6px !important;"><img src="/assets/book_assets/tile_layers/water_side_b.png" alt="Water bottom" class="tile-image" style="width: 50px; height: 42px; display: block;"></td>
<td style="padding: 4px; text-align: center; width: 50px; height: 50px; border: none !important; background-color: #f5f5f5; border-radius: 6px !important;"><img src="/assets/book_assets/tile_layers/water_side_l.png" alt="Water left" class="tile-image" style="width: 50px; height: 42px; display: block;"></td>
<td style="padding: 4px; text-align: center; width: 50px; height: 50px; border: none !important; background-color: #f5f5f5; border-radius: 6px !important;"><img src="/assets/book_assets/tile_layers/water_side_r.png" alt="Water right" class="tile-image" style="width: 50px; height: 42px; display: block;"></td>
</tr>
<tr>
<td style="padding: 4px; text-align: center; width: 50px; height: 50px; border: none !important; background-color: #f5f5f5; border-radius: 6px !important;"><img src="/assets/book_assets/tile_layers/water_corner_in_tl.png" alt="Water corner in TL" class="tile-image" style="width: 50px; height: 42px; display: block;"></td>
<td style="padding: 4px; text-align: center; width: 50px; height: 50px; border: none !important; background-color: #f5f5f5; border-radius: 6px !important;"><img src="/assets/book_assets/tile_layers/water_corner_in_tr.png" alt="Water corner in TR" class="tile-image" style="width: 50px; height: 42px; display: block;"></td>
<td style="padding: 4px; text-align: center; width: 50px; height: 50px; border: none !important; background-color: #f5f5f5; border-radius: 6px !important;"><img src="/assets/book_assets/tile_layers/water_corner_in_bl.png" alt="Water corner in BL" class="tile-image" style="width: 50px; height: 42px; display: block;"></td>
<td style="padding: 4px; text-align: center; width: 50px; height: 50px; border: none !important; background-color: #f5f5f5; border-radius: 6px !important;"><img src="/assets/book_assets/tile_layers/water_corner_in_br.png" alt="Water corner in BR" class="tile-image" style="width: 50px; height: 42px; display: block;"></td>
<td style="padding: 4px; text-align: center; width: 50px; height: 50px; border: none !important; background-color: #f5f5f5; border-radius: 6px !important;"><img src="/assets/book_assets/tile_layers/water_corner_out_tl.png" alt="Water corner out TL" class="tile-image" style="width: 50px; height: 42px; display: block;"></td>
</tr>
<tr>
<td style="padding: 4px; text-align: center; width: 50px; height: 50px; border: none !important; background-color: #f5f5f5; border-radius: 6px !important;"><img src="/assets/book_assets/tile_layers/water_corner_out_tr.png" alt="Water corner out TR" class="tile-image" style="width: 50px; height: 42px; display: block;"></td>
<td style="padding: 4px; text-align: center; width: 50px; height: 50px; border: none !important; background-color: #f5f5f5; border-radius: 6px !important;"><img src="/assets/book_assets/tile_layers/water_corner_out_bl.png" alt="Water corner out BL" class="tile-image" style="width: 50px; height: 42px; display: block;"></td>
<td style="padding: 4px; text-align: center; width: 50px; height: 50px; border: none !important; background-color: #f5f5f5; border-radius: 6px !important;"><img src="/assets/book_assets/tile_layers/water_corner_out_br.png" alt="Water corner out BR" class="tile-image" style="width: 50px; height: 42px; display: block;"></td>

</tr>
</table>
</div>
</div>

**Step 1 - Initial Grid**

<div class="columns is-mobile is-centered">
<div class="column is-narrow">
<table style="border-collapse: separate; border-spacing: 2px; font-family: 'VT323', monospace; font-size: 32px; border-radius: 8px; overflow: hidden; border: none; display: inline-block; margin-bottom: 20px;">
<tr>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
</tr>
<tr>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
</tr>
</table>
</div>
</div>

We start with an empty grid where every cell can potentially hold any tile. The `?` symbols represent the "superposition" - each cell contains all possible tiles until we begin constraining them through the algorithm.

**Step 2 - First Placement**

<div class="columns is-mobile is-centered">
<div class="column is-narrow">
<table style="border-collapse: separate; border-spacing: 2px; font-family: 'VT323', monospace; font-size: 32px; border-radius: 8px; overflow: hidden; border: none; display: inline-block; margin-bottom: 20px;">
<tr>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
</tr>
<tr>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/water.png" alt="Water center" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
<td style="padding: 8px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
</tr>
</table>
</div>
</div>

The algorithm starts by placing the initial water center tile. This placement immediately constrains the neighboring cells - they now know they need to connect to water on at least one side.

**Step 3 - Propagate Constraints**

<div class="columns is-mobile is-centered">
<div class="column is-narrow">
<table style="border-collapse: separate; border-spacing: 2px; font-family: 'VT323', monospace; font-size: 32px; border-radius: 8px; overflow: hidden; border: none; display: inline-block; margin-bottom: 20px;">
<tr>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/water_side_t.png" alt="Water edge" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/water_side_t.png" alt="Water edge" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
</tr>
<tr>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/water.png" alt="Water center" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/water.png" alt="Water center" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #ffeaa7; border-radius: 8px !important;">?</td>
</tr>
</table>
</div>
</div>

Constraint propagation kicks in! The algorithm expands the water area by placing more center tiles, and the edge tiles are constrained to have water-facing sides where they connect to the water body.

**Step 4 - Final Result**

<div class="columns is-mobile is-centered">
<div class="column is-narrow">
<table style="border-collapse: separate; border-spacing: 2px; font-family: 'VT323', monospace; font-size: 32px; border-radius: 8px; overflow: hidden; border: none; display: inline-block; margin-bottom: 20px;">
<tr>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/water_corner_out_tl.png" alt="Water" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/water_side_t.png" alt="Water center" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/water_side_t.png" alt="Water center" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/water_corner_out_tr.png" alt="Water" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
</tr>
<tr>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/water_side_l.png" alt="Water center" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/water.png" alt="Water center" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/water.png" alt="Water center" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/water_side_r.png" alt="Water center" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
</tr>
</table>
</div>
</div>

The algorithm completes by filling the edges with appropriate boundary tiles. Notice how each tile connects perfectly - center tiles have water on all sides, edge tiles have water facing inward and grass edges facing outward, creating a coherent geography.

This demonstrates the core Wave Function Collapse algorithm in action:
1. **Find the most constrained cell** - the one with the fewest valid tiles that could fit
2. **Place a tile** whose sockets are compatible with its neighbors  
3. **Propagate constraints** - this placement immediately reduces the valid options for surrounding cells
4. **Repeat** until the grid is complete

When we hit a dead end (no valid tiles for a cell), our implementation takes a simpler approach than Sudoku: instead of backtracking through previous choices, we restart with a fresh random seed (up to a retry limit) and run the entire process again until we generate a valid map.

**What do you mean by fresh random seed?**

A "random seed" is a starting number that controls which "random" sequence the algorithm will follow. Same seed = same tile placement order every time. When we hit a dead end, instead of backtracking, we generate a new random seed and start over—this gives us a completely different sequence of tile choices to try.

**Can configuring this randomness help us customize maps?**

Yes! The algorithm's randomness comes from the order in which it picks cells and tiles, and we can control this to influence the final result. By adjusting the random seed or the selection strategy, we can:

- **Bias toward certain patterns** - Weight certain tiles more heavily to create specific landscape types.
- **Control size and complexity** - Influence whether we get small ponds or large lakes.
- **Create predictable variations** - Use the same seed for consistent results, or different seeds for variety.

The same tileset can generate endless variations of coherent landscapes, from simple ponds to complex branching river systems, all by tweaking the randomness probability configuration.

<div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
While Wave Function Collapse is powerful, it has its limitations.
<ul>
<li><strong>No large-scale structure control</strong> - WFC focuses on tile compatibility, so it won't automatically create big patterns like "one large lake" or "mountain ranges".</li>
<li><strong>Can get stuck</strong> - Complex rules might lead to impossible situations where no valid tiles remain, requiring restarts.</li>
<li><strong>Performance depends on complexity</strong> - More tile types and stricter rules increase computation time and failure rates.</li>
<li><strong>Requires careful rule design</strong> - Poorly designed compatibility rules can lead to unrealistic or broken landscapes.</li>
</ul>
We'll address these limitations in a later chapter. For now, we'll focus on building a functional section of our game world that will become the foundation for building larger game worlds.
</div>


## Setting up systems

Before we begin procedural generation, let's set up few essential systems. We will be using `bevy_procedural_tilemaps` [crate](https://crates.io/crates/bevy_procedural_tilemaps). I built this by forking `ghx_proc_gen` [library](https://crates.io/crates/ghx_proc_gen), primarly because I wanted to make it compatable with the new bevy 0.17 and also make it simple for learners to use. 

If you need advanced features, check out the original `ghx_proc_gen` [crate](https://crates.io/crates/ghx_proc_gen) by Guillaume Henaux, which includes 3D capabilities and debugging tools.

Hope you are following the code from first chapter. Here's the [source code](https://github.com/jamesfebin/ImpatientProgrammerBevyRust). 

Update your `Cargo.toml` with the bevy_procedural_tilemaps crate. 

```rust
[package]
name = "bevy_game"
version = "0.1.0"
edition = "2024" 

[dependencies]
bevy = "0.17.2" // Line update alert 
bevy_procedural_tilemaps = "0.1.2" // Line update alert
```

## The Map Module

We'll create a dedicated `map` folder inside the `src` folder to house all our world generation logic.

**Why create a separate folder for map generation?**

The map system is complex and requires multiple specialized components working together. World generation involves:

- **Asset management** - Loading and organizing hundreds of tile images.
- **Rule definitions** - Complex compatibility rules between different terrain types.
- **Grid setup** - Configuring map dimensions and coordinate systems.

Trying to fit all this logic into a single file would create a large file that can become difficult to navigate.

```
src/
├── main.rs
├── player.rs
└── map/
    ├── mod.rs       
    ├── sockets.rs       
```

**What's `mod.rs`**

The `mod.rs` file is Rust's way of declaring what modules exist in a folder. Think of it as the "table of contents" for our map module. Add the following line to your `mod.rs`.

```rust
// src/map/mod.rs
pub mod assets;   // Exposes assets.rs as a module
```

**Why `mod.rs` specifically?**

It's Rust convention, when you create a folder, Rust looks for `mod.rs` to understand the module structure.

Let's start by creating our `assets.rs` file. This will handle how we define what gets spawned in our world.

The `bevy_procedural_tilemaps` library can generate complex worlds, but it needs to know **what to actually place** at each generated location. 

Think about it: when the algorithm decides "this should be a grass tile," it needs to know:
- Which sprite to use from our tilemap
- Where exactly to position it
- What components to add (collision, physics, etc.)

The library expects us to provide this information in a very specific format. For every single tile type, we'd need to write something like this:

```rust
// Pseudo code warning, don't use
// Without SpawnableAsset - Lots of boilerplate for each tile

ModelAsset {
    assets_bundle: AtlasSpriteAsset {
        image: tilemap_handles.image.clone(),
        layout: tilemap_handles.layout.clone(),
        atlas_index: 42, // Hard to remember which sprite is which
    },
    grid_offset: GridDelta::new(0, 0, 0),
    world_offset: Vec3::ZERO,
    spawn_commands: |_| {},
}
```

Now imagine doing this for **every single tile type** in your game - grass, dirt, trees, rocks, water, etc. You'd have hundreds of these complex definitions.

This is where `SpawnableAsset` comes in. It's our **abstraction layer** to help you avoid unnecessary boilerplate. 

```rust
// src/map/assets.rs

use bevy::{prelude::*, sprite::Anchor};
use bevy_procedural_tilemaps::prelude::*;
use crate::map::tilemap::TILEMAP;

#[derive(Clone)]
pub struct SpawnableAsset {
    /// Name of the sprite inside our tilemap atlas
    sprite_name: &'static str,
    /// Offset in grid coordinates (for multi-tile objects)
    grid_offset: GridDelta,
    /// Offset in world coordinates (fine positioning)
    offset: Vec3,
    /// Function to add custom components (like collision, physics, etc.)
    components_spawner: fn(&mut EntityCommands),
}

impl SpawnableAsset {
    pub fn new(sprite_name: &'static str) -> Self {
        Self {
            sprite_name,
            grid_offset: GridDelta::new(0, 0, 0),
            offset: Vec3::ZERO,
            components_spawner: |_| {}, // Default: no extra components
        }
    }

    pub fn with_grid_offset(mut self, offset: GridDelta) -> Self {
        self.grid_offset = offset;
        self
    }

    pub fn sprite_name(&self) -> &'static str {
        self.sprite_name
    }
}
```

**SpawnableAsset Struct**
- `sprite_name`: Gives a name to your sprite (like "grass", "tree", "rock").
- `grid_offset`: For objects that span multiple tiles ().
- `offset`: Fine-tuning the position.
- `components_spawner`: A function that adds custom behavior (collision, physics, etc.).


