module github.com/KennedySurianto/tpa_web/gateway

go 1.24.3

require (
	github.com/KennedySurianto/tpa_web/shared v0.0.0-00010101000000-000000000000
	google.golang.org/grpc v1.72.1
)

require google.golang.org/genproto/googleapis/api v0.0.0-20250519155744-55703ea1f237 // indirect

require (
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.26.3
	golang.org/x/net v0.37.0 // indirect
	golang.org/x/sys v0.31.0 // indirect
	golang.org/x/text v0.23.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250512202823-5a2f75b736a9 // indirect
	google.golang.org/protobuf v1.36.6 // indirect
)

replace github.com/KennedySurianto/tpa_web/shared => ../shared
