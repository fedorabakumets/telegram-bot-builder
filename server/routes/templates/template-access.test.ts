/**
 * @fileoverview Unit-тесты доступа к шаблонам и клиентских body-схем.
 * @module server/routes/templates/template-access.test
 */

import { describe, expect, it } from "vitest";

import { canViewOrUseTemplate } from "./template-access";
import {
  createBotTemplateBodySchema,
  updateBotTemplateBodySchema,
} from "./template-body-schemas";

describe("canViewOrUseTemplate", () => {
  const me = 100;

  it("разрешает системный шаблон", () => {
    expect(canViewOrUseTemplate({ ownerId: null, isPublic: 0 }, me)).toBe(true);
  });

  it("разрешает публичный чужой", () => {
    expect(canViewOrUseTemplate({ ownerId: 999, isPublic: 1 }, me)).toBe(true);
  });

  it("разрешает свой приватный", () => {
    expect(canViewOrUseTemplate({ ownerId: me, isPublic: 0 }, me)).toBe(true);
  });

  it("запрещает чужой приватный", () => {
    expect(canViewOrUseTemplate({ ownerId: 999, isPublic: 0 }, me)).toBe(false);
  });
});

describe("createBotTemplateBodySchema", () => {
  const base = {
    name: "Test",
    data: { sheets: [] },
  };

  it("принимает валидное тело", () => {
    const parsed = createBotTemplateBodySchema.parse(base);
    expect(parsed.name).toBe("Test");
    expect(parsed.isPublic).toBe(0);
  });

  it("игнорирует featured (strip, не попадает в parsed)", () => {
    const parsed = createBotTemplateBodySchema.parse({ ...base, featured: 1 });
    expect(parsed).not.toHaveProperty("featured");
  });

  it("игнорирует ownerId", () => {
    const parsed = createBotTemplateBodySchema.parse({ ...base, ownerId: 1 });
    expect(parsed).not.toHaveProperty("ownerId");
  });

  it("игнорирует rating", () => {
    const parsed = createBotTemplateBodySchema.parse({ ...base, rating: 5 });
    expect(parsed).not.toHaveProperty("rating");
  });
});

describe("updateBotTemplateBodySchema", () => {
  it("игнорирует featured при patch", () => {
    const parsed = updateBotTemplateBodySchema.parse({ name: "X", featured: 1 });
    expect(parsed).not.toHaveProperty("featured");
    expect(parsed.name).toBe("X");
  });

  it("принимает частичное имя", () => {
    expect(updateBotTemplateBodySchema.parse({ name: "X" }).name).toBe("X");
  });
});
