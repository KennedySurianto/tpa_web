package controller

import (
	"context"
	"log"
	"time"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/signaling"
	"github.com/KennedySurianto/tpa_web/backend/signaling-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/signaling-service/internal/service"
)

type SignalingController struct {
	pb.UnimplementedSignalingServiceServer
	service service.SignalingService
}

func NewSignalingController(s service.SignalingService) *SignalingController {
	return &SignalingController{service: s}
}

func (c *SignalingController) JoinRoom(req *pb.JoinRequest, stream pb.SignalingService_JoinRoomServer) error {
	ctx := stream.Context()
	userID := req.UserId

	ch := c.service.JoinRoom(userID)
	log.Printf("📡 User %d joined signaling room\n", userID)

	// Heartbeat goroutine (optional tapi recommended untuk jaga koneksi)
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				log.Printf("❌ Heartbeat stopped: user %d disconnected\n", userID)
				return
			case <-ticker.C:
				err := stream.Send(&pb.SignalMessage{
					Sender:   0,
					Receiver: userID,
					Type:     "ping",
				})
				if err != nil {
					log.Printf("Heartbeat send error: %v\n", err)
					return
				}
			}
		}
	}()

	// Main loop to send real signals
	for {
		select {
		case <-ctx.Done():
			log.Printf("❌ Client %d disconnected from JoinRoom\n", userID)
			return nil
		case signal := <-ch:
			err := stream.Send(&pb.SignalMessage{
				Sender:         signal.Sender,
				Receiver:       signal.Receiver,
				Type:           signal.Type,
				SdpOrCandidate: signal.SDPorCandidate,
			})
			if err != nil {
				log.Printf("Stream send error: %v\n", err)
				return err
			}
		}
	}
}

func (c *SignalingController) SendSignal(_ context.Context, req *pb.SignalMessage) (*pb.Empty, error) {
	c.service.SendSignal(model.Signal{
		Sender:         req.Sender,
		Receiver:       req.Receiver,
		Type:           req.Type,
		SDPorCandidate: req.SdpOrCandidate,
	})
	return &pb.Empty{}, nil
}
