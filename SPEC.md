# SPEC.md - Cosmic Drift: An Immersive Space Exploration Game

## 1. Project Overview

**Project Name**: Cosmic Drift
**Type**: Browser-based space exploration game (Single HTML with embedded JS/CSS)
**Core Functionality**: A meditative, immersive space game where players pilot a spacecraft through an endless procedurally-generated cosmic void, discovering ancient artifacts and navigating through mesmerizing nebulae.
**Target Users**: Casual gamers seeking a relaxing, visually stunning experience

## 2. UI/UX Specification

### Layout Structure

- **Full viewport canvas** - 100vw x 100vh, no scrolling
- **HUD Overlay** (top-left): Ship status, coordinates, discovered artifacts count
- **Mini-map** (bottom-right): 150x150px radar showing nearby objects
- **Control hints** (bottom-center): Subtle fade-in hints on first load

### Visual Design

**Color Palette**:
- Background void: `#030308` (deep space black)
- Nebula primary: `#1a0a2e` (deep purple)
- Nebula secondary: `#0d1b2a` (dark blue)
- Stars: `#ffffff`, `#ffe4c4`, `#add8e6` (white, warm, cool)
- Ship glow: `#00ffcc` (cyan accent)
- Artifact glow: `#ff6b35` (orange pulse)
- UI text: `#c8d4e3` (soft blue-white)
- UI accent: `#7b68ee` (medium slate blue)

**Typography**:
- Primary font: `"Orbitron"` (Google Fonts) - futuristic, geometric
- HUD numbers: `"Share Tech Mono"` (Google Fonts) - technical readouts
- Font sizes: HUD labels 12px, values 16px, title 24px

**Visual Effects**:
- Parallax starfield (3 layers at different speeds)
- Animated nebula clouds with CSS gradients
- Ship engine glow with pulsing animation
- Artifact pulse effect (scale + glow)
- Warp speed effect on acceleration
- Screen vignette overlay

### Components

**Spacecraft**:
- Triangle/arrow shape, 40px size
- Cyan glow trail when moving
- Rotation follows mouse/touch direction

**Stars**:
- 3 layers: far (tiny dots), mid (medium with twinkle), near (larger with glow)
- Random drift animation

**Nebulae**:
- Large gradient clouds, slowly drifting
- Multiple opacity layers for depth

**Artifacts**:
- Glowing orbs, 20px diameter
- Orange pulsing animation
- Collect animation: expand + fade + particle burst

**UI Elements**:
- Glass-morphism panels with backdrop blur
- Subtle border glow
- Smooth fade transitions

## 3. Functionality Specification

### Core Features

1. **Ship Movement**
   - Mouse/touch controls ship direction
   - WASD or Arrow keys for thrust
   - Ship has momentum/inertia
   - Maximum speed cap with gradual acceleration

2. **Procedural Generation**
   - Infinite cosmic void
   - Artifacts spawn randomly ahead of player
   - Nebula clouds at random positions
   - Star density varies by region

3. **Artifact Collection**
   - Collision detection with artifacts
   - Score increment on collection
   - Visual + audio feedback
   - Artifact count in HUD

4. **Ambient Effects**
   - Warp lines when boosting
   - Particle trails from ship
   - Screen shake on artifact collection

5. **Game State**
   - Start screen with title and "Click to Start"
   - Pause with Escape key
   - No death - purely exploratory

### User Interactions

- **Mouse move**: Ship rotates toward cursor
- **Click/WASD**: Thrust forward
- **Shift + Click**: Boost (faster movement)
- **Escape**: Pause/unpause
- **Space**: Start game from title screen

### Edge Cases

- Window resize: Canvas adapts, game continues
- Tab unfocus: Game pauses automatically
- Touch devices: Touch controls ship direction

## 4. Acceptance Criteria

- [ ] Game loads with animated title screen
- [ ] Ship responds to mouse/keyboard input smoothly
- [ ] Parallax starfield creates depth illusion
- [ ] Artifacts spawn and can be collected
- [ ] Score updates on artifact collection
- [ ] HUD displays current stats
- [ ] Warp effect visible when boosting
- [ ] No console errors during gameplay
- [ ] Smooth 60fps performance
