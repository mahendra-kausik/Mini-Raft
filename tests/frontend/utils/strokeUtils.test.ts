import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateId, generateBoardCode, createStroke, serializeStroke, getUserId } from '../../../frontend/src/utils/strokeUtils';

describe('strokeUtils', () => {
  describe('generateId', () => {
    it('returns a valid UUID string', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('generates unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('generateBoardCode', () => {
    it('returns a 6-character string', () => {
      const code = generateBoardCode();
      expect(code).toHaveLength(6);
    });

    it('contains only lowercase alphanumeric characters', () => {
      const code = generateBoardCode();
      expect(code).toMatch(/^[a-z0-9]{6}$/);
    });
  });

  describe('getUserId', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it('generates and stores a userId in sessionStorage', () => {
      const userId = getUserId();
      expect(userId).toBeTruthy();
      expect(sessionStorage.getItem('userId')).toBe(userId);
    });

    it('returns the same userId on subsequent calls', () => {
      const first = getUserId();
      const second = getUserId();
      expect(first).toBe(second);
    });
  });

  describe('createStroke', () => {
    it('creates a stroke with correct properties', () => {
      const points: [number, number][] = [[0, 0], [10, 10]];
      const stroke = createStroke('board1', 'user1', '#E74C3C', 3, points);

      expect(stroke.boardId).toBe('board1');
      expect(stroke.userId).toBe('user1');
      expect(stroke.color).toBe('#E74C3C');
      expect(stroke.width).toBe(3);
      expect(stroke.points).toEqual(points);
      expect(stroke.id).toBeTruthy();
      expect(stroke.timestamp).toBeGreaterThan(0);
    });
  });

  describe('serializeStroke', () => {
    it('serializes a stroke as a JSON string with type field', () => {
      const stroke = createStroke('board1', 'user1', '#E74C3C', 3, [[0, 0], [10, 10]]);
      const json = serializeStroke(stroke);
      const parsed = JSON.parse(json);

      expect(parsed.type).toBe('stroke');
      expect(parsed.stroke.boardId).toBe('board1');
    });
  });
});
