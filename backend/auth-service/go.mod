module github.com/KennedySurianto/tpa_web/backend/auth-service

go 1.24.3

require (
	github.com/KennedySurianto/tpa_web/backend/middleware v0.0.0
	golang.org/x/crypto v0.36.0
	google.golang.org/grpc v1.73.0
)

require (
	github.com/aead/chacha20 v0.0.0-20180709150244-8b13a72661da // indirect
	github.com/aead/chacha20poly1305 v0.0.0-20170617001512-233f39982aeb // indirect
	github.com/aead/poly1305 v0.0.0-20180717145839-3fee0db0b635 // indirect
	github.com/o1egl/paseto v1.0.0 // indirect
	github.com/pkg/errors v0.8.0 // indirect
)

require (
	github.com/KennedySurianto/tpa_web/backend/shared v0.0.0
	github.com/bradfitz/gomemcache v0.0.0-20250403215159-8d39553ac7cf
	golang.org/x/net v0.38.0 // indirect
	golang.org/x/sys v0.31.0 // indirect
	golang.org/x/text v0.23.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250512202823-5a2f75b736a9 // indirect
	google.golang.org/protobuf v1.36.6 // indirect
)

replace github.com/KennedySurianto/tpa_web/backend/shared => ../shared

replace github.com/KennedySurianto/tpa_web/backend/middleware => ../middleware
