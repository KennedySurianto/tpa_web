package main

import (
	"crypto/ed25519"
	"encoding/base64"
	"fmt"
)

func main() {
	_, priv, _ := ed25519.GenerateKey(nil)
	fmt.Println("PASETO_PRIVATE_KEY (base64):", base64.StdEncoding.EncodeToString(priv))
}
