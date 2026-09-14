// ============================================================================
// ElectroVoltio - Database Schema (Drizzle ORM)
// ============================================================================

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  jsonb,
  boolean,
  numeric,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// --- Projects ---------------------------------------------------------------

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  version: integer("version").notNull().default(1),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// --- Project Versions -------------------------------------------------------

export const projectVersions = pgTable(
  "project_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").notNull(), // { components, cables, metadata }
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("project_version_idx").on(table.projectId, table.version),
    index("project_id_idx").on(table.projectId),
  ]
);

// --- Project Events ---------------------------------------------------------

export const projectEvents = pgTable(
  "project_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    projectVersionId: uuid("project_version_id").references(() => projectVersions.id, {
      onDelete: "set null",
    }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("event_project_id_idx").on(table.projectId)]
);

// --- Project Settings -------------------------------------------------------

export const projectSettings = pgTable("project_settings", {
  projectId: uuid("project_id")
    .primaryKey()
    .references(() => projects.id, { onDelete: "cascade" }),
  frequency: integer("frequency").notNull().default(50),
  tickHz: integer("tick_hz").notNull().default(10),
  ambientTemperature: numeric("ambient_temperature").notNull().default("20"),
  snapEnabled: boolean("snap_enabled").notNull().default(true),
});
