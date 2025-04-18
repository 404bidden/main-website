import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('user', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    name: text('name'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    emailVerified: boolean('email_verified').notNull(),
    image: text('image'),
});

export const routes = pgTable('Route', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    url: text('url').notNull(),
    method: text('method').notNull(),
    requestHeaders: jsonb('requestHeaders'),
    requestBody: text('requestBody'),
    expectedStatusCode: integer('expected_status_code'),
    responseTimeThreshold: integer('response_time_threshold'),
    monitoringInterval: integer('monitoring_interval').default(5),
    retries: integer('retries'),
    alertEmail: text('alert_email'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
});

export const requestLog = pgTable('RequestLog', {
    id: uuid('id').defaultRandom().primaryKey(),
    statusCode: integer('status_code'),
    responseTime: integer('response_time'),
    isSuccess: boolean('is_success').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    routeId: uuid('route_id')
        .notNull()
        .references(() => routes.id, { onDelete: 'cascade' }),
});

export const accounts = pgTable('account', {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const sessions = pgTable('session', {
    id: uuid('id').defaultRandom().primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
});

export const verifications = pgTable('verification', {
    id: uuid('id').defaultRandom().primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});