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

I respect artists who hand craft tiles to build game worlds. But I belong to the impatient/lazy species. 

I went on an exploration and came across procedural generation. 

Little did I know the complexities involved. I was in the verge of giving up, however because of the comments and messages from readers of chapter 1, I kept going. And the enlightment came three days ago, all the pieces fit together.

Basically it's about automatically fitting things together like a jigsaw puzzle. To solve this problem, let's again think in systems. 

**What do we need to generate the game world procedurally?**
1. Tileset.
2. Sockets for tiles because only compatible tiles should fit.
3. Compatibility rules.
4. Magic algorithm that uses these components to generate a coherent world.

**How does this magic algorithm work?**

That “magic algorithm” has a name: Wave Function Collapse (WFC). The easiest way to see it is with a tiny Sudoku. Same idea: pick the cell with the fewest valid options, place a value, update neighbors, and repeat. If a choice leads to a dead end, undo that guess and try the next option.

**Small 4×4 Sudoku**

Let's solve this step by step, focusing on the most constrained cells first. 

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

Let's see this in action using the following water tiles. We'll learn how constraints propagate to form a coherent environment:

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

The algorithm starts by placing the initial water center tile (almost). This placement immediately constrains the neighboring cells - they now know they need to connect to water on at least one side.

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

## From Theory to Implementation

Now that we understand **how** Wave Function Collapse works—the constraint propagation, socket compatibility, and tile placement logic—it's time to transform this knowledge into actual running code.

**The reality of implementation:**

Building a WFC algorithm from scratch is complex. You'd need to implement:
- Constraint propagation across the entire grid
- Backtracking when hitting dead ends
- Efficient data structures for tracking possibilities
- Grid coordinate management
- Random selection with proper probability weights

That's a lot of algorithmic complexity before we even get to the game-specific parts like sprites, rules, and world design.

**Our approach:**

Instead of reinventing the wheel, we'll use a library that handles the WFC algorithm internals. This lets us focus on what makes our game unique: the tiles, the rules, the world aesthetics. We define **what** we want; the library figures out **how** to achieve it.


## Setting Up Our Toolkit

Let's add the procedural generation library to our project. We'll be using the `bevy_procedural_tilemaps` [crate](https://crates.io/crates/bevy_procedural_tilemaps), which I built by forking `ghx_proc_gen` [library](https://crates.io/crates/ghx_proc_gen). I created this fork primarily to ensure compatibility with Bevy 0.17 and to simplify this tutorial. 

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

## Bevy Procedural Tilemaps

The `bevy_procedural_tilemaps` library is a powerful tool that handles the complex logic of generating coherent, rule-based worlds. 

### What the Library Handles

The library takes care of the **algorithmic complexity** of procedural generation:

- **Rule Processing**: Converts our game rules into the library's internal format.
- **Generator Creation**: Builds the procedural generation engine with our configuration.
- **Constraint Solving**: Figures out which tiles can go where based on rules.
- **Grid Management**: Handles the 2D grid system and coordinate transformations.  
- **Entity Spawning**: Creates Bevy entities and positions them correctly.

### What We Need to Provide

We need to give the library the **game-specific information** it needs:

- **Sprite Definitions**: What sprites to use for each tile type.
- **Compatibility Rules**: Which tiles can be placed next to each other.
- **Generation Configuration**: The patterns and constraints for our specific game world.
- **Asset Data**: Sprite information, positioning, and custom components.


```d2

direction: right

Sprite Atlas: {
  shape: rectangle
}

Asset Definitions: {
  shape: rectangle
}

Compatibility Rules: {
  shape: rectangle
}

Model Organizer: {
  shape: rectangle
}

Generation Config: {
  shape: rectangle
}

Library Interface: {
  shape: rectangle
}

Sprite Atlas -> Asset Definitions: "Sprite names"
Asset Definitions -> Model Organizer: "What to spawn"
Compatibility Rules -> Model Organizer: "What can go where"
Model Organizer -> Library Interface: "Organized models"
Generation Config -> Library Interface: "Generation settings"
```

### How the System Works Together

The library pipeline works in stages: first it processes our rules and builds a generator, then the constraint solver figures out valid tile placements, and finally the entity spawner creates the actual game objects in the Bevy world.

### The Workflow

1. **We Define**: Create tile definitions, compatibility rules, and generation patterns
2. **Library Processes**: Runs the constraint-solving algorithm to find valid tile placements
3. **Library Spawns**: Creates Bevy entities with the correct sprites, positions, and components
4. **Result**: A coherent, rule-based world appears in our game

The beauty of this system is that we focus on **what we want** (environment design), while the library handles **how to achieve it** (complex algorithms). This separation of concerns makes procedural generation accessible to game developers without requiring deep knowledge of constraint-solving algorithms.

**What's a generator?**

A generator is the core engine that runs the procedural generation algorithm. It's a puzzle solver that takes our rules (which tiles can go where) and our grid (the empty world), then systematically figures out how to fill every position with valid tiles. It uses constraint-solving algorithms to ensure that every tile placement follows our compatibility rules, creating a coherent world that makes sense according to our game's logic.

```d2

direction: right

Our Code: {
  shape: rectangle
}

Rule Processing: {
  shape: rectangle
}

Generation Engine: {
  shape: rectangle
}

Entity Creation: {
  shape: rectangle
}

Bevy World: {
  Generated Entities: {
    shape: rectangle
  }
}

Our Code -> Rule Processing: "Models & rules"
Rule Processing -> Generation Engine: "Processed rules"
Generation Engine -> Entity Creation: "Valid tile positions"
Entity Creation -> Bevy World.Generated Entities: "Creates game objects"
```

Now that we understand how the procedural generation system works, let's build our map module.


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
    ├── assets.rs       
```

**What's `mod.rs`**

The `mod.rs` file is Rust's way of declaring what modules exist in a folder. It's like the "table of contents" for our map module. Add the following line to your `mod.rs`.

```rust
// src/map/mod.rs
pub mod assets;   // Exposes assets.rs as a module
```

**Why `mod.rs` specifically?**

It's Rust convention, when you create a folder, Rust looks for `mod.rs` to understand the module structure.

### Building the Map System

Now that we've set up our module structure, we need to build the actual components. Our map system will consist of several interconnected files:

1. **`assets.rs`** - Defines what sprites to spawn and how to position them
2. **`tilemap.rs`** - Maps sprite names to their pixel coordinates in our atlas
3. **`models.rs`** - Organizes tile models and keeps them synchronized with their assets
4. **`sockets.rs`** - Defines connection points for tile compatibility
5. **`rules.rs`** - Defines terrain layers, compatibility rules, and world generation logic
6. **`generate.rs`** - Sets up the procedural generation engine

We'll build these in a logical order, starting with the foundation and working our way up.

### Creating SpawnableAsset

Let's start by creating our `assets.rs` file inside the `map` folder. This will be the foundation that defines how we spawn sprites in our world.

The `bevy_procedural_tilemaps` library can generate complex worlds, but it needs to know **what to actually place** at each generated location. 

Think about it: when the algorithm decides "this should be a grass tile," it needs to know:
- Which sprite to use from our tilemap?
- Where exactly to position it?
- What components to add (collision, physics, etc.)?

The library expects us to provide this information in a very specific format. And doing 
this for **every single tile type** in your game - grass, dirt, trees, rocks, water, etc will result in redundant code.

This is where `SpawnableAsset` comes in. It's our **abstraction layer** to help you avoid unnecessary boilerplate. 

```rust
// src/map/assets.rs

use bevy::{prelude::*, sprite::Anchor};
use bevy_procedural_tilemaps::prelude::*;

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

```

**SpawnableAsset Struct**

The `SpawnableAsset` struct contains all the information needed to spawn a tile in our world. The `sprite_name` field gives a name to your sprite (like "grass", "tree", "rock").

The `grid_offset` is used for objects that span multiple tiles - it's a positioning within the tile grid itself. 

For example, a tree might need two tiles: the bottom part at the original position, and the top part one tile up. The `offset` field is for fine-tuning the position in world coordinates - this is for precise positioning adjustments. 

<div class="columns is-mobile is-centered">
<div class="column is-narrow">
<table style="border-collapse: separate; border-spacing: 2px; font-family: 'VT323', monospace; font-size: 32px; border-radius: 8px; overflow: hidden; border: none; display: inline-block; margin-bottom: 20px;">
<tr>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/big_tree_1_tl.png" alt="Tree top-left" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/big_tree_1_tr.png" alt="Tree top-right" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
</tr>
<tr>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/big_tree_1_bl.png" alt="Tree bottom-left" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important;"><img src="/assets/book_assets/tile_layers/big_tree_1_br.png" alt="Tree bottom-right" class="tile-image" style="width: 60px; height: 50px; display: block;"></td>
</tr>
</table>
</div>
</div>

**Grid Offset**

| Tree Part | Grid Offset | Description |
|-----------|-------------|-------------|
| Bottom-left | `(0, 0)` | Stays at original position |
| Bottom-right | `(1, 0)` | Moves one tile right |
| Top-left | `(0, 1)` | Moves one tile up |
| Top-right | `(1, 1)` | Moves one tile up and right |

<br><br>
The `offset` field, on the other hand, is for fine-tuning the position within the tile - like moving a rock slightly to the left or making sure a tree trunk is perfectly centered within its tile space.

Let's see how `offset` works with rock positioning:

<div class="columns is-mobile is-centered">
<div class="column is-narrow">
<table style="border-collapse: separate; border-spacing: 2px; font-family: 'VT323', monospace; font-size: 32px; border-radius: 8px; overflow: hidden; border: none; display: inline-block; margin-bottom: 20px;">
<tr>
<td style="padding: 3px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important; position: relative;"><img src="/assets/book_assets/tile_layers/rock_1.png" alt="Rock 1" class="tile-image" style="width: 60px; height: 50px; display: block; transform: translate(0px, 0px);"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important; position: relative;"><img src="/assets/book_assets/tile_layers/rock_2.png" alt="Rock 2" class="tile-image" style="width: 60px; height: 50px; display: block; transform: translate(-8px, -6px);"></td>
<td style="padding: 6px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #c8e6c9; border-radius: 8px !important; position: relative;"><img src="/assets/book_assets/tile_layers/rock_3.png" alt="Rock 3" class="tile-image" style="width: 60px; height: 50px; display: block; transform: translate(6px, 5px);"></td>
</tr>
</table>
</div>
</div>

**Offset**

| Rock | Offset | Description |
|------|--------|-------------|
| Rock 1 | `(0, 0)` | Centered in tile |
| Rock 2 | `(-8, -6)` | Moved slightly left and up |
| Rock 3 | `(6, 5)` | Moved slightly right and down |

Finally, the `components_spawner` is a function that adds custom behavior like collision, physics, or other game mechanics.
<br><br>

**Why is sprite name defined as `&'static str?`**

To understand `&'static str`, we need to break down each part. Let's start with the `&` symbol - this creates a **reference** to data instead of owning it. References are much more memory-efficient because they don't copy the data, they just point to where it already exists.

Here's how memory works with our sprite names:

```d2
# Memory visualization
memory: {
  shape: rectangle
  
  data_section: {
    label: "Read-only Memory"
    
    string_data: {
      label: "\"grass\"\n(actual data)"
      shape: rectangle
    }
  }
  
  stack_section: {
    label: "Stack"
    
    reference: {
      label: "&str\n(just points, no copy)"
      shape: rectangle
    }
  }
}

memory.stack_section.reference -> memory.data_section.string_data: "points to"
```

The diagram shows two different memory areas: **Stack** (where our reference lives) and **Read-only memory** (where the actual string data is stored). The reference is just metadata that says "the string 'grass' is stored at this memory address."

Our sprite name `"grass"` lives in read-only memory because it's a string literal embedded in the compiled binary, while the reference `&str` lives on the stack because it's just a fixed-size pointer (address + length) to that read-only data.



```d2
# Comparison
without_reference: {
  label: "Without Reference (Copy)"
  
  original: "\"grass\""
  copy1: "\"grass\""
  copy2: "\"grass\""
  copy3: "\"grass\""
  
  note: {
    label: "Multiple copies\nwaste memory"
    shape: text
  }
}

with_reference: {
  label: "With Reference (&)"
  
  data: "\"grass\"\n(one copy)"
  ref1: "&str"
  ref2: "&str"
  ref3: "&str"
  
  ref1 -> data
  ref2 -> data
  ref3 -> data
  
  note: {
    label: "One data, many pointers\nsaves memory"
    shape: text
  }
}

without_reference -> with_reference: "Better!"
```

**What's a string literal?**

A string literal is text that's written directly in your code, surrounded by quotes. When you write `"grass"` in your Rust code, the compiler embeds this text directly into the compiled binary. This means:

- The text `"grass"` becomes part of your executable file
- It's loaded into read-only memory when your program starts
- It exists for the entire duration of your program (hence `'static` lifetime)
- Multiple references can point to the same literal without copying the text


**What's a lifetime and what has `'static` got to do with it?**

A **lifetime** is Rust's way of tracking how long data lives in memory. Rust needs to know when it's safe to use data and when it might be deleted.

Most data has a limited lifetime. For example:
- Local variables live only while a function runs
- Function parameters live only while the function executes
- Data created in a loop might be deleted when the loop ends

But some data lives forever - like string literals embedded in your program. The `'static` lifetime means "this data lives for the entire duration of the program" - it never gets deleted.

This is perfect for our sprite names because they're hardcoded in our source code (like `"grass"`, `"tree"`, `"rock"`) and will never change or be deleted while the program runs. Rust can safely let us use these references anywhere in our code because it knows the data will always be there.

**Why does Rust need to know when it's safe to use data? Other languages don't seem to care about this.**

Most languages (like C, C++, Java, Python) handle memory safety differently:

- **C/C++**: Don't track lifetimes at all - you can accidentally use deleted data, leading to crashes or security vulnerabilities
- **Java/Python/C#**: Use garbage collection - the runtime automatically deletes unused data, but this adds overhead and unpredictable pauses
- **Rust**: Tracks lifetimes at compile time - prevents crashes without runtime overhead

Here's why this matters for game development:

**The Problem Other Languages Have**
```rust
// Psuedo code warning, don't use
// This would crash in C++ or cause undefined behavior
let sprite_name = {
    let temp = "grass";
    &temp  // temp gets deleted here!
}; 
println!("{}", sprite_name); // CRASH! Using deleted data
```

**Rust Prevents This**
<br>
Rust's compiler analyzes your code and says "Hey, you're trying to use data that might be deleted. I won't let you compile this unsafe code." This catches bugs before your game even runs.

**Does `str` mean String data type?**
<br>
Not quite. str represents text data, but you can only use it through a reference like &str (a view of text stored somewhere else). String is text you own and can modify. Our sprite names like "grass" are baked into the program, so &str just points to that text without copying it - much more efficient than using String.

**Putting it all together**
<br>
`&'static str` means "a reference to a string slice that lives for the entire program duration." This gives us the best of all worlds: memory efficiency (no copying), performance (direct access), and safety (Rust knows the data will always be valid).

**What's `GridDelta`?**

`GridDelta` is a struct that represents movement in grid coordinates. It specifies "how many tiles to move" in each direction. For example, `GridDelta::new(1, 0, 0)` means "move one tile to the right", while `GridDelta::new(0, 1, 0)` means "move one tile up". It's used for positioning multi-tile objects like the tree sprite with multiple tiles we mentioned earlier in grid offset.

**Why's components_spawner defined as `fn(&mut EntityCommands)`?**

This is a function pointer that takes a mutable reference to `EntityCommands` (Bevy's way of adding components to entities). Looking at the code in `assets.rs`, we can see it defaults to an empty function that does nothing.

The function pointer allows us to customize what components get added to each spawned entity. For example, a tree sprite might need collision components for physics, while a decorative flower might only need basic rendering components. Each sprite can have its own custom set of components without affecting others.


**Why do we need a mutable reference to EntityCommands?**

Yes! In Rust, you need a mutable reference (`&mut`) when you want to modify something. `EntityCommands` needs to be mutable because it's used to add, remove, or modify components on entities.

<br>
Now let's add some helpful methods to our `SpawnableAsset` struct to make it easier to create and configure sprite assets.

Append the following code to the same `assets.rs` file.

```rust
// src/map/assets.rs
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
}
```

**What's `-> Self`?**

In Rust, you must specify the return type of functions (unlike some languages that can infer it). The `-> Self` tells the compiler exactly what type the function returns, which helps catch errors at compile time. `Self` means "the same type as the struct this method belongs to" - so `Self` refers to `SpawnableAsset` here.

**What's `|_| {}`?**

This is a closure (anonymous function) that does nothing. The `|_|` means "takes one parameter but ignores it" (the underscore means we don't use the parameter), and `{}` is an empty function body. 

We need this because our `SpawnableAsset` struct requires a `components_spawner` field (as we saw in the struct definition), but for basic sprites we don't want to add any custom components. This empty closure serves as a "do nothing" default. We'll learn how to use this field to add custom components in later chapters, but for now it's just a placeholder that satisfies the struct's requirements.

**What's a closure? What do you mean by anonymous function?**

A **closure** is a function that can "capture" variables from its surrounding environment. An **anonymous function** means it doesn't have a name - you can't call it directly like `my_function()`. Instead, you define it inline where you need it.

**Variable capture example:**
```rust
let health = 100;
let damage = 25;

// This closure captures 'health' and 'damage' from the surrounding scope
let attack = |_| {
    health - damage  // Uses captured variables
};
```

**What this means:**
- The closure `attack` "remembers" the values of `health` and `damage` from when it was created
- Even if `health` and `damage` change later, the closure still has the original values
- The closure can use these captured variables when it's called later.

**Why use closures here?**
<br>
Closures are perfect because they can capture game state (like player health, enemy types, or configuration settings) and use that information when spawning sprites. This allows each sprite to be customized based on the current game context.

**Why is semicolon missing in the last line of these functions?**

In Rust, the last expression in a function is automatically returned without needing a `return` keyword or semicolon. This makes it easier to specify what value should be returned - you just write the expression you want to return, and Rust handles the rest. This is Rust's way of making code cleaner and more concise.

**Why can't you manipulate or retrieve `grid_offset` directly?**

The fields are private (no `pub` keyword), which means they can only be accessed from within the same module. This is called "encapsulation" - it prevents developers from making mistakes by modifying the struct's data directly, which could break the internal logic. We provide the public method `with_grid_offset()` to safely modify it while maintaining the struct's integrity.

Now that we understand how to define our sprites with `SpawnableAsset`, **how do we load and use these sprites in our game?**

## Loading Sprite Assets

Our game uses a **sprite atlas** - a single large image containing all our sprites. Bevy needs to know where each sprite is located within this image, and we need to avoid reloading the same image multiple times.


Create a folder `tile_layers` in your `src/assets` folder and place `tilemap.png` inside it, you can get it from the [github repo](https://github.com/jamesfebin/ImpatientProgrammerBevyRust). 

<div style="margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-radius: 8px; border-left: 4px solid #1976d2;">
<div style="text-align: center;">
  <img src="/assets/book_assets/tile_layers/tilemap.png" alt="Tilemap sprite atlas" style="max-width: 100%; height: auto; pointer-events: none;">
</div>
The tilemap assets used in this example are based on <a target="_blank" href="https://opengameart.org/content/16x16-game-assets">16x16 Game Assets</a>  by George Bailey, available on OpenGameArt under CC-BY 4.0 license. <strong>However, to follow this tutorial, please use tilemap.png provide from the chapter's <a target="_blank" style="font-weight:650" href="https://github.com/jamesfebin/ImpatientProgrammerBevyRust"> github repo</a>.</strong> 
</div> 

Now inside `src/map` folder create a file `tilemap.rs`. When you add a file inside map folder, ensure to register it in `mod.rs` by adding the line `pub mod tilemap`.

This is where our tilemap definition comes in - it acts as a "map" that tells Bevy the coordinates of every sprite in our atlas.

```rust
// src/map/tilemap.rs
use bevy::math::{URect, UVec2};

pub struct TilemapSprite {
    pub name: &'static str,
    pub pixel_x: u32,
    pub pixel_y: u32,
}

pub struct TilemapDefinition {
    pub tile_width: u32,
    pub tile_height: u32,
    pub atlas_width: u32,
    pub atlas_height: u32,
    pub sprites: &'static [TilemapSprite],
}
```

The `TilemapSprite` struct represents a single sprite within our atlas. It stores the sprite's name (like "dirt" or "green_grass") and its exact pixel coordinates within the atlas image. 

The `TilemapDefinition` struct serves as the "blueprint" that Bevy uses to understand how to slice up our atlas image into individual sprites.

Though our tilemap stores sprite names and pixel coordinates, Bevy's texture atlas system requires numeric indices and rectangular regions. These methods perform the necessary conversions.


Append the following code to your `tilemap.rs`.

```rust
// src/map/tilemap.rs

impl TilemapDefinition {
    pub const fn tile_size(&self) -> UVec2 {
        UVec2::new(self.tile_width, self.tile_height)
    }

    pub const fn atlas_size(&self) -> UVec2 {
        UVec2::new(self.atlas_width, self.atlas_height)
    }

    pub fn sprite_index(&self, name: &str) -> Option<usize> {
        self.sprites.iter().position(|sprite| sprite.name == name)
    }

    pub fn sprite_rect(&self, index: usize) -> URect {
        let sprite = &self.sprites[index];
        let min = UVec2::new(sprite.pixel_x, sprite.pixel_y);
        URect::from_corners(min, min + self.tile_size())
    }
}
```

The `tile_size()` method converts our tile dimensions into a `UVec2` (unsigned 2D vector), which Bevy uses for size calculations. Similarly, `atlas_size()` provides the total atlas dimensions as a `UVec2`, which Bevy uses to create the texture atlas layout.

The `sprite_index()` method is crucial for finding sprites by name. When we want to render a "dirt" tile, this method searches through our sprite array and returns the index position of that sprite. 

Finally, `sprite_rect()` takes a sprite index and calculates the exact rectangular region within our atlas that contains that sprite. It uses `URect` (unsigned rectangle) to define the boundaries, which Bevy's texture atlas system requires to know which part of the large image to display.

Now let's put our tilemap definition to use by adding our first sprite - the dirt tile.

### Adding the dirt tile

Let's start with a simple dirt tile to test our tilemap system. We'll add more sprites later as we build out our game world.

Append this code to `tilemap.rs`

```rust
// src/map/tilemap.rs
pub const TILEMAP: TilemapDefinition = TilemapDefinition {
    tile_width: 32,
    tile_height: 32,
    atlas_width: 256,
    atlas_height: 320,
    sprites: &[
          TilemapSprite {
            name: "dirt",
            pixel_x: 128,
            pixel_y: 0,
        },
    ]
};
```

Perfect! We now have a complete tilemap definition with our first sprite. Notice how we're using a const definition - this means all this sprite metadata is determined at compile time, making it very efficient. The dirt tile sits at pixel coordinates (128, 0) in our 256x320 atlas image.

### Connecting the Tilemap to Asset Loading

Now that we've defined our tilemap and sprites in `tilemap.rs`, we need to connect this to our asset loading system in `assets.rs`. `tilemap.rs` knows *where* each sprite is in our atlas from disk, while `assets.rs` will handle *loading* the atlas and converting these coordinates into actual renderable sprites.

Let's update the imports in `assets.rs` to bring in our `TILEMAP` definition:

```rust
// src/map/assets.rs
use bevy::prelude::*; 
use bevy_procedural_tilemaps::prelude::*;
use crate::map::tilemap::TILEMAP; // <--- line update alert
```

With the import in place, we can now build the three key functions that helps our procedural rendering system:

1. `TilemapHandles` - Container that holds our loaded atlas and layout data
2. `prepare_tilemap_handles` - Loads the atlas image from disk and builds the layout structure
3. `load_assets` - Converts sprite names into actual renderable sprites

Let's build these step by step.

### Step 1: Creating the TilemapHandles Struct

First, we need a way to hold references to both the atlas image and its layout. Go ahead and append this code into your `assets.rs`:

```rust
// src/map/assets.rs
#[derive(Clone)]
pub struct TilemapHandles {
    pub image: Handle<Image>,
    pub layout: Handle<TextureAtlasLayout>,
}

impl TilemapHandles {
    pub fn sprite(&self, atlas_index: usize) -> Sprite {
        Sprite::from_atlas_image(
            self.image.clone(),
            TextureAtlas::from(self.layout.clone()).with_index(atlas_index),
        )
    }
}
```

**What's happening here:**

The `TilemapHandles` struct is a container for two handles: `image` points to our loaded sprite sheet file, while `layout` points to the atlas layout that tells Bevy how to slice that image into individual sprites.

The `sprite(atlas_index)` method is a convenience function that creates a ready-to-render `Sprite` by combining the image and layout with a specific index. For example, if the dirt tile is at index 0, calling `tilemap_handles.sprite(0)` gives us a `Sprite` configured to display just the dirt tile from our atlas.

### Step 2: Loading the Atlas from Disk

Now let's create the function that actually loads the atlas image file and sets up the layout. This is where the connection to our `TILEMAP` definition becomes crucial.

```rust
pub fn prepare_tilemap_handles(
    asset_server: &Res<AssetServer>,
    atlas_layouts: &mut ResMut<Assets<TextureAtlasLayout>>,
    assets_directory: &str,
    tilemap_file: &str,
) -> TilemapHandles {
    let image = asset_server.load::<Image>(format!("{assets_directory}/{tilemap_file}"));
    let mut layout = TextureAtlasLayout::new_empty(TILEMAP.atlas_size());
    for index in 0..TILEMAP.sprites.len() {
        layout.add_texture(TILEMAP.sprite_rect(index));
    }
    let layout = atlas_layouts.add(layout);

    TilemapHandles { image, layout }
}
```

**Breaking it down:**

1. **Load the image**: `asset_server.load()` requests the atlas image file from disk
2. **Create empty layout**: `TextureAtlasLayout::new_empty(TILEMAP.atlas_size())` creates a layout matching our 256x320 atlas
3. **Register each sprite**: The loop iterates through all sprites in `TILEMAP`, using `TILEMAP.sprite_rect(index)` to get each sprite's coordinates and adding them to the layout
4. **Store and return**: The layout is added to Bevy's asset system, and we return a `TilemapHandles` containing both handles

This is where `TILEMAP.atlas_size()` and `TILEMAP.sprite_rect()` from our tilemap definition come into play - they tell Bevy exactly how to slice up our atlas image!

<div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
This function loads the atlas into memory and sets up the layout structure, but it doesn't actually generate the game world yet. We're just preparing the tools that the procedural generator will use later to create the map.
</div>

### Step 3: Converting Sprite Names to Renderable Sprites

Finally, we need a way to convert sprite names (like "dirt") into actual `Sprite` objects that can be rendered. This is the last piece that connects everything we've built so far.

```rust
pub fn load_assets(
    tilemap_handles: &TilemapHandles,
    assets_definitions: Vec<Vec<SpawnableAsset>>,
) -> ModelsAssets<Sprite> {
    let mut models_assets = ModelsAssets::<Sprite>::new();
    for (model_index, assets) in assets_definitions.into_iter().enumerate() {
        for asset_def in assets {
            let SpawnableAsset {
                sprite_name,
                grid_offset,
                offset,
                components_spawner,
            } = asset_def;

            let Some(atlas_index) = TILEMAP.sprite_index(sprite_name) else {
                panic!("Unknown atlas sprite '{}'", sprite_name);
            };

            models_assets.add(
                model_index,
                ModelAsset {
                    assets_bundle: tilemap_handles.sprite(atlas_index),
                    grid_offset,
                    world_offset: offset,
                    spawn_commands: components_spawner,
                },
            )
        }
    }
    models_assets
}
```

**Why the two loops?**

Some tiles are simple and need just one sprite (like dirt). Others are complex and need multiple sprites (like a tree that needs 4 parts). 

The outer loop says "for each type of tile," and the inner loop says "for each sprite that tile needs."

**Let's walk through what happens when we load a dirt tile:**

1. We have: `SpawnableAsset { sprite_name: "dirt", ... }`
2. The function asks TILEMAP: "Where is 'dirt'?" → TILEMAP replies: "Index 0"
3. It then asks TilemapHandles: "Give me a Sprite for index 0" → Gets back a ready-to-render `Sprite`
4. Finally, it packages everything together with the positioning info and stores it

Later, when the procedural generator decides "I need to place a dirt tile here," it grabs this prepared `Sprite` and spawns it at the right location. No need to look anything up again - it's all ready to go!


