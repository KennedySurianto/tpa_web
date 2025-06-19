package controller

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/service"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/follow"
	userpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
)

type FollowController struct {
	pb.UnimplementedFollowServiceServer
	svc service.FollowService
	userClient userpb.UserServiceClient
}

func NewFollowController(svc service.FollowService, userClient userpb.UserServiceClient) *FollowController {
	return &FollowController{
		svc: svc,
		userClient: userClient,
	}
}

func (c *FollowController) Follow(ctx context.Context, req *pb.FollowRequest) (*pb.Empty, error) {
	err := c.svc.FollowUser(uint(req.FollowerId), uint(req.FollowedId))
	return &pb.Empty{}, err
}

func (c *FollowController) Unfollow(ctx context.Context, req *pb.FollowRequest) (*pb.Empty, error) {
	err := c.svc.UnfollowUser(uint(req.FollowerId), uint(req.FollowedId))
	return &pb.Empty{}, err
}

func (c *FollowController) GetFollowers(ctx context.Context, req *pb.UserRequest) (*pb.FollowList, error) {
	follows, err := c.svc.GetFollowers(uint(req.UserId))
	if err != nil {
		return nil, err
	}

	var items []*pb.FollowItem
	for _, f := range follows {
		userResp, err := c.userClient.GetUserById(ctx, &userpb.GetUserByIdRequest{Id: uint64(f.FollowerID)})
		if err != nil {
			continue // or handle error appropriately
		}
		items = append(items, &pb.FollowItem{
			FollowerId: uint32(f.FollowerID),
			FollowedId: uint32(f.FollowedID),
			User:       userResp,
		})
	}

	return &pb.FollowList{Follows: items}, nil
}

func (c *FollowController) GetFollowing(ctx context.Context, req *pb.UserRequest) (*pb.FollowList, error) {
	follows, err := c.svc.GetFollowing(uint(req.UserId))
	if err != nil {
		return nil, err
	}

	var items []*pb.FollowItem
	for _, f := range follows {
		userResp, err := c.userClient.GetUserById(ctx, &userpb.GetUserByIdRequest{Id: uint64(f.FollowedID)})
		if err != nil {
			continue // or handle error appropriately
		}
		items = append(items, &pb.FollowItem{
			FollowerId: uint32(f.FollowerID),
			FollowedId: uint32(f.FollowedID),
			User:       userResp,
		})
	}

	return &pb.FollowList{Follows: items}, nil
}
