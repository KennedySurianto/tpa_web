package model

type Signal struct {
	Sender          uint32
	Receiver        uint32
	Type            string
	SDPorCandidate  string
}
