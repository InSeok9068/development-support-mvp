/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Developers = "developers",
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

export type DevelopersRecord = {
	name: string
	sort: number
	works?: RecordIdString[]
}

export type UsersRecord = {
	avatar?: string
	name?: string
}

export type WorksRecord = {
	content?: HTMLString
	developer?: RecordIdString
	done?: boolean
	dueDate?: IsoDateString
	file?: string[]
	joplin?: string
	redmine?: string
	time?: number
	title: string
	userId: string
}

// Response types include system fields and match responses from the PocketBase API
export type DevelopersResponse<Texpand = unknown> = Required<DevelopersRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>
export type WorksResponse<Texpand = unknown> = Required<WorksRecord> & BaseSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	developers: DevelopersRecord
	users: UsersRecord
	works: WorksRecord
}

export type CollectionResponses = {
	developers: DevelopersResponse
	users: UsersResponse
	works: WorksResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: 'developers'): RecordService<DevelopersResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
	collection(idOrName: 'works'): RecordService<WorksResponse>
}
