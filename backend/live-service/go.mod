module github.com/KennedySurianto/tpa_web/backend/live-service

go 1.24.3

require (
	github.com/KennedySurianto/tpa_web/backend/shared v0.0.0
	google.golang.org/grpc v1.72.1
)

require (
	golang.org/x/net v0.35.0 // indirect
	golang.org/x/sys v0.30.0 // indirect
	golang.org/x/text v0.22.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250303144028-a0af3efb3deb // indirect
	google.golang.org/protobuf v1.36.6 // indirect
)

replace github.com/KennedySurianto/tpa_web/backend/shared => ../shared
