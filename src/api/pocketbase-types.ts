/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Authorigins = "_authOrigins",
	Externalauths = "_externalAuths",
	Mfas = "_mfas",
	Otps = "_otps",
	Superusers = "_superusers",
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

export type AuthoriginsRecord = {
	collectionRef: string
	created?: IsoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated?: IsoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated?: IsoDateString
}

export type MfasRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	method: string
	recordRef: string
	updated?: IsoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated?: IsoDateString
}

export type SuperusersRecord = {
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

export type CodesRecord = {
	class?: string
	created?: IsoDateString
	del?: boolean
	desc?: string
	id: string
	sort?: number
	type?: string
	updated?: IsoDateString
	value?: string
}

export type DevelopersRecord = {
	created?: IsoDateString
	del?: boolean
	id: string
	leader?: boolean
	name: string
	sort: number
	updated?: IsoDateString
	user: RecordIdString
}

export type NotificationsRecord = {
	created?: IsoDateString
	id: string
	message?: string
	read?: boolean
	title: string
	updated?: IsoDateString
	user: RecordIdString
}

export type ScheduledNotificationsRecord = {
	created?: IsoDateString
	id: string
	message?: string
	time?: IsoDateString
	title: string
	updated?: IsoDateString
	user: RecordIdString
}

export type SettingsRecord<Tdata = unknown> = {
	created?: IsoDateString
	data?: null | Tdata
	id: string
	updated?: IsoDateString
	user: RecordIdString
}

export type UsersRecord = {
	created?: IsoDateString
	email?: string
	emailVisibility?: boolean
	id: string
	name?: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	username: string
	verified?: boolean
}

export type WorksRecord = {
	content?: HTMLString
	contentBoxHeight?: number
	created?: IsoDateString
	developer?: RecordIdString
	done?: boolean
	doneDate?: IsoDateString
	dueDate?: IsoDateString
	file?: string
	id: string
	joplin?: string
	redmine?: string
	scheduledNotifications?: RecordIdString[]
	sort?: number
	state?: string
	time?: number
	title: string
	updated?: IsoDateString
	user: RecordIdString
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type CodesResponse<Texpand = unknown> = Required<CodesRecord> & BaseSystemFields<Texpand>
export type DevelopersResponse<Texpand = unknown> = Required<DevelopersRecord> & BaseSystemFields<Texpand>
export type NotificationsResponse<Texpand = unknown> = Required<NotificationsRecord> & BaseSystemFields<Texpand>
export type ScheduledNotificationsResponse<Texpand = unknown> = Required<ScheduledNotificationsRecord> & BaseSystemFields<Texpand>
export type SettingsResponse<Tdata = unknown, Texpand = unknown> = Required<SettingsRecord<Tdata>> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>
export type WorksResponse<Texpand = unknown> = Required<WorksRecord> & BaseSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	codes: CodesRecord
	developers: DevelopersRecord
	notifications: NotificationsRecord
	scheduledNotifications: ScheduledNotificationsRecord
	settings: SettingsRecord
	users: UsersRecord
	works: WorksRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
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
	collection(idOrName: '_authOrigins'): RecordService<AuthoriginsResponse>
	collection(idOrName: '_externalAuths'): RecordService<ExternalauthsResponse>
	collection(idOrName: '_mfas'): RecordService<MfasResponse>
	collection(idOrName: '_otps'): RecordService<OtpsResponse>
	collection(idOrName: '_superusers'): RecordService<SuperusersResponse>
	collection(idOrName: 'codes'): RecordService<CodesResponse>
	collection(idOrName: 'developers'): RecordService<DevelopersResponse>
	collection(idOrName: 'notifications'): RecordService<NotificationsResponse>
	collection(idOrName: 'scheduledNotifications'): RecordService<ScheduledNotificationsResponse>
	collection(idOrName: 'settings'): RecordService<SettingsResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
	collection(idOrName: 'works'): RecordService<WorksResponse>
}
