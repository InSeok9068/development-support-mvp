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
	Clothes = "clothes",
	RecommendationItems = "recommendation_items",
	RecommendationSessions = "recommendation_sessions",
	Users = "users",
	WearLogs = "wear_logs",
}

// Alias types for improved usability
export type IsoDateString = string
export type IsoAutoDateString = string & { readonly autodate: unique symbol }
export type RecordIdString = string
export type FileNameString = string & { readonly filename: unique symbol }
export type HTMLString = string

type ExpandType<T> = unknown extends T
	? T extends unknown
		? { expand?: unknown }
		: { expand: T }
	: { expand: T }

// System fields
export type BaseSystemFields<T = unknown> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
} & ExpandType<T>

export type AuthSystemFields<T = unknown> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated: IsoAutoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated: IsoAutoDateString
}

export type MfasRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	method: string
	recordRef: string
	updated: IsoAutoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated: IsoAutoDateString
}

export type SuperusersRecord = {
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated: IsoAutoDateString
	verified?: boolean
}

export enum ClothesSourceTypeOptions {
	"upload" = "upload",
	"url" = "url",
}

export enum ClothesStateOptions {
	"uploaded" = "uploaded",
	"preprocessing" = "preprocessing",
	"analyzing" = "analyzing",
	"embedding" = "embedding",
	"done" = "done",
	"failed" = "failed",
}

export enum ClothesErrorCodeOptions {
	"image_decode_error" = "image_decode_error",
	"ai_timeout" = "ai_timeout",
	"ai_invalid_json" = "ai_invalid_json",
	"embedding_error" = "embedding_error",
}

export enum ClothesCategoryOptions {
	"top" = "top",
	"bottom" = "bottom",
	"shoes" = "shoes",
	"accessory" = "accessory",
}

export enum ClothesSeasonsOptions {
	"spring" = "spring",
	"summer" = "summer",
	"fall" = "fall",
	"winter" = "winter",
}

export enum ClothesColorsOptions {
	"red" = "red",
	"orange" = "orange",
	"yellow" = "yellow",
	"green" = "green",
	"blue" = "blue",
	"navy" = "navy",
	"purple" = "purple",
	"pink" = "pink",
	"white" = "white",
	"gray" = "gray",
	"black" = "black",
	"brown" = "brown",
	"beige" = "beige",
}

export enum ClothesStylesOptions {
	"street" = "street",
	"casual" = "casual",
	"classic" = "classic",
	"minimal" = "minimal",
	"sporty" = "sporty",
	"feminine" = "feminine",
	"vintage" = "vintage",
	"workwear" = "workwear",
	"formal" = "formal",
	"chic" = "chic",
}

export enum ClothesFitOptions {
	"oversized" = "oversized",
	"slim" = "slim",
	"wide" = "wide",
	"loose" = "loose",
	"regular" = "regular",
}

export enum ClothesMaterialsOptions {
	"cotton" = "cotton",
	"knit" = "knit",
	"leather" = "leather",
	"denim" = "denim",
	"wool" = "wool",
	"linen" = "linen",
	"polyester" = "polyester",
	"nylon" = "nylon",
	"silk" = "silk",
}

export enum ClothesContextsOptions {
	"daily" = "daily",
	"work" = "work",
	"wedding" = "wedding",
	"date" = "date",
	"travel" = "travel",
	"exercise" = "exercise",
	"party" = "party",
	"formal_event" = "formal_event",
}
export type ClothesRecord<Tembedding = unknown> = {
	category?: ClothesCategoryOptions
	colors?: ClothesColorsOptions[]
	contexts?: ClothesContextsOptions[]
	created: IsoAutoDateString
	embedding?: null | Tembedding
	embeddingModel?: string
	errorCode?: ClothesErrorCodeOptions
	errorMessage?: string
	fit?: ClothesFitOptions
	id: string
	imageHash?: string
	lastWornAt?: IsoDateString
	materials?: ClothesMaterialsOptions[]
	maxRetry?: number
	preferenceScore?: number
	retryCount?: number
	seasons?: ClothesSeasonsOptions[]
	sourceImage?: FileNameString
	sourceType: ClothesSourceTypeOptions
	sourceUrl?: string
	state: ClothesStateOptions
	styles?: ClothesStylesOptions[]
	updated: IsoAutoDateString
	user: RecordIdString
}

export enum RecommendationItemsCategoryOptions {
	"top" = "top",
	"bottom" = "bottom",
	"shoes" = "shoes",
	"accessory" = "accessory",
}
export type RecommendationItemsRecord = {
	category: RecommendationItemsCategoryOptions
	clothes: RecordIdString
	created: IsoAutoDateString
	id: string
	isPinned?: boolean
	isSelected?: boolean
	rank: number
	round?: number
	session: RecordIdString
	similarity: number
	updated: IsoAutoDateString
	user: RecordIdString
}

export enum RecommendationSessionsStateOptions {
	"done" = "done",
	"failed" = "failed",
}
export type RecommendationSessionsRecord<TqueryEmbedding = unknown, TqueryFilter = unknown> = {
	created: IsoAutoDateString
	errorCode?: string
	errorMessage?: string
	id: string
	queryEmbedding?: null | TqueryEmbedding
	queryFilter?: null | TqueryFilter
	queryText: string
	state: RecommendationSessionsStateOptions
	topK?: number
	updated: IsoAutoDateString
	user: RecordIdString
}

export type UsersRecord = {
	avatar?: FileNameString
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	id: string
	name?: string
	password: string
	tokenKey: string
	updated: IsoAutoDateString
	verified?: boolean
}

export type WearLogsRecord = {
	created: IsoAutoDateString
	id: string
	items: RecordIdString[]
	note?: string
	session?: RecordIdString
	updated: IsoAutoDateString
	user: RecordIdString
	wornDate: IsoDateString
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type ClothesResponse<Tembedding = unknown, Texpand = unknown> = Required<ClothesRecord<Tembedding>> & BaseSystemFields<Texpand>
export type RecommendationItemsResponse<Texpand = unknown> = Required<RecommendationItemsRecord> & BaseSystemFields<Texpand>
export type RecommendationSessionsResponse<TqueryEmbedding = unknown, TqueryFilter = unknown, Texpand = unknown> = Required<RecommendationSessionsRecord<TqueryEmbedding, TqueryFilter>> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>
export type WearLogsResponse<Texpand = unknown> = Required<WearLogsRecord> & BaseSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	clothes: ClothesRecord
	recommendation_items: RecommendationItemsRecord
	recommendation_sessions: RecommendationSessionsRecord
	users: UsersRecord
	wear_logs: WearLogsRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	clothes: ClothesResponse
	recommendation_items: RecommendationItemsResponse
	recommendation_sessions: RecommendationSessionsResponse
	users: UsersResponse
	wear_logs: WearLogsResponse
}

// Utility types for create/update operations

type ProcessCreateAndUpdateFields<T> = Omit<{
	// Omit AutoDate fields
	[K in keyof T as Extract<T[K], IsoAutoDateString> extends never ? K : never]: 
		// Convert FileNameString to File
		T[K] extends infer U ? 
			U extends (FileNameString | FileNameString[]) ? 
				U extends any[] ? File[] : File 
			: U
		: never
}, 'id'>

// Create type for Auth collections
export type CreateAuth<T> = {
	id?: RecordIdString
	email: string
	emailVisibility?: boolean
	password: string
	passwordConfirm: string
	verified?: boolean
} & ProcessCreateAndUpdateFields<T>

// Create type for Base collections
export type CreateBase<T> = {
	id?: RecordIdString
} & ProcessCreateAndUpdateFields<T>

// Update type for Auth collections
export type UpdateAuth<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof AuthSystemFields>
> & {
	email?: string
	emailVisibility?: boolean
	oldPassword?: string
	password?: string
	passwordConfirm?: string
	verified?: boolean
}

// Update type for Base collections
export type UpdateBase<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof BaseSystemFields>
>

// Get the correct create type for any collection
export type Create<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? CreateAuth<CollectionRecords[T]>
		: CreateBase<CollectionRecords[T]>

// Get the correct update type for any collection
export type Update<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? UpdateAuth<CollectionRecords[T]>
		: UpdateBase<CollectionRecords[T]>

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = {
	collection<T extends keyof CollectionResponses>(
		idOrName: T
	): RecordService<CollectionResponses[T]>
} & PocketBase
