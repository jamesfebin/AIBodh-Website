---
layout: post
title: "The Impatient Programmer's Guide to Bevy and Rust: Chapter 2 - Let There Be a World"
date: 2025-09-30 10:00:00 +0000
category: rust
tags: [rust, bevy, game development, tutorial]
excerpt: "Continue building your video game with Bevy and Rust. This second chapter covers creating a game world, implementing collision detection, and adding interactive elements to your game environment."
---

Here's what you will be able to achieve by the end of this tutorial. 

<div style="margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-radius: 8px; border-left: 4px solid #1976d2;">
<strong>Before We Begin:</strong> <em style="font-size: 14px;">I'm constantly working to improve this tutorial and make your learning journey as enjoyable as possible! Your feedback matters - share your frustrations, questions, or suggestions on Reddit/Discord/LinkedIn. Loved it? Let me know what worked well for you! Together, we'll make game development with Rust and Bevy more accessible for everyone.</em>
</div>

I have huge respect for artists who hand craft tiles to build game worlds. But I belong to the impatient lazy species. 

So, I thought, there has to be a better way. I went on an exploration to figure it out. Little did I know the complexity involved in procedural generation. 

I was in the verge of giving up, but because of the comments and messages from readers of chapter 1, I kept going. And the enlightment came three days ago, all the pieces suddenly fit together.

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
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #e3f2fd !important; border-radius: 8px !important;">?</td>
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
<td style="padding: 12px; text-align: center; width: 60px; height: 60px; border: none !important; background-color: #e3f2fd !important; border-radius: 8px !important;">?</td>
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
    - fewest candidates
  |
}

Filter: {
  label: |md
    **Filter**
    - apply rules
    - compute candidates
  |
}

Place: {
  label: |md
    **Place**
    - choose one candidate
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

That “remove options for peers” step is constraint propagation. Each placement immediately trims the candidates for its neighbors. The least-free cell becomes the next target. If any neighbor reaches zero candidates in Sudoku, you backtrack and try a different path.

For our world: a grid cell is like a Sudoku cell, and sockets are the rules. We pick the most constrained location, place a tile that matches the neighbors’ sockets, propagate those constraints, and continue. When we get stuck, our implementation does not backtrack; it retries from a fresh random seed (up to a retry limit) and reruns the loop until a valid map falls out.
