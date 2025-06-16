module github.com/KennedySurianto/tpa_web/backend/user-service

go 1.24.3

require (
	gorm.io/driver/postgres v1.5.11
)

require (
	golang.org/x/net v0.37.0 // indirect
	golang.org/x/sys v0.31.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250512202823-5a2f75b736a9 // indirect
	google.golang.org/protobuf v1.36.6 // indirect
)

require (
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/pgx/v5 v5.5.5 // indirect
	github.com/jackc/puddle/v2 v2.2.1 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	golang.org/x/crypto v0.36.0 // indirect
	golang.org/x/sync v0.12.0 // indirect
	golang.org/x/text v0.23.0 // indirect
	google.golang.org/grpc v1.72.1
	gorm.io/gorm v1.26.1
	github.com/KennedySurianto/tpa_web/backend/shared v0.0.0
)

replace github.com/KennedySurianto/tpa_web/backend/shared => ../shared
