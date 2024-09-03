/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Codes = "codes",
	Developers = "developers",
	Notifications = "notifications",
	ScheduledNotifications = "scheduledNotifications",
	Settings = "settings",
	Users = "users",
	Works = "works",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

// System fields
export type BaseSystemFields<T = never> = {
	id: RecordIdString
	created: IsoDateString
	updated: IsoDateString
	collectionId: string
	collectionName: Collections
	expand?: T
}

export type AuthSystemFields<T = never> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type CodesRecord = {
	class?: string
	del?: boolean
	desc?: string
	sort?: number
	type?: string
	value?: string
}

export type DevelopersRecord = {
	del?: boolean
	leader?: boolean
	name: string
	sort: number
	user: RecordIdString
}

export type NotificationsRecord = {
	message?: string
	read?: boolean
	title: string
	user: RecordIdString
}

export type ScheduledNotificationsRecord = {
	message?: string
	time?: IsoDateString
	title: string
	user: RecordIdString
}

export type SettingsRecord<Tdata = unknown> = {
	data?: null | Tdata
	user: RecordIdString
}

export type UsersRecord = {
	name?: string
}

export type WorksRecord = {
	content?: HTMLString
	contentBoxHeight?: number
	developer?: RecordIdString
	done?: boolean
	doneDate?: IsoDateString
	dueDate?: IsoDateString
	file?: string
	joplin?: string
	redmine?: string
	scheduledNotifications?: RecordIdString[]
	sort?: number
	state?: string
	time?: number
	title: string
	user: RecordIdString
}

// Response types include system fields and match responses from the PocketBase API
export type CodesResponse<Texpand = unknown> = Required<CodesRecord> & BaseSystemFields<Texpand>
export type DevelopersResponse<Texpand = unknown> = Required<DevelopersRecord> & BaseSystemFields<Texpand>
export type NotificationsResponse<Texpand = unknown> = Required<NotificationsRecord> & BaseSystemFields<Texpand>
export type ScheduledNotificationsResponse<Texpand = unknown> = Required<ScheduledNotificationsRecord> & BaseSystemFields<Texpand>
export type SettingsResponse<Tdata = unknown, Texpand = unknown> = Required<SettingsRecord<Tdata>> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>
export type WorksResponse<Texpand = unknown> = Required<WorksRecord> & BaseSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	codes: CodesRecord
	developers: DevelopersRecord
	notifications: NotificationsRecord
	scheduledNotifications: ScheduledNotificationsRecord
	settings: SettingsRecord
	users: UsersRecord
	works: WorksRecord
}

export type CollectionResponses = {
	codes: CodesResponse
	developers: DevelopersResponse
	notifications: NotificationsResponse
	scheduledNotifications: ScheduledNotificationsResponse
	settings: SettingsResponse
	users: UsersResponse
	works: WorksResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: 'codes'): RecordService<CodesResponse>
	collection(idOrName: 'developers'): RecordService<DevelopersResponse>
	collection(idOrName: 'notifications'): RecordService<NotificationsResponse>
	collection(idOrName: 'scheduledNotifications'): RecordService<ScheduledNotificationsResponse>
	collection(idOrName: 'settings'): RecordService<SettingsResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
	collection(idOrName: 'works'): RecordService<WorksResponse>
}
