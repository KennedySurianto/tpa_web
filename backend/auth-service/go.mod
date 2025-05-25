module github.com/KennedySurianto/tpa_web/backend/auth-service

go 1.24.3

require (
	github.com/golang-jwt/jwt/v5 v5.0.0
	golang.org/x/crypto v0.36.0
	google.golang.org/grpc v1.72.1
)

require (
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.26.3 // indirect
	golang.org/x/net v0.37.0 // indirect
	golang.org/x/sys v0.31.0 // indirect
	golang.org/x/text v0.23.0 // indirect
	google.golang.org/genproto/googleapis/api v0.0.0-20250519155744-55703ea1f237 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250512202823-5a2f75b736a9 // indirect
	google.golang.org/protobuf v1.36.6 // indirect
	github.com/KennedySurianto/tpa_web/backend/shared v0.0.0
)

replace github.com/KennedySurianto/tpa_web/backend/shared => ../shared