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
	AdminAssets = "admin_assets",
	ExtractedAssets = "extracted_assets",
	MatchLogs = "match_logs",
	Reports = "reports",
	Users = "users",
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

export enum AdminAssetsCategoryOptions {
	"cash" = "cash",
	"deposit" = "deposit",
	"stock" = "stock",
	"etf" = "etf",
	"bond" = "bond",
	"fund" = "fund",
	"pension" = "pension",
	"crypto" = "crypto",
	"real_estate" = "real_estate",
	"reits" = "reits",
	"commodity_gold" = "commodity_gold",
	"insurance" = "insurance",
	"car" = "car",
	"etc" = "etc",
}

export enum AdminAssetsGroupTypeOptions {
	"liquid" = "liquid",
	"risk" = "risk",
	"defensive" = "defensive",
	"real" = "real",
}

export enum AdminAssetsTagsOptions {
	"growth" = "growth",
	"income" = "income",
	"blend" = "blend",
	"low_vol" = "low_vol",
	"high_risk" = "high_risk",
	"stable" = "stable",
	"theme" = "theme",
	"inflation_hedge" = "inflation_hedge",
	"retirement" = "retirement",
	"tax_benefit" = "tax_benefit",
}

export enum AdminAssetsSectorsOptions {
	"it_software" = "it_software",
	"semiconductor" = "semiconductor",
	"hardware_equipment" = "hardware_equipment",
	"telecom" = "telecom",
	"internet_platform" = "internet_platform",
	"finance" = "finance",
	"bank" = "bank",
	"insurance" = "insurance",
	"securities_asset_mgmt" = "securities_asset_mgmt",
	"healthcare" = "healthcare",
	"biotech_pharma" = "biotech_pharma",
	"consumer_discretionary" = "consumer_discretionary",
	"consumer_staples" = "consumer_staples",
	"retail" = "retail",
	"auto" = "auto",
	"industrials" = "industrials",
	"materials" = "materials",
	"energy" = "energy",
	"utilities" = "utilities",
	"real_estate" = "real_estate",
	"transportation_logistics" = "transportation_logistics",
	"media_entertainment" = "media_entertainment",
	"education" = "education",
	"construction" = "construction",
}
export type AdminAssetsRecord = {
	alias1?: string
	alias2?: string
	alias3?: string
	category: AdminAssetsCategoryOptions
	created: IsoAutoDateString
	groupType: AdminAssetsGroupTypeOptions
	id: string
	name: string
	sectors?: AdminAssetsSectorsOptions[]
	tags?: AdminAssetsTagsOptions[]
	updated: IsoAutoDateString
}

export enum ExtractedAssetsCategoryOptions {
	"cash" = "cash",
	"deposit" = "deposit",
	"stock" = "stock",
	"etf" = "etf",
	"bond" = "bond",
	"fund" = "fund",
	"pension" = "pension",
	"crypto" = "crypto",
	"real_estate" = "real_estate",
	"reits" = "reits",
	"commodity_gold" = "commodity_gold",
	"insurance" = "insurance",
	"car" = "car",
	"etc" = "etc",
}
export type ExtractedAssetsRecord = {
	adminAssetId?: RecordIdString
	amount: number
	category: ExtractedAssetsCategoryOptions
	created: IsoAutoDateString
	id: string
	profit?: number
	profitRate?: number
	quantity?: number
	rawName: string
	reportId: RecordIdString
	updated: IsoAutoDateString
}

export enum MatchLogsMatchedByOptions {
	"exact" = "exact",
	"alias" = "alias",
	"ai" = "ai",
}

export enum MatchLogsStatusOptions {
	"pending" = "pending",
	"confirmed" = "confirmed",
	"rejected" = "rejected",
}
export type MatchLogsRecord = {
	adminAssetId?: RecordIdString
	confidence?: number
	created: IsoAutoDateString
	id: string
	matchedBy: MatchLogsMatchedByOptions
	rawName: string
	reportId: RecordIdString
	status: MatchLogsStatusOptions
	updated: IsoAutoDateString
}

export enum ReportsStatusOptions {
	"pending" = "pending",
	"processing" = "processing",
	"done" = "done",
	"failed" = "failed",
}
export type ReportsRecord = {
	baseCurrency: string
	created: IsoAutoDateString
	id: string
	sourceImageHash: string
	sourceImageUrl: string
	status?: ReportsStatusOptions
	totalProfit?: number
	totalProfitRate?: number
	totalValue: number
	updated: IsoAutoDateString
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

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type AdminAssetsResponse<Texpand = unknown> = Required<AdminAssetsRecord> & BaseSystemFields<Texpand>
export type ExtractedAssetsResponse<Texpand = unknown> = Required<ExtractedAssetsRecord> & BaseSystemFields<Texpand>
export type MatchLogsResponse<Texpand = unknown> = Required<MatchLogsRecord> & BaseSystemFields<Texpand>
export type ReportsResponse<Texpand = unknown> = Required<ReportsRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	admin_assets: AdminAssetsRecord
	extracted_assets: ExtractedAssetsRecord
	match_logs: MatchLogsRecord
	reports: ReportsRecord
	users: UsersRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	admin_assets: AdminAssetsResponse
	extracted_assets: ExtractedAssetsResponse
	match_logs: MatchLogsResponse
	reports: ReportsResponse
	users: UsersResponse
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
