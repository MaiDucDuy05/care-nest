import { describe, it, expect } from 'vitest';
import { tokens } from '../src/design-tokens/tokens.js';

describe('design tokens snapshot', () => {
  it('tokens object is defined', () => {
    expect(tokens).toBeDefined();
  });

  it('primary color is teal 600', () => {
    expect(tokens.color.primary).toBe('#0d9488');
  });

  it('secondary color is indigo 600', () => {
    expect(tokens.color.secondary).toBe('#4f46e5');
  });

  it('accent color is amber 500', () => {
    expect(tokens.color.accent).toBe('#f59e0b');
  });

  it('danger color is red 500', () => {
    expect(tokens.color.danger).toBe('#ef4444');
  });

  it('success color is emerald 500', () => {
    expect(tokens.color.success).toBe('#10b981');
  });

  it('bgPage matches globals.css --bg-page', () => {
    expect(tokens.color.bgPage).toBe('#f8fafc');
  });

  it('bgCard matches globals.css --bg-card', () => {
    expect(tokens.color.bgCard).toBe('#ffffff');
  });

  it('textMain matches globals.css --text-main', () => {
    expect(tokens.color.textMain).toBe('#0f172a');
  });

  it('borderFocus matches globals.css --border-focus', () => {
    expect(tokens.color.borderFocus).toBe('#0d9488');
  });

  it('shadow.glow uses primaryGlow', () => {
    expect(tokens.shadow.glow).toBe('0 0 20px rgba(13, 148, 136, 0.25)');
  });

  it('font.sans includes Plus Jakarta Sans', () => {
    expect(tokens.font.sans).toContain('Plus Jakarta Sans');
  });

  it('radius.full is 9999px', () => {
    expect(tokens.radius.full).toBe('9999px');
  });

  it('all token values are strings', () => {
    const values: string[] = [];
    for (const section of Object.values(tokens) as Record<string, unknown>[]) {
      for (const val of Object.values(section) as unknown[]) {
        if (typeof val === 'string') values.push(val);
      }
    }
    expect(values.length).toBeGreaterThan(0);
  });
});
