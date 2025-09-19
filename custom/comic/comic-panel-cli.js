#!/usr/bin/env node
/*
 * Comic Panel Generator
 * Consumes a markdown storyboard to compose two-character dialogue panels from sprite assets.
 */
const fs = require('fs');
const path = require('path');

const PERSONA_LOOKUP = {
  guy: 'male',
  male: 'male',
  man: 'male',
  boy: 'male',
  dude: 'male',
  bro: 'male',
  // Female synonyms
  girl: 'female',
  female: 'female',
  woman: 'female',
  lady: 'female',
  gal: 'female'
};

const SIDE_LOOKUP = {
  left: new Set(['left', 'l']),
  right: new Set(['right', 'r'])
};

function usage(message) {
  if (message) {
    console.error(`Error: ${message}`);
  }
  console.error(`\nUsage: node comic-panel-cli.js <storyboard.md> [outputDir]\n`);
  console.error(`Markdown cheatsheet:\n  panelWidth: 1024\n  panelHeight: 768\n  spriteScale: 0.9\n  fontFamily: 'Space Mono', monospace\n  fontSize: 34\n  fontColor: #111111\n  fontPath: path/to/SpaceMono.ttf\n  spriteRoot: output\n  background: #ffffff\n  margin: 48\n  dialogueAreaHeight: 240\n  outputExtension: svg\n\n  \`\`\`comic Briefing\n  background = #fefefe\n  left_guy_smile: Ready for the briefing?\n  right_girl_angry: Only if you updated the sprites.\n  left_guy_smile: All polished. Let's deploy.\n  \`\`\``);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
  usage();
}

const storyboardPath = path.resolve(args[0]);
const outputDir = path.resolve(args[1] || 'comic_panels');

if (!fs.existsSync(storyboardPath)) {
  usage(`Storyboard not found: ${storyboardPath}`);
}

const storyboard = parseStoryboard(storyboardPath);
const {
  panelWidth,
  panelHeight,
  spriteScale,
  fontFamily,
  fontSize,
  fontColor,
  fontPath: fontPathSetting,
  background,
  margin: defaultMargin,
  dialogueAreaHeight: defaultDialogueArea,
  outputExtension,
  panels
} = storyboard;

if (!panels.length) {
  usage('Storyboard contains no panels.');
}

ensureDir(outputDir);

const resolvedFontPath = fontPathSetting ? path.resolve(path.dirname(storyboardPath), fontPathSetting) : null;

panels.forEach((panel, index) => {
  validatePanel(panel, index);
  const svgContent = buildPanelSvg({
    panel,
    panelWidth,
    panelHeight,
    spriteScale,
    fontFamily,
    fontSize,
    fontColor,
    fontPath: resolvedFontPath,
    background,
    defaultMargin,
    defaultDialogueArea,
    storyboardDir: path.dirname(storyboardPath)
  });
  const filename = `panel-${String(index + 1).padStart(2, '0')}.${outputExtension}`;
  const outPath = path.join(outputDir, filename);
  fs.writeFileSync(outPath, svgContent, 'utf8');
  console.log(`Created ${outPath}`);
});

function sanitizeExtension(ext) {
  if (!ext) return 'svg';
  const candidate = String(ext).replace(/^[.]+/, '').trim();
  if (!candidate) return 'svg';
  if (!/^[a-z0-9_-]+$/i.test(candidate)) {
    throw new Error(`Invalid output extension: ${ext}`);
  }
  return candidate;
}

function parseStoryboard(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  const settings = {
    panelWidth: 1024,
    panelHeight: 768,
    spriteScale: 0.85,
    fontFamily: "'Space Mono', monospace",
  fontSize: 34,
  fontColor: '#111111',
  fontPath: null,
  background: '#ffffff',
    margin: 48,
    dialogueAreaHeight: 240,
    outputExtension: 'svg',
    spriteRoot: 'output'
  };

  const fenceRegex = /```comic(?:\s+([^\n`]+))?\n([\s\S]*?)```/g;
  const panels = [];

  const firstFenceIndex = content.search(/```comic/);
  const preamble = firstFenceIndex === -1 ? content : content.slice(0, firstFenceIndex);
  preamble.split(/\r?\n/).forEach((rawLine, index) => {
    const match = rawLine.match(/^([A-Za-z][\w-]*):\s*(.+)$/);
    if (match) {
      applyGlobal(settings, match[1].toLowerCase(), match[2].trim(), index + 1);
    }
  });

  const storyboardDir = path.dirname(filePath);
  const spriteRootAbs = path.resolve(storyboardDir, settings.spriteRoot || 'output');
  const catalog = buildSpriteCatalog(spriteRootAbs);

  let encountered = false;
  let fenceMatch;
  let panelIndex = 0;
  while ((fenceMatch = fenceRegex.exec(content)) !== null) {
    encountered = true;
    panelIndex += 1;
    const title = fenceMatch[1] ? fenceMatch[1].trim() : '';
    const body = fenceMatch[2];
    const panel = parsePanelBlock(body, title, panelIndex, {
      catalog,
      panelIndex,
      spriteRoot: spriteRootAbs
    });
    panels.push(panel);
  }

  if (!encountered) {
    throw new Error('Storyboard must include at least one ```comic``` fenced code block.');
  }

  if (!panels.length) {
    throw new Error('No panels could be parsed from the storyboard. Ensure each ```comic``` block defines both left/right sprites and dialogue.');
  }

  return {
    ...settings,
    spriteRoot: spriteRootAbs,
    outputExtension: sanitizeExtension(settings.outputExtension),
    panels
  };
}

function applyGlobal(settings, key, value, lineNumber) {
  switch (key) {
    case 'panelwidth':
      settings.panelWidth = parsePositiveInt(value, key, lineNumber);
      break;
    case 'panelheight':
      settings.panelHeight = parsePositiveInt(value, key, lineNumber);
      break;
    case 'spritescale':
      settings.spriteScale = Number(value);
      if (!Number.isFinite(settings.spriteScale) || settings.spriteScale <= 0) {
        throw new Error(`Invalid spriteScale at line ${lineNumber}.`);
      }
      break;
    case 'fontfamily':
      settings.fontFamily = value;
      break;
    case 'fontsize':
      settings.fontSize = parsePositiveInt(value, key, lineNumber);
      break;
    case 'fontcolor':
      settings.fontColor = value;
      break;
    case 'fontpath':
      settings.fontPath = value;
      break;
    case 'background':
      settings.background = value;
      break;
    case 'margin':
      settings.margin = parseNumber(value, key, lineNumber);
      break;
    case 'dialogueareaheight':
      settings.dialogueAreaHeight = parseNumber(value, key, lineNumber);
      break;
    case 'outputextension':
      settings.outputExtension = value;
      break;
    case 'spriteroot':
      settings.spriteRoot = value;
      break;
    default:
      // Ignore unknown keys to keep the format flexible.
      break;
  }
}

function parsePanelBlock(body, title, panelIndex, context) {
  const panel = {
    title,
    left: {},
    right: {},
    backgroundColor: null,
    margin: null,
    dialogueAreaHeight: null,
    dialogue: [],
    spriteScale: null,
    fontSize: null,
    fontFamily: null,
    fontColor: null
  };

  const lines = body.split(/\r?\n/);
  const panelLabel = panel.title ? `"${panel.title}"` : `#${panelIndex}`;

  lines.forEach((rawLine, idx) => {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      return;
    }

    const cleaned = trimmed.replace(/\s+#.*$/, '');
    const eqIdx = cleaned.indexOf('=');
    const colonIdx = cleaned.indexOf(':');
    const isAssignment = eqIdx !== -1 && (colonIdx === -1 || eqIdx < colonIdx);

    if (isAssignment) {
      const keyRaw = cleaned.slice(0, eqIdx).trim().toLowerCase();
      const valueRaw = cleaned.slice(eqIdx + 1).trim();
      if (!valueRaw) {
        return;
      }

      const normalizedKey = keyRaw.replace(/\s+/g, ' ');
      switch (normalizedKey) {
        case 'title': {
          panel.title = stripQuotes(valueRaw);
          break;
        }
        case 'flip-left':
        case 'left flip':
        case 'flip left':
        case 'left flipped': {
          panel.left.flip = parseBool(valueRaw, 'flip-left', idx + 1);
          break;
        }
        case 'flip-right':
        case 'right flip':
        case 'flip right':
        case 'right flipped': {
          panel.right.flip = parseBool(valueRaw, 'flip-right', idx + 1);
          break;
        }
        case 'background':
        case 'background color':
        case 'background-colour':
        case 'background colour': {
          panel.backgroundColor = stripQuotes(valueRaw);
          break;
        }
        case 'margin': {
          panel.margin = parseNumber(valueRaw, 'margin', idx + 1);
          break;
        }
        case 'dialogueareaheight':
        case 'dialogue area height':
        case 'dialogue-area-height':
        case 'dialogue area':
        case 'dialogue-area': {
          panel.dialogueAreaHeight = parseNumber(valueRaw, 'dialogueAreaHeight', idx + 1);
          break;
        }
        case 'sprite-scale':
        case 'spritescale':
        case 'panel spritescale': {
          const scale = Number(valueRaw);
          if (!Number.isFinite(scale) || scale <= 0) {
            throw new Error(`Invalid sprite scale in panel ${panelLabel} at line ${idx + 1}.`);
          }
          panel.spriteScale = scale;
          break;
        }
        case 'font-size':
        case 'fontsize': {
          panel.fontSize = parsePositiveInt(valueRaw, 'fontSize', idx + 1);
          break;
        }
        case 'font-family':
        case 'fontfamily': {
          panel.fontFamily = stripQuotes(valueRaw);
          break;
        }
        case 'font-color':
        case 'fontcolour':
        case 'font-colour': {
          panel.fontColor = stripQuotes(valueRaw);
          break;
        }
        default:
          // Ignore unknown assignments so writers can leave notes.
          break;
      }
      return;
    }

    const dialogueMatch = cleaned.match(/^([a-z0-9_-]+)\s*:\s*(.*)$/i);
    if (dialogueMatch) {
      const token = dialogueMatch[1].trim();
      const text = dialogueMatch[2].trim();
      const { side, spritePath } = resolveSpriteToken(token, context, panelLabel, idx + 1);
      if (side === 'left') {
        panel.left.sprite = spritePath;
      } else {
        panel.right.sprite = spritePath;
      }
      panel.dialogue.push({ speaker: side, text });
      return;
    }
  });

  if (!panel.left.sprite) {
    throw new Error(`Panel ${panelLabel} never references a left-side sprite. Use tokens like left_guy_smile: Hello.`);
  }

  if (!panel.right.sprite) {
    throw new Error(`Panel ${panelLabel} never references a right-side sprite. Use tokens like right_girl_angry: What?`);
  }

  if (!panel.dialogue.length) {
    throw new Error(`Panel ${panelLabel} is missing dialogue lines.`);
  }

  const leftLines = panel.dialogue.filter(line => line.speaker === 'left').length;
  const rightLines = panel.dialogue.filter(line => line.speaker === 'right').length;
  if (!leftLines || !rightLines) {
    throw new Error(`Panel ${panelLabel} must feature dialogue from both sides.`);
  }

  return panel;
}

function resolveSpriteToken(token, context, panelLabel, lineNumber) {
  const segments = token
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean);

  if (segments.length < 3) {
    throw new Error(`Panel ${panelLabel} line ${lineNumber}: use tokens like left_guy_smile to pick a sprite.`);
  }

  const sideToken = segments.shift();
  let side = null;
  if (SIDE_LOOKUP.left.has(sideToken)) {
    side = 'left';
  } else if (SIDE_LOOKUP.right.has(sideToken)) {
    side = 'right';
  }
  if (!side) {
    throw new Error(`Panel ${panelLabel} line ${lineNumber}: unknown side "${sideToken}". Use left_ or right_.`);
  }

  const personaToken = segments.shift();
  const persona = PERSONA_LOOKUP[personaToken];
  if (!persona) {
    throw new Error(`Panel ${panelLabel} line ${lineNumber}: unknown persona "${personaToken}". Choose from guy/girl (or male/female).`);
  }

  const expressionRaw = segments.join('_');
  if (!expressionRaw) {
    throw new Error(`Panel ${panelLabel} line ${lineNumber}: missing expression after ${side}_${personaToken}_...`);
  }
  const expressionKey = normalizeKey(expressionRaw);

  const spritePath = selectSpriteFromCatalog(context.catalog, persona, expressionKey);
  if (!spritePath) {
    const suggestions = listExpressions(context.catalog, persona);
    throw new Error(`Panel ${panelLabel} line ${lineNumber}: no sprite for ${persona} expression "${expressionRaw}". Available: ${suggestions}`);
  }

  return { side, spritePath };
}

function buildSpriteCatalog(rootDir) {
  const catalog = { male: {}, female: {} };
  let foundAny = false;

  ['male', 'female'].forEach(persona => {
    const dir = path.join(rootDir, persona);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      return;
    }
    const entries = fs.readdirSync(dir);
    entries.forEach(entry => {
      const ext = path.extname(entry).toLowerCase();
      if (!['.png', '.webp'].includes(ext)) {
        return;
      }
      const base = path.basename(entry, ext);
      let expression = base;
      if (base.toLowerCase().startsWith(`${persona}_`)) {
        expression = base.slice(persona.length + 1);
      }
      const key = normalizeKey(expression);
      if (!key) {
        return;
      }
      if (!catalog[persona][key]) {
        catalog[persona][key] = path.join(dir, entry);
        foundAny = true;
      }
    });
  });

  if (!foundAny) {
    throw new Error(`No sprites discovered under ${rootDir}. Add PNGs inside male/ and female/ or set spriteRoot.`);
  }

  return catalog;
}

function selectSpriteFromCatalog(catalog, persona, expressionKey) {
  const personaCatalog = catalog[persona] || {};
  if (personaCatalog[expressionKey]) {
    return personaCatalog[expressionKey];
  }

  // Attempt loose match by removing underscores
  const looseKey = expressionKey.replace(/_/g, '');
  for (const [key, value] of Object.entries(personaCatalog)) {
    if (key.replace(/_/g, '') === looseKey) {
      return value;
    }
  }

  return null;
}

function listExpressions(catalog, persona) {
  const personaCatalog = catalog[persona] || {};
  const keys = Object.keys(personaCatalog).sort();
  return keys.length ? keys.join(', ') : 'none';
}

function normalizeKey(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function stripQuotes(text) {
  const trimmed = text.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parsePositiveInt(value, key, lineNumber) {
  const num = parseInt(value, 10);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`Invalid ${key} at line ${lineNumber}.`);
  }
  return num;
}

function parseNumber(value, key, lineNumber) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid ${key} at line ${lineNumber}.`);
  }
  return num;
}

function parseBool(value, key, lineNumber) {
  const normalized = value.toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  throw new Error(`Invalid ${key} at line ${lineNumber}. Use true/false.`);
}

function validatePanel(panel, index) {
  const location = `panels[${index}]`;
  if (!panel.left || !panel.right) {
    throw new Error(`${location} must provide both left and right character blocks.`);
  }
  if (!panel.left.sprite) {
    throw new Error(`${location} never resolved a left sprite token.`);
  }
  if (!panel.right.sprite) {
    throw new Error(`${location} never resolved a right sprite token.`);
  }
  if (!panel.dialogue.length) {
    throw new Error(`${location} must include dialogue lines (e.g. left_guy_smile: Hi).`);
  }
  const invalidSpeakers = panel.dialogue.filter(line => line.speaker !== 'left' && line.speaker !== 'right');
  if (invalidSpeakers.length) {
    throw new Error(`${location} dialogue entries must begin with left_/right_ tokens.`);
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readPngMeta(filePath) {
  const buffer = fs.readFileSync(filePath);
  const pngSignature = '89504e470d0a1a0a';
  if (buffer.toString('hex', 0, 8) !== pngSignature) {
    throw new Error(`Sprite is not a PNG file: ${filePath}`);
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const encoded = buffer.toString('base64');
  return { width, height, encoded };
}

function buildPanelSvg(options) {
  const {
    panel,
    panelWidth,
    panelHeight,
    spriteScale,
    fontFamily,
    fontSize,
    fontColor,
    fontPath,
    background,
    defaultMargin,
    defaultDialogueArea,
    storyboardDir
  } = options;

  const effectiveSpriteScale = panel.spriteScale ?? spriteScale;
  const effectiveFontFamily = panel.fontFamily ?? fontFamily;
  const effectiveFontSize = panel.fontSize ?? fontSize;
  const effectiveFontColor = panel.fontColor ?? fontColor;

  const panelBackground = panel.backgroundColor || background;
  const margin = panel.margin ?? defaultMargin;
  const dialogueBottomReserve = panel.dialogueAreaHeight ?? defaultDialogueArea;
  const dialogueTop = margin;
  const spriteAreaHeight = panelHeight - dialogueBottomReserve;

  const leftSpritePath = path.resolve(storyboardDir, panel.left.sprite);
  const rightSpritePath = path.resolve(storyboardDir, panel.right.sprite);

  const leftSprite = readPngMeta(leftSpritePath);
  const rightSprite = readPngMeta(rightSpritePath);

  const leftScale = effectiveSpriteScale * Math.min(1, spriteAreaHeight / leftSprite.height);
  const rightScale = effectiveSpriteScale * Math.min(1, spriteAreaHeight / rightSprite.height);

  const leftDisplay = {
    width: leftSprite.width * leftScale,
    height: leftSprite.height * leftScale
  };

  const rightDisplay = {
    width: rightSprite.width * rightScale,
    height: rightSprite.height * rightScale
  };

  const baseY = panelHeight - margin - Math.max(leftDisplay.height, rightDisplay.height);
  const leftX = margin;
  const rightX = panelWidth - margin - rightDisplay.width;

  const defaultRightFlip = panel.right.flip !== undefined ? panel.right.flip : true;
  const defaultLeftFlip = panel.left.flip || false;

  const defs = [];
  if (fontPath) {
    if (!fs.existsSync(fontPath)) {
      throw new Error(`Font file not found: ${fontPath}`);
    }
    const fontData = fs.readFileSync(fontPath);
    const fontBase64 = fontData.toString('base64');
    defs.push(`<style>@font-face { font-family: 'Space Mono Custom'; src: url(data:font/ttf;base64,${fontBase64}) format('truetype'); font-weight: normal; font-style: normal; }</style>`);
  }

  const styleBlocks = [];
  const fontStack = fontPath ? `'Space Mono Custom', ${effectiveFontFamily}` : effectiveFontFamily;
  styleBlocks.push(`text { font-family: ${fontStack}; font-size: ${effectiveFontSize}px; fill: ${effectiveFontColor}; }`);
  styleBlocks.push(`.dialogue { line-height: ${Math.round(effectiveFontSize * 1.3)}px; }`);

  const elements = [];

  elements.push(`<rect width="${panelWidth}" height="${panelHeight}" fill="${panelBackground}" rx="24" ry="24" />`);

  elements.push(renderSprite({
    x: leftX,
    y: baseY,
    display: leftDisplay,
    encoded: leftSprite.encoded,
    flip: defaultLeftFlip
  }));

  elements.push(renderSprite({
    x: rightX,
    y: baseY,
    display: rightDisplay,
    encoded: rightSprite.encoded,
    flip: defaultRightFlip
  }));

  const dialogueElements = buildDialogue(panel.dialogue, {
    panelWidth,
    margin,
    fontSize: effectiveFontSize,
    dialogueTop
  });

  elements.push(...dialogueElements);

  const svgParts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${panelWidth}" height="${panelHeight}" viewBox="0 0 ${panelWidth} ${panelHeight}">`];
  svgParts.push('<defs>');
  svgParts.push(...defs);
  svgParts.push(`<style>${styleBlocks.join(' ')}</style>`);
  svgParts.push('</defs>');
  svgParts.push(...elements);
  svgParts.push('</svg>');
  return svgParts.join('\n');
}

function renderSprite({ x, y, display, encoded, flip }) {
  if (flip) {
    const tx = x + display.width;
    return `<image x="0" y="${y}" width="${display.width}" height="${display.height}" transform="translate(${tx} 0) scale(-1 1)" href="data:image/png;base64,${encoded}" />`;
  }
  return `<image x="${x}" y="${y}" width="${display.width}" height="${display.height}" href="data:image/png;base64,${encoded}" />`;
}

function buildDialogue(dialogue, opts) {
  const { panelWidth, margin, fontSize, dialogueTop } = opts;
  const maxTextWidth = panelWidth * 0.38;
  const charWidthEstimate = fontSize * 0.6;
  const maxCharsPerLine = Math.max(12, Math.floor(maxTextWidth / charWidthEstimate));
  const lineHeight = fontSize * 1.35;

  let currentY = dialogueTop + fontSize;
  const fragments = [];

  for (const line of dialogue) {
    const lines = wrapText(line.text || '', maxCharsPerLine);
    const blockHeight = lines.length * lineHeight;
    const anchor = line.speaker;
    const baseX = anchor === 'left' ? margin : panelWidth - margin;
    const textAnchor = anchor === 'left' ? 'start' : 'end';

    const tspans = lines.map((segment, idx) => {
      const dy = idx === 0 ? 0 : lineHeight;
      return `<tspan x="${baseX}" dy="${dy}">${escapeXml(segment)}</tspan>`;
    }).join('');

    fragments.push(`<text class="dialogue" x="${baseX}" y="${currentY}" text-anchor="${textAnchor}">${tspans}</text>`);

    currentY += blockHeight + fontSize * 0.8;
  }

  return fragments;
}

function wrapText(text, maxChars) {
  const words = text.trim().split(/\s+/);
  if (words.length === 1 && words[0] === '') {
    return [''];
  }
  const lines = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    if ((current + ' ' + word).length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
